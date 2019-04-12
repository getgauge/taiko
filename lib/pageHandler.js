const { createJsDialogEventName } = require('./util');
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

const handleNavigation = async (url, action) => {
    let responsePromise = new Promise((resolve) => {
        xhrEvent.addListener('responseReceived', resolve);
    });
    const { errorText } = await action(url);
    if (errorText)
        throw new Error(`Navigation to url ${url} failed.\n REASON: ${errorText}`);
    let { status, statusText } = await responsePromise;
    if (status.toString().match(/(4|5)\d+/))
        throw new Error(`Navigation to url ${url} failed.\n REASON: ${statusText}`);
};

module.exports = { setPage, handleNavigation };