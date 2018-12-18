let page, xhrEvent;

const setPage = async (pg, event, domContentCallback) => {
    page = pg;
    xhrEvent = event;
    await page.bringToFront();
    page.domContentEventFired(domContentCallback);
    page.frameStartedLoading(p => {
        xhrEvent.emit('frameStartedLoading', p);
    });
    page.frameStoppedLoading(p => {
        xhrEvent.emit('frameStoppedLoading', p);
    });
    page.loadEventFired(p => {
        xhrEvent.emit('loadEventFired', p);
    });
    page.setLifecycleEventsEnabled({enabled:true});
    page.lifecycleEvent((p)=>{
        xhrEvent.emit(p.name, p);
    });
};

module.exports = { setPage };