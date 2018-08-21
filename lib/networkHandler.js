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
    let options = {interceptionId: p.interceptionId};
    for(const interceptor of interceptors){
        if(interceptor.override) options = overrideRequest(interceptor, p, options);
        else if(interceptor.mockResponse) options = mockResponse(interceptor,p,options);
    }
    network.continueInterceptedRequest(options);
};

const mockResponse = (interceptor, p, options) => {return options;};

const overrideRequest = (interceptor, p, options) => {
    let matched = true;
    for (const key in interceptor['requestIdentifier']) {
        const pattern = new RegExp(interceptor['requestIdentifier'][key]);
        if (!p['request'][key]) throw new Error(`There is no matching request attribute for "${key}"`);
        if (!(pattern.test(p['request'][key]))) matched = false;
    }
    if (matched) for (const key in interceptor.override) options[key] = interceptor.override[key];
    return options;
};

const addInterceptor = async (options) => {
    await network.setRequestInterception({patterns:[{urlPattern: '*'}]});
    network.requestIntercepted(handleInterceptor);
    interceptors.push(options);
};

module.exports = {setNetwork,addInterceptor};