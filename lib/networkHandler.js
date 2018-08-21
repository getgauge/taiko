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
        let matched = true;
        for (const key in interceptor['requestIdentifier']) {
            const pattern = new RegExp(interceptor['requestIdentifier'][key]);
            if (!p['request'][key]) throw new Error(`There is no matching request attribute for "${key}"`);
            if (!(pattern.test(p['request'][key]))) matched = false;
        }
        if (matched) 
            if(interceptor.override) options = overrideRequest(interceptor.override, p, options);
            else if(interceptor.mockResponse) options = mockResponse(interceptor.mockResponse,p,options);
    }
    network.continueInterceptedRequest(options);
};

const mockResponse = (response, options) => {
    const responseBody = Buffer.from(response.body); 

    const responseHeaders = {};
    if (response.headers) {
        for (const header of Object.keys(response.headers))
            responseHeaders[header.toLowerCase()] = response.headers[header];
    }
    if (response.contentType)
        responseHeaders['content-type'] = response.contentType;
    if (responseBody && !('content-length' in responseHeaders)) {
        responseHeaders['content-length'] = Buffer.byteLength(responseBody);
    }

    const statusCode = response.status || 200;
    const statusText = statusTexts[statusCode] || '';
    const statusLine = `HTTP/1.1 ${statusCode} ${statusText}`;

    const CRLF = '\r\n';
    let text = statusLine + CRLF;
    for (const header of Object.keys(responseHeaders))
        text += header + ': ' + responseHeaders[header] + CRLF;
    text += CRLF;
    let responseBuffer = Buffer.from(text, 'utf8');
    if (responseBody)
        responseBuffer = Buffer.concat([responseBuffer, responseBody]);

    options.rawResponse = responseBuffer.toString('base64'); 
    return options;
};

const overrideRequest = (override, options) => {
    for (const key in override) options[key] = override[key];
    return options;
};

const addInterceptor = async (options) => {
    if(!interceptors.length){
        await network.setRequestInterception({patterns:[{urlPattern: '*'}]});
        network.requestIntercepted(handleInterceptor);
    }
    interceptors.push(options);
};

const statusTexts = {
    '100': 'Continue',
    '101': 'Switching Protocols',
    '102': 'Processing',
    '200': 'OK',
    '201': 'Created',
    '202': 'Accepted',
    '203': 'Non-Authoritative Information',
    '204': 'No Content',
    '206': 'Partial Content',
    '207': 'Multi-Status',
    '208': 'Already Reported',
    '209': 'IM Used',
    '300': 'Multiple Choices',
    '301': 'Moved Permanently',
    '302': 'Found',
    '303': 'See Other',
    '304': 'Not Modified',
    '305': 'Use Proxy',
    '306': 'Switch Proxy',
    '307': 'Temporary Redirect',
    '308': 'Permanent Redirect',
    '400': 'Bad Request',
    '401': 'Unauthorized',
    '402': 'Payment Required',
    '403': 'Forbidden',
    '404': 'Not Found',
    '405': 'Method Not Allowed',
    '406': 'Not Acceptable',
    '407': 'Proxy Authentication Required',
    '408': 'Request Timeout',
    '409': 'Conflict',
    '410': 'Gone',
    '411': 'Length Required',
    '412': 'Precondition Failed',
    '413': 'Payload Too Large',
    '414': 'URI Too Long',
    '415': 'Unsupported Media Type',
    '416': 'Range Not Satisfiable',
    '417': 'Expectation Failed',
    '418': 'I\'m a teapot',
    '421': 'Misdirected Request',
    '422': 'Unprocessable Entity',
    '423': 'Locked',
    '424': 'Failed Dependency',
    '426': 'Upgrade Required',
    '428': 'Precondition Required',
    '429': 'Too Many Requests',
    '431': 'Request Header Fields Too Large',
    '451': 'Unavailable For Legal Reasons',
    '500': 'Internal Server Error',
    '501': 'Not Implemented',
    '502': 'Bad Gateway',
    '503': 'Service Unavailable',
    '504': 'Gateway Timeout',
    '505': 'HTTP Version Not Supported',
    '506': 'Variant Also Negotiates',
    '507': 'Insufficient Storage',
    '508': 'Loop Detected',
    '510': 'Not Extended',
    '511': 'Network Authentication Required',
};

module.exports = {setNetwork,addInterceptor};