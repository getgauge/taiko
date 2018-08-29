let page, xhrEvent;
let framePromises = {};
let pagePromises = {};

const setPage = async (pg, event, initCallback, domContentCallback) => {
    page = pg;
    xhrEvent = event;
    await page.bringToFront();
    page.addScriptToEvaluateOnNewDocument({ source: 'localStorage.clear()' });
    page.frameStartedLoading(p => {
        var resolve;
        framePromises[p.frameId] = { promise: new Promise((r) => { resolve = r; }), resolveFunc: resolve };
        xhrEvent.emit('xhrEvent', framePromises[p.frameId].promise);
    });
    page.frameStoppedLoading(p => {
        if (framePromises && framePromises[p.frameId]) {
            framePromises[p.frameId].resolveFunc.call();
            delete framePromises[p.frameId];
        }
    });
    page.lifecycleEvent(async (p) => {
        if ((p.name === 'init') && !pagePromises[p.frameId + '|' + p.loaderId]) {
            var resolve;
            initCallback();
            pagePromises[p.frameId + '|' + p.loaderId] = { promise: new Promise((r) => { resolve = r; }), resolveFunc: resolve };
            xhrEvent.emit('xhrEvent', pagePromises[p.frameId + '|' + p.loaderId].promise);
        } else if (p.name === 'networkIdle' && pagePromises[p.frameId + '|'+ p.loaderId]) {
            await domContentCallback();
            pagePromises[p.frameId + '|'+ p.loaderId].resolveFunc.call();
            delete pagePromises[p.loaderId];
        }
    });
};

module.exports = { setPage };