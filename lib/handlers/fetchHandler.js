const { isFunction, isString, isObject } = require("../helper");
const { eventHandler } = require("../eventBus");
const headersMap = new Map();
const defaultErrorReason = "Failed";
let fetch,
  userEnabledIntercept = false;
let interceptors = [];

const createdSessionListener = async (client) => {
  let resolve;
  eventHandler.emit(
    "handlerActingOnNewSession",
    new Promise((r) => {
      resolve = r;
    }),
  );
  fetch = client.Fetch;
  if (userEnabledIntercept) {
    await enableFetchIntercept();
  }
  resolve();
};

eventHandler.on("createdSession", createdSessionListener);

const enableFetchIntercept = async () => {
  await fetch.enable({
    patterns: [{ urlPattern: "*" }],
  });
  await fetch.requestPaused(handleInterceptor);
};

const extractHostName = (url) => {
  let { protocol, href, host } = new URL(url);
  if (protocol === "file:") {
    host = href;
  }
  return host;
};

const addExtraHeadersToRequest = (p) => {
  const options = { requestId: p.requestId };
  const host = extractHostName(p.request.url);
  const headers = headersMap.get(host);
  for (const headerName in headers) {
    if (!(headerName in p.request.headers)) {
      options.headers = options.headers || {};
      options.headers[headerName] = headers[headerName];
    }
  }
  if (options.headers) {
    options.headers = headerArray(options.headers);
  }
  return options;
};

const filterInterceptorsAndWarnIfNeeded = (requestUrl) => {
  const matches = interceptors.filter((interceptor) =>
    getMatchingInterceptor(interceptor, requestUrl),
  );
  const matchesLen = matches.length;
  if (matchesLen > 1) {
    const matchesURL = matches.map((e) => `"${e.requestUrl}"`).join(",");
    console.warn(
      `WARNING: More than one intercept [${matchesURL}] found for request "${requestUrl}".\n Applying: intercept("${
        matches[matchesLen - 1].requestUrl
      }", "${matches[matchesLen - 1].action}")`,
    );
  }
  return matches.pop();
};

const warnInterceptFailed = (p) => {
  console.warn(`WARNING: Could not intercept request ${p.request.url}`);
};

const handleInterceptor = (p) => {
  let options = addExtraHeadersToRequest(p);
  const interceptor = filterInterceptorsAndWarnIfNeeded(p.request.url);
  if (!interceptor) {
    fetch.continueRequest(options).catch(() => {});
    return;
  }
  interceptor.count = interceptor.count - 1;

  switch (true) {
    //Blocks matching url
    case !interceptor.action:
      options.errorReason = defaultErrorReason;
      fetch.failRequest(options);
      break;
    //Mocks response and/or request based on callback
    case isFunction(interceptor.action):
      p.continue = (override) => overrideRequest(p, override, options);
      p.respond = (mock) => {
        options = mockResponse(mock, options);
        fetch.fulfillRequest(options).catch(() => warnInterceptFailed(p));
      };
      interceptor.action(p);
      break;
    //Redirects to given url
    case isString(interceptor.action):
      if (
        !/^https?:\/\//i.test(interceptor.action) &&
        !/^file/i.test(interceptor.action)
      ) {
        interceptor.action = "http://" + interceptor.action;
      }
      options.url = interceptor.action;
      fetch.continueRequest(options).catch(() => warnInterceptFailed(p));
      break;
    //Mocks response with given object
    case isObject(interceptor.action):
      options = mockResponse(interceptor.action, options);
      fetch.fulfillRequest(options).catch(() => warnInterceptFailed(p));
      break;
    //Continue default request if none of the above matches
    default:
      fetch.continueRequest(options).catch(() => {});
  }
};

