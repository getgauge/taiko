const { defaultConfig } = require('./config');
const { eventHandler } = require('./eventBus');
const { isPromise } = require('./helper');
const { logEvent } = require('./logger');
const { errorMessageForBrowserProcessCrash, closeBrowser } = require('./browserLauncher');
const targetHandler = require('./handlers/targetHandler');
const pageHandler = require('./handlers/pageHandler');
const emulationHandler = require('./handlers/emulationHandler');
const cri = require('chrome-remote-interface');
const isReachable = require('is-reachable');
const numRetries = defaultConfig.criConnectionRetries;
const { pluginHooks } = require('./plugins');
let overlay, security, _client, page, network, dom;

const createProxyForCDPDomain = (cdpClient, cdpDomainName) => {
  console.log('taiko :: createProxyForCDPDomain :: cdpDomainName :', cdpDomainName)
  const cdpDomain = cdpClient[cdpDomainName];
  const cdpDomainProxy = new Proxy(cdpDomain, {
    get: (target, name) => {
      const domainApi = target[name];
      if (typeof domainApi === 'function') {
        return async (...args) => {
          return await new Promise((resolve, reject) => {
            console.log('taiko :: createProxyForCDPDomain 0')
            eventHandler.removeAllListeners('browserCrashed');
            console.log('taiko :: createProxyForCDPDomain 1')
            eventHandler.on('browserCrashed', () => {
              if (_client) {
                _client.removeAllListeners();
              }
              _client = null;
              reject();
            });
            console.log('taiko :: createProxyForCDPDomain 2')
            let res = domainApi.apply(null, args);
            console.log('taiko :: createProxyForCDPDomain 3')
            if (isPromise(res)) {
              console.log('taiko :: createProxyForCDPDomain 4')
              res.then(resolve).catch(reject);
            } else {
              console.log('taiko :: createProxyForCDPDomain 5')
              resolve(res);
            }
          }).catch((e) => {
            console.log('taiko :: createProxyForCDPDomain 6', e)
            if (e.message.match(/WebSocket is not open: readyState 3/i)) {
              errorMessageForBrowserProcessCrash();
            }
            throw e;
          });
        };
      } else {
        console.log('taiko :: createProxyForCDPDomain 7')
        return domainApi;
      }
    },
  });
  console.log('taiko :: createProxyForCDPDomain 8')
  cdpClient[cdpDomainName] = cdpDomainProxy;
  return cdpClient[cdpDomainName];
};
const initCRIProperties = (c) => {
  page = createProxyForCDPDomain(c, 'Page');
  network = createProxyForCDPDomain(c, 'Network');
  createProxyForCDPDomain(c, 'Runtime');
  createProxyForCDPDomain(c, 'Input');
  dom = createProxyForCDPDomain(c, 'DOM');
  overlay = createProxyForCDPDomain(c, 'Overlay');
  security = createProxyForCDPDomain(c, 'Security');
  createProxyForCDPDomain(c, 'Browser');
  createProxyForCDPDomain(c, 'Target');
  createProxyForCDPDomain(c, 'Emulation');
  _client = c;
};

const initCRI = async (target, n, options = {}) => {
  console.log('taiko :: initCRI start')
  try {
    //console.log('taiko :: initCRI 0')
    ({ target, options } = await pluginHooks.preConnectionHook(target, options));
    //console.log('taiko :: initCRI 1')
    var c = await cri({
      target,
      host: defaultConfig.host,
      port: defaultConfig.port,
      useHostName: defaultConfig.useHostName,
      secure: defaultConfig.secure,
      alterPath: defaultConfig.alterPath,
      local: defaultConfig.local,
    });
    console.log('taiko :: initCRI 2')
    const promises = [];
    eventHandler.on('handlerActingOnNewSession', (promise) => {
      promises.push(promise);
    });
    console.log('taiko :: initCRI 3')
    initCRIProperties(c);
    const domainEnablePromises = [network.enable(), page.enable(), dom.enable(), security.enable()];
    console.log('taiko :: initCRI 4')
    if (!defaultConfig.firefox) {
      console.log('taiko :: initCRI 5')
      domainEnablePromises.push(overlay.enable());
    }
    console.log('taiko :: initCRI 6')
    //await Promise.all(domainEnablePromises);
    await domainEnablePromises[0]
    console.log('taiko :: initCRI after network')
    await domainEnablePromises[1]
    console.log('taiko :: initCRI after page')
    await domainEnablePromises[2]
    console.log('taiko :: initCRI after dom')
    await domainEnablePromises[3]
    console.log('taiko :: initCRI after security')
    console.log('taiko :: initCRI 7')
    _client.on('disconnect', reconnect);
    console.log('taiko :: initCRI 8')
    // Should be emitted after enabling all domains. All handlers can then perform any action on domains properly.
    eventHandler.emit('createdSession', _client, target);
    if (defaultConfig.ignoreSSLErrors) {
      console.log('taiko :: initCRI 9')
      security.setIgnoreCertificateErrors({ ignore: true });
    }
    defaultConfig.device = process.env.TAIKO_EMULATE_DEVICE;
    if (defaultConfig.device) {
      console.log('taiko :: initCRI 10')
      emulationHandler.emulateDevice(defaultConfig.device);
    }
    console.log('taiko :: initCRI 11')
    await Promise.all(promises);
    console.log('taiko :: initCRI 12')
    eventHandler.removeAllListeners('handlerActingOnNewSession');
    console.log('taiko :: initCRI 13')
    logEvent('Session Created');
    return _client;
  } catch (error) {
    console.log('taiko :: initCRI 14', error)
    logEvent(error);
    if (n < 2) {
      throw error;
    }
    console.log('taiko :: initCRI 15')
    return new Promise((r) => setTimeout(r, 100)).then(
      async () => {
        return await initCRI(target, n - 1, options)
      },
    );
  }
};

