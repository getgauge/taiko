const { createJsDialogEventName } = require('./util');
const {handleUrlRedirection} = require('./helper');
const nodeURL = require('url');
const path = require('path');
let page, xhrEvent, logEvent, framePromises, frameNavigationPromise;

const setPage = async (pg, event, eventLogger, domContentCallback) => {
    logEvent = eventLogger;
    page = pg;
    xhrEvent = event;
    framePromises = {};
    frameNavigationPromise = {};
    await page.bringToFront();
    page.domContentEventFired(domContentCallback);
    page.frameScheduledNavigation(emitFrameNavigationEvent);
    page.frameClearedScheduledNavigation(resolveFrameNavigationEvent);
    page.frameNavigated(resolveFrameNavigationEvent);
    page.frameStartedLoading(emitFrameEvent);
    page.frameStoppedLoading(resolveFrameEvent);
    page.loadEventFired(p => {
        logEvent('LoadEventFired');
        xhrEvent.emit('loadEventFired', p);
    });
    page.setLifecycleEventsEnabled({ enabled: true });
    page.lifecycleEvent((p) => {
        logEvent('Lifecyle event: ' + p.name);
        xhrEvent.emit(p.name, p);
    });
    page.javascriptDialogOpening(({ message, type }) => {
        xhrEvent.emit(createJsDialogEventName(message, type), { message: message, type: type });
    });
};

const emitFrameNavigationEvent = p => {
    if (!(frameNavigationPromise && frameNavigationPromise[p.frameId])) {
        logEvent('Frame navigation started: ' + p.frameId);
        let resolve;
        xhrEvent.emit('frameNavigationEvent', new Promise((r) => { resolve = r; }));
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
        xhrEvent.emit('frameEvent', new Promise((r) => { resolve = r; }));
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

const handleNavigation = async (url) => {
    let resolveResponse, requestId;
    
    const handleRequest =  (request) => {
        if(!request.request || !request.request.url) return;
        let requestUrl = request.request.urlFragment !== undefined && request.request.urlFragment !== null ?
            request.request.url + request.request.urlFragment : request.request.url;
        let urlToNavigate = handleUrlRedirection(nodeURL.parse(url).href);
        requestUrl = handleUrlRedirection(nodeURL.parse(requestUrl).href);
        if(urlToNavigate.startsWith('file:')){
            urlToNavigate = path.normalize(urlToNavigate);
            requestUrl = path.normalize(requestUrl);
        }
        if(requestUrl === urlToNavigate) requestId = request.requestId;
    };
    xhrEvent.addListener('requestStarted', handleRequest);
    
    const handleResponseStatus =  (response) => {
        if(requestId === response.requestId)  resolveResponse(response.response);
    };
    const responsePromise = new Promise((resolve) => {
        resolveResponse = resolve;
        xhrEvent.addListener('responseReceived',handleResponseStatus);
    });
    
    const { errorText } = await page.navigate({ url: url });
    if (errorText)
        throw new Error(`Navigation to url ${url} failed.\n REASON: ${errorText}`);
    let { status, statusText } = await responsePromise;
    if (status >= 400 )
        throw new Error(`Navigation to url ${url} failed.\n STATUS: ${status}, STATUS_TEXT: ${statusText}`);
    xhrEvent.removeListener('responseReceived',handleResponseStatus);
    xhrEvent.removeListener('requestStarted', handleRequest);
};

module.exports = { setPage, handleNavigation };