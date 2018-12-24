let page, xhrEvent, framePromises = {}, frameNavigationPromise = {};

const setPage = async (pg, event, domContentCallback) => {
    page = pg;
    xhrEvent = event;
    await page.bringToFront();
    page.domContentEventFired(domContentCallback);
    page.frameScheduledNavigation(emitFrameNavigationEvent);
    page.frameClearedScheduledNavigation(resolveFrameNavigationEvent);
    page.frameNavigated(resolveFrameNavigationEvent);
    page.frameStartedLoading(emitFrameEvent);
    page.frameStoppedLoading(resolveFrameEvent);
    page.loadEventFired(p => {
        xhrEvent.emit('loadEventFired', p);
    });
    page.setLifecycleEventsEnabled({enabled:true});
    page.lifecycleEvent((p)=>{
        xhrEvent.emit(p.name, p);
    });
};

const emitFrameNavigationEvent = p => {
    if (!(frameNavigationPromise && frameNavigationPromise[p.frameId])) {
        let resolve;
        xhrEvent.emit('frameNavigationEvent', new Promise((r) => { resolve = r; }));
        frameNavigationPromise[p.frameId] = resolve;
    }
};

const resolveFrameNavigationEvent = p => {
    const frameId = p.frameId ? p.frameId : p.frame.frameId ;
    if (frameNavigationPromise && frameNavigationPromise[frameId]) {
        frameNavigationPromise[frameId]();
        delete frameNavigationPromise[frameId];
    }
};

const emitFrameEvent = p => {
    if (!(framePromises && framePromises[p.frameId])) {
        let resolve;
        xhrEvent.emit('frameEvent', new Promise((r) => { resolve = r; }));
        framePromises[p.frameId] = resolve;
    }
};

const resolveFrameEvent = p => {
    if (framePromises && framePromises[p.frameId]) {
        framePromises[p.frameId]();
        delete framePromises[p.frameId];
    }
};

module.exports = { setPage };