const mockResponse = (response, options) => {
  const responseBodyJson = isObject(response.body)
    ? JSON.stringify(response.body)
    : response.body;
  const responseBody = Buffer.from(responseBodyJson || "");

  const responseHeaders = {};
  if (response.headers) {
    for (const header of Object.keys(response.headers)) {
      responseHeaders[header.toLowerCase()] = response.headers[header];
    }
  }
  if (response.contentType) {
    responseHeaders["content-type"] = response.contentType;
  }
  if (responseBody && !("content-length" in responseHeaders)) {
    responseHeaders["content-length"] = Buffer.byteLength(responseBody);
  }
  options.body = responseBody.toString("base64");
  options.responseCode = response.status || 200;
  options.responsePhrase = statusTexts[response.status || 200];
  options.responseHeaders = headerArray(responseHeaders);
  return options;
};

const headerArray = (headers) => {
  const result = [];
  for (const name in headers) {
    if (!Object.is(headers[name], undefined)) {
      result.push({ name, value: headers[name] + "" });
    }
  }
  return result;
};

const overrideRequest = (p, override, options) => {
  if (override) {
    override["postData"] = override["postData"]
      ? Buffer.from(override["postData"]).toString("base64")
      : undefined;
    for (const key in override) {
      options[key] = override[key];
    }
  }
  fetch.continueRequest(options).catch(() => warnInterceptFailed(p));
};

const statusTexts = {
  100: "Continue",
  101: "Switching Protocols",
  102: "Processing",
  200: "OK",
  201: "Created",
  202: "Accepted",
  203: "Non-Authoritative Information",
  204: "No Content",
  206: "Partial Content",
  207: "Multi-Status",
  208: "Already Reported",
  209: "IM Used",
  300: "Multiple Choices",
  301: "Moved Permanently",
  302: "Found",
  303: "See Other",
  304: "Not Modified",
  305: "Use Proxy",
  306: "Switch Proxy",
  307: "Temporary Redirect",
  308: "Permanent Redirect",
  400: "Bad Request",
  401: "Unauthorized",
  402: "Payment Required",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  406: "Not Acceptable",
  407: "Proxy Authentication Required",
  408: "Request Timeout",
  409: "Conflict",
  410: "Gone",
  411: "Length Required",
  412: "Precondition Failed",
  413: "Payload Too Large",
  414: "URI Too Long",
  415: "Unsupported Media Type",
  416: "Range Not Satisfiable",
  417: "Expectation Failed",
  418: "I'm a teapot",
  421: "Misdirected Request",
  422: "Unprocessable Entity",
  423: "Locked",
  424: "Failed Dependency",
  426: "Upgrade Required",
  428: "Precondition Required",
  429: "Too Many Requests",
  431: "Request Header Fields Too Large",
  451: "Unavailable For Legal Reasons",
  500: "Internal Server Error",
  501: "Not Implemented",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Gateway Timeout",
  505: "HTTP Version Not Supported",
  506: "Variant Also Negotiates",
  507: "Insufficient Storage",
  508: "Loop Detected",
  510: "Not Extended",
  511: "Network Authentication Required",
};

const getMatchingInterceptor = (interceptor, url) => {
  if (interceptor.count === 0) {
    return false;
  }
  if (url === interceptor.requestUrl) {
    return true;
  }
  const re = new RegExp(interceptor.requestUrl);
  const matches = url.match(re);
  if (matches === null || matches.length <= 0) {
    return decodeURI(url).match(re);
  }
  return matches;
};

const addInterceptor = async (requestWithAction) => {
  interceptors.push(requestWithAction);
  if (!userEnabledIntercept) {
    userEnabledIntercept = true;
    await enableFetchIntercept();
  }
};

const resetInterceptor = (url) => {
  var originalLength = interceptors.length;
  interceptors = interceptors.filter(
    (interceptor) => !getMatchingInterceptor(interceptor, url),
  );
  return originalLength !== interceptors.length;
};

const resetInterceptors = () => {
  interceptors = [];
  userEnabledIntercept = false;
};

const setHTTPHeaders = async (headers, url) => {
  const host = extractHostName(url);
  headersMap.set(host, headers);
  if (!userEnabledIntercept) {
    userEnabledIntercept = true;
    await enableFetchIntercept();
  }
};

module.exports = {
  addInterceptor,
  resetInterceptor,
  resetInterceptors,
  handleInterceptor,
  setHTTPHeaders,
};