const connect_to_cri = async (target, options = {}) => {
  console.log('taiko :: connect_to_cri start')
  if (_client && _client._ws.readyState === 1) {
    console.log('taiko :: connect_to_cri 0')
    if (!defaultConfig.firefox) {
      console.log('taiko :: connect_to_cri 1')
      await network.setRequestInterception({
        patterns: [],
      });
      console.log('taiko :: connect_to_cri 2')
    }
    console.log('taiko :: connect_to_cri 3')
    _client.removeAllListeners();
    console.log('taiko :: connect_to_cri 4')
  }
  console.log('taiko :: connect_to_cri 5')
  var tgt = target || (await targetHandler.waitForTargetToBeCreated(numRetries));
  console.log('taiko :: connect_to_cri 6')
  return initCRI(tgt, numRetries, options);
};

const closeConnection = async (promisesToBeResolvedBeforeCloseBrowser) => {
  if (_client) {
    // remove listeners other than JS dialog for beforeUnload on client first to stop executing them when closing
    await _client.removeAllListeners();
    pageHandler.addJavascriptDialogOpeningListener();
    //TODO: Remove check once fixed https://bugs.chromium.org/p/chromium/issues/detail?id=1147809
    if (!defaultConfig.firefox && !(process.platform == 'win32' && defaultConfig.headful)) {
      await pageHandler.closePage();

      await new Promise((resolve) => {
        let timeout = setTimeout(() => {
          resolve();
        }, defaultConfig.retryTimeout);
        Promise.all(promisesToBeResolvedBeforeCloseBrowser).then(() => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }
  }
  defaultConfig.connectedToRemoteBrowser ? await _client.Browser.close() : await closeBrowser();
  await _client.close();
  _client = null;
};

async function reconnect() {
  const response = await isReachable(`${defaultConfig.host}:${defaultConfig.port}`);
  if (response) {
    try {
      logEvent('Reconnecting');
      eventHandler.emit('reconnecting');
      _client.removeAllListeners();
      const pages = await targetHandler.getFirstAvailablePageTarget();
      await connect_to_cri(pages[0].targetId);
      logEvent('Reconnected');
      eventHandler.emit('reconnected');
    } catch (e) {}
  }
}

const cleanUpListenersOnClient = async () => {
  _client.removeAllListeners();
  await _client.close();
};

const validate = () => {
  if (!_client) {
    throw new Error('Browser or page not initialized. Call `openBrowser()` before using this API');
  }
  if (_client._ws.readyState > 1) {
    errorMessageForBrowserProcessCrash();
    throw new Error(
      "Connection to browser lost. This probably isn't a problem with Taiko, inspect logs for possible causes.",
    );
  }
};

const getClient = () => _client;

eventHandler.addListener('targetCreated', async (newTarget) => {
  const response = await isReachable(`${defaultConfig.host}:${defaultConfig.port}`);
  if (response) {
    const pages = await targetHandler.getFirstAvailablePageTarget();
    await connect_to_cri(pages[0].targetId).then(() => {
      logEvent(`Target Navigated: Target id: ${newTarget.targetInfo.targetId}`);
      eventHandler.emit('targetNavigated');
    });
  }
});

module.exports = { connect_to_cri, closeConnection, cleanUpListenersOnClient, validate, getClient };
