const requestPromises = {};
const attemptedAuthentications = new Set();
let network,xhrEvent,credentials;

const setNetwork = (n,event) => {
    network = n;
    xhrEvent = event;
    network.requestWillBeSent(handleXHR);
    network.responseReceived(resolveXHR);
    network.requestIntercepted(authenticate);
};

const handleXHR = p => {
    if (p.hasUserGesture && p.type === 'XHR') {
        let resolve;
        requestPromises[p.requestId] = { promise: new Promise((r) => { resolve = r; }), resolveFunc: resolve };
        xhrEvent.emit('xhrEvent', requestPromises[p.requestId].promise);
    }
};

const resolveXHR = p => {
    if (requestPromises && requestPromises[p.requestId])
        requestPromises[p.requestId].resolveFunc.call();
};

const authenticate = async (event) => {
    if (event.authChallenge) {
        let response = 'Default';
        if (attemptedAuthentications.has(event.interceptionId)) {
            response = 'CancelAuth';
        } else if (credentials) {
            response = 'ProvideCredentials';
            attemptedAuthentications.add(event.interceptionId);
        }
        const {username, password} = credentials || {username: undefined, password: undefined};
        network.continueInterceptedRequest({
            interceptionId: event.interceptionId,
            authChallengeResponse: { response, username, password }
        });
        return;
    }
    network.continueInterceptedRequest({
        interceptionId: event.interceptionId,
    });
};

const setCredentials = async (c) => {
    credentials = c;
    await Promise.all([
        network.setCacheDisabled({cacheDisabled: true}),
        network.setRequestInterception({patterns:[{urlPattern: '*'}]})
    ]);
};

module.exports = {setNetwork,setCredentials};