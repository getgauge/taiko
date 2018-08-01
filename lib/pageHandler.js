let page,xhrEvent;
let framePromises = {};

const setPage = (p,event,domContentCallback) => {
    page = p;
    xhrEvent = event;
    page.domContentEventFired(domContentCallback);
    page.frameStartedLoading(p => {
        var resolve;
        framePromises[p.frameId] = { promise: new Promise((r) => { resolve = r; }), resolveFunc: resolve };
        xhrEvent.emit('xhrEvent', framePromises[p.frameId].promise);
    });
    page.frameStoppedLoading(p => {
        if (framePromises && framePromises[p.frameId]) {
            framePromises[p.frameId].resolveFunc.call();
        }
    });
};

module.exports = {setPage};