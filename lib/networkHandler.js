const requestPromises = {};
const interceptors = [];
let network,xhrEvent;

const setNetwork = async (n,event) => {
    network = n;
    xhrEvent = event;

    await network.clearBrowserCache();
    await network.clearBrowserCookies();
    await network.setRequestInterception({patterns:[{urlPattern: '*'}]});

    network.requestWillBeSent(p => {
        if (p.hasUserGesture && p.type === 'XHR') {
            let resolve;
            requestPromises[p.requestId] = { promise: new Promise((r) => { resolve = r; }), resolveFunc: resolve };
            xhrEvent.emit('xhrEvent', requestPromises[p.requestId].promise);
        }
    });
    
    network.requestIntercepted(p => {
        for(const interceptor of interceptors){
            console.log(interceptor['matcher']);
            let matched = true;
            for(const key in interceptor['matcher']){
                console.log(p['request'][key],interceptor['matcher'][key]);
                if(!(p['request'][key] === interceptor['matcher'][key])) matched = false;
            }
            matched? network.continueInterceptedRequest({
                interceptionId: p.interceptionId,
                errorReason: interceptor['action'].errorCode
            }):network.continueInterceptedRequest({interceptionId: p.interceptionId});
        
        }
        if(!interceptors.length)network.continueInterceptedRequest({interceptionId: p.interceptionId});
    });

    network.responseReceived(p => {
        if (requestPromises && requestPromises[p.requestId]) {
            requestPromises[p.requestId].resolveFunc.call();
            delete requestPromises[p.requestId];
        }
    });
};

const addInterceptor = (matcher,action) => {
    interceptors.push({matcher:matcher,action:action});
};

module.exports = {setNetwork,addInterceptor};