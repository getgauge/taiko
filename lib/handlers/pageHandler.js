const { createJsDialogEventName } = require('../util');
const { handleUrlRedirection } = require('../helper');
const eventHandler = require('../eventBus');
const logEvent = require('../logger');
const nodeURL = require('url');
const path = require('path');
const { isSelector, elements } = require('../elementSearch');
const fs = require('fs');
let page, framePromises, frameNavigationPromise;

eventHandler.on('createdSession', async (client) => {
    page = client.Page;
    framePromises = {};
    frameNavigationPromise = {};
    await page.bringToFront();
    page.domContentEventFired(() => {
        logEvent('DOMContentLoaded');
        client.DOM.getDocument();
    });
    page.frameScheduledNavigation(emitFrameNavigationEvent);
    page.frameClearedScheduledNavigation(resolveFrameNavigationEvent);
    page.frameNavigated(resolveFrameNavigationEvent);
    page.frameStartedLoading(emitFrameEvent);
    page.frameStoppedLoading(resolveFrameEvent);
    page.loadEventFired(p => {
        logEvent('LoadEventFired');
        eventHandler.emit('loadEventFired', p);
    });
    page.setLifecycleEventsEnabled({ enabled: true });
    page.lifecycleEvent((p) => {
        logEvent('Lifecyle event: ' + p.name);
        eventHandler.emit(p.name, p);
    });
    page.javascriptDialogOpening(({ message, type }) => {
        eventHandler.emit(createJsDialogEventName(message, type), { message: message, type: type });
    });
});

const resetPromises = () => {
    frameNavigationPromise = {};
    framePromises = {};
};

const emitFrameNavigationEvent = p => {
    if (!(frameNavigationPromise && frameNavigationPromise[p.frameId])) {
        logEvent('Frame navigation started: ' + p.frameId);
        let resolve;
        eventHandler.emit('frameNavigationEvent', new Promise((r) => { resolve = r; }));
        frameNavigationPromise[p.frameId] = resolve;
    }
};

const resolveFrameNavigationEvent = p => {
    const frameId = p.frameId ? p.frameId : p.frame.frameId;
    if (frameNavigationPromise && frameNavigationPromise[frameId]) {
        logEvent('Frame navigation resolved: ' + frameId);
        frameNavigationPromise[frameId]();
        delete frameNavigationPromise[frameId];
    }
};

const emitFrameEvent = p => {
    if (!(framePromises && framePromises[p.frameId])) {
        logEvent('Frame load started: ' + p.frameId);
        let resolve;
        eventHandler.emit('frameEvent', new Promise((r) => { resolve = r; }));
        framePromises[p.frameId] = resolve;
    }
};

const resolveFrameEvent = p => {
    if (framePromises && framePromises[p.frameId]) {
        logEvent('Frame load resolved: ' + p.frameId);
        framePromises[p.frameId]();
        delete framePromises[p.frameId];
    }
};

const captureScreenshot = async (domHandler, selector, options) => {
    if (selector && !isSelector(selector)) options = selector;
    options.path = options.path || `Screenshot-${Date.now()}.png`;
    let screenShot;
    let clip;
    if (isSelector(selector)) {
        if (options.fullPage) console.warn('Ignoring fullPage screenshot as custom selector is found!');
        let padding = options.padding || 0;
        let elems = await elements(selector);
        const { x, y, width, height } = await domHandler.boundBox(elems[0]);
        clip = {
            x: x - padding,
            y: y - padding,
            width: width + padding * 2,
            height: height + padding * 2,
            scale: 1
        };
        screenShot = await page.captureScreenshot({ clip });
    } else if (options.fullPage) {
        const metrics = await page.getLayoutMetrics();
        const width = Math.ceil(metrics.contentSize.width);
        const height = Math.ceil(metrics.contentSize.height);
        clip = { x: 0, y: 0, width, height, scale: 1 };
        screenShot = await page.captureScreenshot({ clip });
    } else {
        screenShot = await page.captureScreenshot();
    }
    if (options.encoding === 'base64') return screenShot.data;
    fs.writeFileSync(options.path, Buffer.from(screenShot.data, 'base64'));
};

const handleNavigation = async (url) => {
    let resolveResponse, requestId;

    const handleRequest = (request) => {
        if (!request.request || !request.request.url) return;
        let requestUrl = request.request.urlFragment !== undefined && request.request.urlFragment !== null ?
            request.request.url + request.request.urlFragment : request.request.url;
        let urlToNavigate = handleUrlRedirection(nodeURL.parse(url).href);
        requestUrl = handleUrlRedirection(nodeURL.parse(requestUrl).href);
        if (urlToNavigate.startsWith('file:')) {
            urlToNavigate = path.normalize(urlToNavigate);
            requestUrl = path.normalize(requestUrl);
        }
        if (requestUrl === urlToNavigate) requestId = request.requestId;
    };
    eventHandler.addListener('requestStarted', handleRequest);

    const handleResponseStatus = (response) => {
        if (requestId === response.requestId) resolveResponse(response.response);
    };
    const responsePromise = new Promise((resolve) => {
        resolveResponse = resolve;
        eventHandler.addListener('responseReceived', handleResponseStatus);
    });

    const { errorText } = await page.navigate({ url: url });
    if (errorText)
        throw new Error(`Navigation to url ${url} failed.\n REASON: ${errorText}`);
    let { status, statusText } = await responsePromise;
    if (status >= 400)
        throw new Error(`Navigation to url ${url} failed.\n STATUS: ${status}, STATUS_TEXT: ${statusText}`);
    eventHandler.removeListener('responseReceived', handleResponseStatus);
    eventHandler.removeListener('requestStarted', handleRequest);
};

module.exports = { handleNavigation, resetPromises, captureScreenshot };