const requestPromises = {};
let network,xhrEvent;

const setNetwork = (n,event) => {
    network = n;
    xhrEvent = event;
    network.requestWillBeSent(p => {
        if (p.hasUserGesture && p.type === 'XHR') {
            let resolve;
            requestPromises[p.requestId] = { promise: new Promise((r) => { resolve = r; }), resolveFunc: resolve };
            xhrEvent.emit('xhrEvent', requestPromises[p.requestId].promise);
        }
    });
    network.responseReceived(p => {
        if (requestPromises && requestPromises[p.requestId])
            requestPromises[p.requestId].resolveFunc.call();
    });
};

module.exports = {setNetwork};