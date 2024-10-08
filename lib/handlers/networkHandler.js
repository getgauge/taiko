const { eventHandler } = require("../eventBus");
const { logEvent } = require("../logger");
const networkPresets = require("../data/networkConditions");
let requestPromises;
let network;

const createdSessionListener = (client) => {
  let resolve;
  eventHandler.emit(
    "handlerActingOnNewSession",
    new Promise((r) => {
      resolve = r;
    }),
  );
  network = client.Network;
  requestPromises = {};
  network.requestWillBeSent(emitXHREvent);
  network.loadingFinished(resolveXHREvent);
  network.loadingFailed(resolveXHREvent);
  network.responseReceived(responseHandler);
  network.setCacheDisabled({ cacheDisabled: true });
  resolve();
};
eventHandler.on("createdSession", createdSessionListener);

const resetPromises = () => {
  requestPromises = {};
};

const emitXHREvent = (p) => {
  eventHandler.emit("requestStarted", p);
  if (!requestPromises?.[p.requestId]) {
    logEvent(
      `Request started:\t RequestId : ${p.requestId}\tRequest Url : ${p.request.url}`,
    );
    let resolve;
    eventHandler.emit("xhrEvent", {
      request: p,
      promise: new Promise((r) => {
        resolve = r;
      }),
    });
    requestPromises[p.requestId] = resolve;
  }
};

const resolveXHREvent = (p) => {
  if (requestPromises?.[p.requestId]) {
    logEvent(`Request resolved:\t RequestId : ${p.requestId}`);
    requestPromises[p.requestId]();
    delete requestPromises[p.requestId];
  }
};

const responseHandler = (response) => {
  logEvent(`Response Recieved: Request id: ${response.requestId}`);
  eventHandler.emit("responseReceived", response);
};

const setNetworkEmulation = async (networkType) => {
  const _networkType = networkType || process.env.TAIKO_EMULATE_NETWORK;
  const defaultNetworkConditions = {
    offline: false,
    downloadThroughput: 0,
    uploadThroughput: 0,
    latency: 0,
  };
  const emulate =
    typeof _networkType === "object"
      ? { ...defaultNetworkConditions, ..._networkType }
      : networkPresets[_networkType];
  if (!emulate) {
    throw new Error(
      `Please set one of the given network types \n${Object.keys(networkPresets).join("\n")}`,
    );
  }
  try {
    await network.emulateNetworkConditions(emulate);
  } catch (err) {
    console.warn(`Could not emulate network: ${err}`);
  }
};

const setUserAgent = async (deviceEmulate) => {
  await network.setUserAgentOverride({
    userAgent: deviceEmulate.userAgent,
  });
};

const setCookie = async (options) => await network.setCookie(options);

const getCookies = async (options) => {
  return await network.getCookies(options);
};

const clearBrowserCookies = async () => await network.clearBrowserCookies();

const deleteCookies = async (options) => await network.deleteCookies(options);

module.exports = {
  setNetworkEmulation,
  resetPromises,
  setUserAgent,
  setCookie,
  getCookies,
  clearBrowserCookies,
  deleteCookies,
};
