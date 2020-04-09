const { isFunction, isString, isObject } = require('../helper');
const { eventHandler } = require('../eventBus');
const { logEvent } = require('../logger');
const networkPresets = require('../data/networkConditions');
let requestPromises;
const defaultErrorReason = 'Failed';
let interceptors = [];
let network;
const headersMap = new Map();
eventHandler.on('createdSession', (client) => {
  network = client.Network;
  requestPromises = {};
  network.requestWillBeSent(emitXHREvent);
  network.loadingFinished(resolveXHREvent);
  network.loadingFailed(resolveXHREvent);
  network.responseReceived(responseHandler);
  registerInterceptHandler();
});

const resetInterceptors = () => {
  interceptors = [];
};

const resetPromises = () => {
  requestPromises = {};
};

const registerInterceptHandler = () => {
  network.setCacheDisabled({ cacheDisabled: true });
  network.setRequestInterception({ patterns: [{ urlPattern: '*' }] });
  network.requestIntercepted(handleInterceptor);
};

const emitXHREvent = (p) => {
  eventHandler.emit('requestStarted', p);
  if (!(requestPromises && requestPromises[p.requestId])) {
    logEvent(`Request started:\t RequestId : ${p.requestId}\tRequest Url : ${p.request.url}`);
    let resolve;
    eventHandler.emit('xhrEvent', {
      request: p,
      promise: new Promise((r) => {
        resolve = r;
      }),
    });
    requestPromises[p.requestId] = resolve;
  }
};

const resolveXHREvent = (p) => {
  if (requestPromises && requestPromises[p.requestId]) {
    logEvent(`Request resolved:\t RequestId : ${p.requestId}`);
    requestPromises[p.requestId]();
    delete requestPromises[p.requestId];
  }
};

const responseHandler = (response) => {
  logEvent(`Response Recieved: Request id: ${response.requestId}`);
  eventHandler.emit('responseReceived', response);
};

const getMatchingInterceptor = (interceptor, url) => {
  if (interceptor.count === 0) {
    return false;
  } else if (url === interceptor.requestUrl) {
    return true;
  }
  const re = new RegExp(interceptor.requestUrl);
  let matches = url.match(re);
  if (matches === null || matches.length <= 0) {
    return decodeURI(url).match(re);
  }
  return matches;
};

const extractHostName = (url) => {
  let { protocol, href, host } = new URL(url);
  if (protocol === 'file:') {
    host = href;
  }
  return host;
};

const handleInterceptor = (p) => {
  let host = extractHostName(p.request.url);
  let headers = headersMap.get(host);
  let options = { interceptionId: p.interceptionId };
  for (const headerName in headers) {
    if (!(headerName in p.request.headers)) {
      options.headers = options.headers || {};
      options.headers[headerName] = headers[headerName];
    }
  }
  const matches = interceptors.filter((interceptor) =>
    getMatchingInterceptor(interceptor, p.request.url),
  );
  const matchesLen = matches.length;
  if (matchesLen) {
    if (matchesLen > 1) {
      const matchesURL = matches.map((e) => `"${e.requestUrl}"`).join(',');
      console.warn(
        `WARNING: More than one intercept [${matchesURL}] found for request "${
          p.request.url
        }".\n Applying: intercept("${matches[matchesLen - 1].requestUrl}", "${
          matches[matchesLen - 1].action
        }")`,
      );
    }
    const interceptor = matches.pop();
    if (interceptor.count) {
      interceptor.count = interceptor.count - 1;
    }
    if (!interceptor.action) {
      options.errorReason = defaultErrorReason;
    } else if (isFunction(interceptor.action)) {
      p.continue = (override) => overrideRequest(p, override, options);
      p.respond = (mock) => {
        options = mockResponse(mock, options);
        network.continueInterceptedRequest(options).catch(() => {
          console.warn(`Could not intercept request ${p.request.url}`);
        });
      };
      interceptor.action(p);
      return;
    } else if (isString(interceptor.action)) {
      if (!/^https?:\/\//i.test(interceptor.action) && !/^file/i.test(interceptor.action)) {
        interceptor.action = 'http://' + interceptor.action;
      }
      options.url = interceptor.action;
    } else {
      options = mockResponse(interceptor.action, options);
    }
  }
  network.continueInterceptedRequest(options).catch(() => {
    if (matchesLen) {
      console.warn(`Could not intercept request ${p.request.url}`);
    }
  });
};

const mockResponse = (response, options) => {
  let responseBodyJson = isObject(response.body) ? JSON.stringify(response.body) : response.body;
  const responseBody = Buffer.from(responseBodyJson);

  const responseHeaders = {};
  if (response.headers) {
    for (const header of Object.keys(response.headers)) {
      responseHeaders[header.toLowerCase()] = response.headers[header];
    }
  }
  if (response.contentType) {
    responseHeaders['content-type'] = response.contentType;
  }
  if (responseBody && !('content-length' in responseHeaders)) {
    responseHeaders['content-length'] = Buffer.byteLength(responseBody);
  }

  const statusCode = response.status || 200;
  const statusText = statusTexts[statusCode] || '';
  const statusLine = `HTTP/1.1 ${statusCode} ${statusText}`;

  const CRLF = '\r\n';
  let text = statusLine + CRLF;
  for (const header of Object.keys(responseHeaders)) {
    text += header + ': ' + responseHeaders[header] + CRLF;
  }
  text += CRLF;
  let responseBuffer = Buffer.from(text, 'utf8');
  if (responseBody) {
    responseBuffer = Buffer.concat([responseBuffer, responseBody]);
  }

  options.rawResponse = responseBuffer.toString('base64');
  return options;
};

const overrideRequest = (p, override, options) => {
  for (const key in override) {
    options[key] = override[key];
  }
  network.continueInterceptedRequest(options).catch(() => {
    console.warn(`Could not intercept request ${p.request.url}`);
  });
};

const setNetworkEmulation = async (networkType) => {
  const _networkType = process.env.TAIKO_EMULATE_NETWORK;
  if (!networkType && _networkType) {
    networkType = _networkType;
  }
  const emulate = networkPresets[networkType];
  let networkModes = Object.keys(networkPresets);
  if (emulate === undefined) {
    throw new Error(`Please set one of the given network types \n${networkModes.join('\n')}`);
  }
  await network.emulateNetworkConditions(emulate).catch((err) => {
    console.warn(`Could not emulate network ${err}`);
  });
};

const addInterceptor = async (requestWithAction) => {
  interceptors.push(requestWithAction);
};
const setHTTPHeaders = (headers, url) => {
  let host = extractHostName(url);
  headersMap.set(host, headers);
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
  '418': "I'm a teapot",
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

const resetInterceptor = (url) => {
  var originalLength = interceptors.length;
  interceptors = interceptors.filter((interceptor) => !getMatchingInterceptor(interceptor, url));
  return originalLength !== interceptors.length;
};

module.exports = {
  addInterceptor,
  resetInterceptors,
  setNetworkEmulation,
  handleInterceptor,
  resetPromises,
  resetInterceptor,
  setHTTPHeaders,
};
