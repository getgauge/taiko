const { isFunction, isString, isObject} = require('./helper');
const requestPromises = {};
const interceptors = [];
let network, xhrEvent;
const defaultErrorReason = 'Failed';

const setNetwork = async (n, event) => {
    network = n;
    xhrEvent = event;
    await network.clearBrowserCache();
    await network.clearBrowserCookies();
    network.requestWillBeSent(emitXHREvent);
    network.responseReceived(resolveXHREvent);
};

const emitXHREvent = p => {
    if (p.hasUserGesture) {
        let resolve;
        xhrEvent.emit('xhrEvent', new Promise((r) => { resolve = r; }));
        requestPromises[p.requestId] = resolve;
    }
};

const resolveXHREvent = p => {
    if (requestPromises && requestPromises[p.requestId]) {
        requestPromises[p.requestId]();
        delete requestPromises[p.requestId];
    }
};

const handleInterceptor = p => {
    let options = { interceptionId: p.interceptionId };
    for (const interceptor of interceptors) {
        if (interceptor.requestUrl === p.request.url) {
            if (!interceptor.action) { options.errorReason = defaultErrorReason; break; }
            if (isFunction(interceptor.action)) {
                p.continue = (override) => overrideRequest(override, options);
                p.respond = (mock) => {
                    options = mockResponse(mock, options);
                    network.continueInterceptedRequest(options);
                };
                interceptor.action(p);
                return;
            }
            if (isString(interceptor.action)) options.url = interceptor.action;
            else options = mockResponse(interceptor.action, options);
        }
    }
    network.continueInterceptedRequest(options);
};

const mockResponse = (response, options) => {
    let responseBodyJson = isObject(response.body) ? JSON.stringify(response.body) : response.body;
    const responseBody = Buffer.from(responseBodyJson);

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
    network.continueInterceptedRequest(options);
};

const addInterceptor = async (requestWithAction) => {
    if (!interceptors.length) {
        await network.setRequestInterception({ patterns: [{ urlPattern: '*' }] });
        network.requestIntercepted(handleInterceptor);
    }
    interceptors.push(requestWithAction);
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

module.exports = { setNetwork, addInterceptor };