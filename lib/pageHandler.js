let page, xhrEvent;

const setPage = async (pg, event, domContentCallback) => {
    page = pg;
    xhrEvent = event;
    await page.bringToFront();
    page.domContentEventFired(domContentCallback);
    page.addScriptToEvaluateOnNewDocument({ source: 'localStorage.clear()' });
    page.frameStartedLoading(p => {
        xhrEvent.emit('frameStartedLoading', p);
    });
};

module.exports = { setPage };