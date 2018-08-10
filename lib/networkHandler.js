const requestPromises = {};
let network,xhrEvent;

const setNetwork = async (n,event) => {
    network = n;
    xhrEvent = event;

    await network.clearBrowserCache();
    await network.clearBrowserCookies();

    network.requestWillBeSent(p => {
        if (p.hasUserGesture && p.type === 'XHR') {
            let resolve;
            requestPromises[p.requestId] = { promise: new Promise((r) => { resolve = r; }), resolveFunc: resolve };
            xhrEvent.emit('xhrEvent', requestPromises[p.requestId].promise);
        }
    });
    network.responseReceived(p => {
        if (requestPromises && requestPromises[p.requestId]) {
            requestPromises[p.requestId].resolveFunc.call();
            delete requestPromises[p.requestId];
        }
    });
};

module.exports = {setNetwork};