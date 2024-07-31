const { defaultConfig } = require("./config");
const { eventHandler } = require("./eventBus");
const { isPromise } = require("./helper");
const { logEvent } = require("./logger");
const {
  errorMessageForBrowserProcessCrash,
  closeBrowser,
} = require("./browser/launcher");
const targetHandler = require("./handlers/targetHandler");
const pageHandler = require("./handlers/pageHandler");
const emulationHandler = require("./handlers/emulationHandler");
const cri = require("chrome-remote-interface");
const isReachable = require("is-reachable");
const numRetries = defaultConfig.criConnectionRetries;
const { pluginHooks } = require("./plugins");
let overlay, security, _client, page, network, dom;

const createProxyForCDPDomain = (cdpClient, cdpDomainName) => {
  const cdpDomain = cdpClient[cdpDomainName];
  const cdpDomainProxy = new Proxy(cdpDomain, {
    get: (target, name) => {
      const domainApi = target[name];
      if (typeof domainApi === "function") {
        return async (...args) => {
          return await new Promise((resolve, reject) => {
            eventHandler.removeAllListeners("browserCrashed");
            eventHandler.on("browserCrashed", () => {
              if (_client) {
                _client.removeAllListeners();
              }
              _client = null;
              reject();
            });
            const res = domainApi.apply(null, args);
            if (isPromise(res)) {
              res.then(resolve).catch(reject);
            } else {
              resolve(res);
            }
          }).catch((e) => {
            if (e.message.match(/WebSocket is not open: readyState 3/i)) {
              errorMessageForBrowserProcessCrash();
            }
            throw e;
          });
        };
      } else {
        return domainApi;
      }
    },
  });
  cdpClient[cdpDomainName] = cdpDomainProxy;
  return cdpClient[cdpDomainName];
};
const initCRIProperties = (c) => {
  page = createProxyForCDPDomain(c, "Page");
  network = createProxyForCDPDomain(c, "Network");
  createProxyForCDPDomain(c, "Runtime");
  createProxyForCDPDomain(c, "Input");
  dom = createProxyForCDPDomain(c, "DOM");
  overlay = createProxyForCDPDomain(c, "Overlay");
  security = createProxyForCDPDomain(c, "Security");
  createProxyForCDPDomain(c, "Browser");
  createProxyForCDPDomain(c, "Target");
  createProxyForCDPDomain(c, "Emulation");
  _client = c;
};

const initCRI = async (target, n, options = {}) => {
  try {
    ({ target, options } = await pluginHooks.preConnectionHook(
      target,
      options,
    ));
    var c = await cri({
      target,
      host: defaultConfig.host,
      port: defaultConfig.port,
      useHostName: defaultConfig.useHostName,
      secure: defaultConfig.secure,
      alterPath: defaultConfig.alterPath,
      local: defaultConfig.local,
    });
    const promises = [];
    eventHandler.on("handlerActingOnNewSession", (promise) => {
      promises.push(promise);
    });
    initCRIProperties(c);
    const domainEnablePromises = [
      network.enable(),
      page.enable(),
      dom.enable(),
      security.enable(),
    ];
    if (!defaultConfig.firefox) {
      domainEnablePromises.push(overlay.enable());
    }
    await Promise.all(domainEnablePromises);
    _client.on("disconnect", reconnect);
    // Should be emitted after enabling all domains. All handlers can then perform any action on domains properly.
    eventHandler.emit("createdSession", _client, target);
    if (defaultConfig.ignoreSSLErrors) {
      security.setIgnoreCertificateErrors({ ignore: true });
    }
    defaultConfig.device = process.env.TAIKO_EMULATE_DEVICE;
    if (defaultConfig.device) {
      emulationHandler.emulateDevice(defaultConfig.device);
    }
    await Promise.all(promises);
    eventHandler.removeAllListeners("handlerActingOnNewSession");
    logEvent("Session Created");
    return _client;
  } catch (error) {
    logEvent(error);
    if (n < 2) {
      throw error;
    }
    return new Promise((r) => setTimeout(r, 100)).then(
      async () => await initCRI(target, n - 1, options),
    );
  }
};

const connect_to_cri = async (target, options = {}) => {
  if (defaultConfig.local) {
    target = defaultConfig.browserDebugUrl;
  }
  if (_client && _client._ws.readyState === 1) {
    if (!defaultConfig.firefox) {
      await network.setRequestInterception({
        patterns: [],
      });
    }
    _client.removeAllListeners();
  }
  var tgt =
    target || (await targetHandler.waitForTargetToBeCreated(numRetries));
  return initCRI(tgt, numRetries, options);
};

const closeConnection = async (promisesToBeResolvedBeforeCloseBrowser) => {
  if (_client) {
    // remove listeners other than JS dialog for beforeUnload on client first to stop executing them when closing
    await _client.removeAllListeners();
    pageHandler.addJavascriptDialogOpeningListener();
    if (!defaultConfig.firefox) {
      await pageHandler.closePage();

      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve();
        }, defaultConfig.retryTimeout);
        Promise.all(promisesToBeResolvedBeforeCloseBrowser).then(() => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }
  }
  defaultConfig.connectedToRemoteBrowser
    ? await _client.Browser.close()
    : await closeBrowser();
  await _client.close();
  _client = null;
};

async function reconnect() {
  const response = await isReachable(
    `${defaultConfig.host}:${defaultConfig.port}`,
  );
  if (response) {
    try {
      logEvent("Reconnecting");
      eventHandler.emit("reconnecting");
      _client.removeAllListeners();
      const pages = await targetHandler.getFirstAvailablePageTarget();
      await connect_to_cri(pages[0].targetId);
      logEvent("Reconnected");
      eventHandler.emit("reconnected");
    } catch (e) {}
  }
}

const cleanUpListenersOnClient = async () => {
  _client.removeAllListeners();
  await _client.close();
};

const validate = () => {
  if (!_client) {
    throw new Error(
      "Browser or page not initialized. Call `openBrowser()` before using this API",
    );
  }
  if (_client._ws.readyState > 1) {
    errorMessageForBrowserProcessCrash();
    throw new Error(
      "Connection to browser lost. This probably isn't a problem with Taiko, inspect logs for possible causes.",
    );
  }
};

const getClient = () => _client;

eventHandler.addListener("targetCreated", async (newTarget) => {
  const response = await isReachable(
    `${defaultConfig.host}:${defaultConfig.port}`,
  );
  if (response) {
    const pages = await targetHandler.getFirstAvailablePageTarget();
    await connect_to_cri(pages[0].targetId).then(() => {
      logEvent(`Target Navigated: Target id: ${newTarget.targetInfo.targetId}`);
      eventHandler.emit("targetNavigated");
    });
  }
});

module.exports = {
  connect_to_cri,
  closeConnection,
  cleanUpListenersOnClient,
  validate,
  getClient,
};
