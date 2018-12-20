let page, xhrEvent, framePromises = {};

const setPage = async (pg, event, domContentCallback) => {
    page = pg;
    xhrEvent = event;
    await page.bringToFront();
    page.domContentEventFired(domContentCallback);
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