const requestPromises = {};
const interceptors = [];
let network,xhrEvent;

const setNetwork = async (n,event) => {
    network = n;
    xhrEvent = event;
    await network.clearBrowserCache();
    await network.clearBrowserCookies();
    network.requestWillBeSent(emitXHREvent);
    network.responseReceived(resolveXHREvent);
};

const emitXHREvent = p => {
    if (p.hasUserGesture && p.type === 'XHR') {
        let resolve;
        requestPromises[p.requestId] = { promise: new Promise((r) => { resolve = r; }), resolveFunc: resolve };
        xhrEvent.emit('xhrEvent', requestPromises[p.requestId].promise);
    }
};

const resolveXHREvent = p => {
    if (requestPromises && requestPromises[p.requestId]) {
        requestPromises[p.requestId].resolveFunc.call();
        delete requestPromises[p.requestId];
    }
};

const handleInterceptor = p => {
    const options = {interceptionId: p.interceptionId};
    for(const interceptor of interceptors){
        let matched = true;
        for(const key in interceptor['matcher']){
            if(!(p['request'][key] === interceptor['matcher'][key])) matched = false;
        }
        if(matched) options['errorReason'] = interceptor['action'].errorReason;
    }
    network.continueInterceptedRequest(options);
};

const addInterceptor = async (matcher,action) => {
    await network.setRequestInterception({patterns:[{urlPattern: '*'}]});
    network.requestIntercepted(handleInterceptor);
    interceptors.push({matcher:matcher,action:action});
};

module.exports = {setNetwork,addInterceptor};