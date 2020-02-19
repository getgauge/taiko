const { doActionAwaitingNavigation } = require('./doActionAwaitingNavigation');

const cri = require('chrome-remote-interface');
const childProcess = require('child_process');
const {
  helper,
  wait,
  isString,
  isStrictObject,
  isFunction,
  waitUntil,
  xpath,
  timeouts,
  assertType,
  descEvent,
  isSelector,
  isElement,
} = require('./helper');
const { createJsDialogEventName } = require('./util');
const inputHandler = require('./handlers/inputHandler');
const domHandler = require('./handlers/domHandler');
const networkHandler = require('./handlers/networkHandler');
const pageHandler = require('./handlers/pageHandler');
const targetHandler = require('./handlers/targetHandler');
const runtimeHandler = require('./handlers/runtimeHandler');
const browserHandler = require('./handlers/browserHandler');
const emulationHandler = require('./handlers/emulationHandler');
const logEvent = require('./logger');
const { match, $$, $$xpath, findElements, findFirstElement } = require('./elementSearch');
const { handleRelativeSearch, RelativeSearchElement } = require('./proximityElementSearch');
const Element = require('./elements/element');

const {
  prepareParameters,
  getElementGetter,
  desc,
  createElementWrapper,
} = require('./elementWrapper/elementWrapperFactory');
const {
  setConfig,
  getConfig,
  defaultConfig,
  setNavigationOptions,
  setClickOptions,
  setBrowserOptions,
} = require('./config');
const fs = require('fs-extra');
const path = require('path');
const { eventHandler } = require('./eventBus');
const overlayHandler = require('./handlers/overlayHandler');
const { highlightElement } = require('./elements/elementHelper');
const numRetries = process.env.TAIKO_CRI_CONNECTION_RETRIES || 10;

let chromeProcess,
  temporaryUserDataDir,
  page,
  network,
  runtime,
  input,
  _client,
  dom,
  overlay,
  currentPort,
  currentHost,
  security,
  device,
  eventHandlerProxy,
  clientProxy,
  localProtocol = false;

module.exports.emitter = descEvent;

const createTarget = async () => {
  try {
    const browserTargets = await cri.List({
      host: currentHost,
      port: currentPort,
    });
    if (!browserTargets.length) {
      throw new Error('No targets created yet! bl');
    }
    var target = browserTargets.find(t => t.type === 'page');
    if (!target) {
      throw new Error('No targets created yet!');
    }
    return target;
  } catch (err) {
    return await createTarget();
  }
};

const initCRIProperties = c => {
  _client = c;
  clientProxy = getEventProxy(_client);
  page = c.Page;
  network = c.Network;
  runtime = c.Runtime;
  input = c.Input;
  dom = c.DOM;
  overlay = c.Overlay;
  security = c.Security;
};

const initCRI = async (target, n) => {
  try {
    var c = await cri({ target, local: localProtocol });
    initCRIProperties(c);
    await Promise.all([
      runtime.enable(),
      network.enable(),
      page.enable(),
      dom.enable(),
      overlay.enable(),
      security.enable(),
    ]);
    if (defaultConfig.ignoreSSLErrors) {
      security.setIgnoreCertificateErrors({ ignore: true });
    }
    _client.on('disconnect', reconnect);
    device = process.env.TAIKO_EMULATE_DEVICE;
    if (device) {
      emulateDevice(device);
    }
    // Should be emitted after enabling all domains. All handlers can then perform any action on domains properly.
    eventHandler.emit('createdSession', _client);
    logEvent('Session Created');
  } catch (error) {
    console.log(error);
    if (n < 2) {
      throw error;
    }
    return new Promise(r => setTimeout(r, 1000)).then(async () => await initCRI(target, n - 1));
  }
};

const connect_to_cri = async target => {
  if (process.env.LOCAL_PROTOCOL) {
    localProtocol = true;
  }
  if (_client) {
    await network.setRequestInterception({
      patterns: [],
    });
    _client.removeAllListeners();
  }
  var tgt = target || (await createTarget());
  return initCRI(tgt, numRetries);
};

async function reconnect() {
  try {
    logEvent('Reconnecting');
    eventHandler.emit('reconnecting');
    _client.removeAllListeners();
    _client = null;
    const browserTargets = await cri.List({
      host: currentHost,
      port: currentPort,
    });
    const pages = browserTargets.filter(target => {
      return target.type === 'page';
    });
    await connect_to_cri(pages[0]);
    await dom.getDocument();
    logEvent('Reconnected');
    eventHandler.emit('reconnected');
  } catch (e) {
    console.log(e);
  }
}

eventHandler.addListener('targetCreated', async newTarget => {
  const browserTargets = await cri.List({
    host: currentHost,
    port: currentPort,
  });
  const pages = browserTargets.filter(target => {
    return target.targetId === newTarget.targetId;
  });
  await connect_to_cri(pages[0]).then(() => {
    logEvent(`Target Navigated: Target id: ${newTarget.targetId}`);
    eventHandler.emit('targetNavigated');
  });
});

/**
 * Launches a browser with a tab. The browser will be closed when the parent node.js process is closed.<br>
 * Note : `openBrowser` launches the browser in headless mode by default, but when `openBrowser` is called from {@link repl} it launches the browser in headful mode.
 * @example
 * await openBrowser({headless: false})
 * await openBrowser()
 * await openBrowser({args:['--window-size=1440,900']})
 * await openBrowser({args: [
 *      '--disable-gpu',
 *       '--disable-dev-shm-usage',
 *       '--disable-setuid-sandbox',
 *       '--no-first-run',
 *       '--no-sandbox',
 *       '--no-zygote']}) # These are recommended args that has to be passed when running in docker
 *
 * @param {Object} [options={headless:true}] eg. {headless: true|false, args:['--window-size=1440,900']}
 * @param {boolean} [options.headless=true] - Option to open browser in headless/headful mode.
 * @param {Array<string>} [options.args=[]] - Args to open chromium. Refer https://peter.sh/experiments/chromium-command-line-switches/ for values.
 * @param {string} [options.host='127.0.0.1'] - Remote host to connect to.
 * @param {number} [options.port=0] - Remote debugging port, if not given connects to any open port.
 * @param {boolean} [options.ignoreCertificateErrors=false] - Option to ignore certificate errors.
 * @param {boolean} [options.observe=false] - Option to run each command after a delay. Useful to observe what is happening in the browser.
 * @param {number} [options.observeTime=3000] - Option to modify delay time for observe mode. Accepts value in milliseconds.
 * @param {boolean} [options.dumpio=false] - Option to dump IO from browser.
 *
 * @returns {Promise}
 */
module.exports.openBrowser = async (
  options = {
    headless: true,
  },
) => {
  if (!isStrictObject(options)) {
    throw new TypeError(
      'Invalid option parameter. Refer https://docs.taiko.dev/#parameters for the correct format.',
    );
  }

  if (chromeProcess && !chromeProcess.killed) {
    throw new Error('OpenBrowser cannot be called again as there is a chromium instance open.');
  }

  if (options.host && options.port) {
    currentHost = options.host;
    currentPort = options.port;
  } else {
    const BrowserFetcher = require('./browserFetcher');
    const browserFetcher = new BrowserFetcher();
    const chromeExecutable = browserFetcher.getExecutablePath();
    options = setBrowserOptions(options);
    let args = [
      `--remote-debugging-port=${options.port}`,
      '--disable-features=site-per-process,TranslateUI',
      '--enable-features=NetworkService,NetworkServiceInProcess',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
      '--disable-background-timer-throttling',
      '--disable-background-networking',
      '--disable-breakpad',
      '--disable-default-apps',
      '--disable-hang-monitor',
      '--disable-prompt-on-repost',
      '--disable-sync',
      '--force-color-profile=srgb',
      '--safebrowsing-disable-auto-update',
      '--password-store=basic',
      '--use-mock-keychain',
      '--enable-automation',
      '--disable-notifications',
      'about:blank',
    ];
    if (options.args) {
      args = args.concat(options.args);
    }
    if (!args.some(arg => arg.startsWith('--user-data-dir'))) {
      const os = require('os');
      const CHROME_PROFILE_PATH = path.join(os.tmpdir(), 'taiko_dev_profile-');
      const mkdtempAsync = helper.promisify(fs.mkdtemp);
      temporaryUserDataDir = await mkdtempAsync(CHROME_PROFILE_PATH);
      args.push(`--user-data-dir=${temporaryUserDataDir}`);
    }
    if (options.headless) {
      args = args.concat(['--headless', '--window-size=1440,900']);
    }
    chromeProcess = await childProcess.spawn(chromeExecutable, args);
    if (options.dumpio) {
      chromeProcess.stderr.pipe(process.stderr);
      chromeProcess.stdout.pipe(process.stdout);
    }
    const endpoint = await browserFetcher.waitForWSEndpoint(
      chromeProcess,
      defaultConfig.navigationTimeout,
    );
    currentHost = endpoint.host;
    currentPort = endpoint.port;
  }
  await connect_to_cri();
  var description = device ? `Browser opened with viewport ${device}` : 'Browser opened';
  descEvent.emit('success', description);
  if (process.env.TAIKO_EMULATE_NETWORK) {
    await module.exports.emulateNetwork(process.env.TAIKO_EMULATE_NETWORK);
  }
};

/**
 * Closes the browser and along with all of its tabs.
 *
 * @example
 * await closeBrowser()
 *
 * @returns {Promise}
 */
module.exports.closeBrowser = async () => {
  validate();
  await _closeBrowser();
  descEvent.emit('success', 'Browser closed');
};

const _closeBrowser = async () => {
  timeouts.forEach(timeout => {
    if (timeout) {
      clearTimeout(timeout);
    }
  });
  networkHandler.resetInterceptors();
  if (_client) {
    await reconnect();
    await _client.removeAllListeners();
    await page.close();
    await _client.close();
    _client = null;
  }
  if (chromeProcess) {
    const waitForChromeToClose = new Promise(fulfill => {
      chromeProcess.once('exit', () => {
        fulfill();
      });
    });
    chromeProcess.kill('SIGTERM');
    await waitForChromeToClose;
    if (temporaryUserDataDir) {
      try {
        fs.removeSync(temporaryUserDataDir);
      } catch (e) {}
    }
  }
};

function getEventProxy(target) {
  let unsupportedClientMethods = [
    'removeListener',
    'emit',
    'removeAllListeners',
    'setMaxListeners',
    'off',
  ];
  const handler = {
    get: (target, name) => {
      if (unsupportedClientMethods.includes(name)) {
        throw new Error(`Unsupported action ${name} on client`);
      }
      return target[name];
    },
  };
  return new Proxy(target, handler);
}

/**
 * Gives CRI client object (a wrapper around Chrome DevTools Protocol). Refer https://github.com/cyrus-and/chrome-remote-interface
 * This is useful while writing plugins or if use some API of [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/).
 *
 * @returns {Object}
 */
module.exports.client = () => clientProxy;

/**
 * Allows switching between tabs using URL or page title.
 *
 * @example
 * # switch using URL
 * await switchTo('https://taiko.dev')
 * # switch using Title
 * await switchTo('Taiko')
 * # switch using regex URL
 * await switchTo(/http(s?):\/\/(www?).google.(com|co.in|co.uk)/)
 * # switch using regex Title
 * await switchTo(/Go*gle/)
 *
 * @param {string} targetUrl - URL/Page title of the tab to switch.
 *
 * @returns {Promise}
 */

module.exports.switchTo = async targetUrl => {
  validate();
  if (
    typeof targetUrl != 'string' &&
    !Object.prototype.toString.call(targetUrl).includes('RegExp')
  ) {
    throw new TypeError(
      'The "targetUrl" argument must be of type string or regex. Received type ' + typeof targetUrl,
    );
  }
  if (Object.prototype.toString.call(targetUrl).includes('RegExp')) {
    targetUrl = new RegExp(targetUrl);
  }
  const targets = await targetHandler.getCriTargets(targetUrl, currentHost, currentPort);
  if (targets.matching.length === 0) {
    throw new Error(`No tab(s) matching ${targetUrl} found`);
  }
  await connect_to_cri(targets.matching[0]);
  await dom.getDocument();
  descEvent.emit('success', `Switched to tab matching ${targetUrl}`);
};

/**
 * Add interceptor for the network call. Helps in overriding request or to mock response of a network call.
 *
 * @example
 * # case 1: block URL :
 * await intercept(url)
 * # case 2: mockResponse :
 * await intercept(url, {mockObject})
 * # case 3: override request :
 * await intercept(url, (request) => {request.continue({overrideObject})})
 * # case 4: redirect always :
 * await intercept(url, redirectUrl)
 * # case 5: mockResponse based on request :
 * await intercept(url, (request) => { request.respond({mockResponseObject}) })
 * # case 6: block URL twice:
 * await intercept(url, undefined, 2)
 * # case 7: mockResponse only 3 times :
 * await intercept(url, {mockObject}, 3)
 *
 * @param {string} requestUrl request URL to intercept
 * @param {function|Object} option action to be done after interception. For more examples refer to https://github.com/getgauge/taiko/issues/98#issuecomment-42024186
 * @param {number} count number of times the request has to be intercepted . Optional parameter
 *
 * @returns {Promise}
 */
module.exports.intercept = async (requestUrl, option, count) => {
  await networkHandler.addInterceptor({
    requestUrl: requestUrl,
    action: option,
    count,
  });
  descEvent.emit('success', 'Interceptor added for ' + requestUrl);
};

/**
 * Activates emulation of network conditions.
 *
 * @example
 * await emulateNetwork("Offline")
 * await emulateNetwork("Good2G")
 *
 * @param {string} networkType - 'GPRS','Regular2G','Good2G','Good3G','Regular3G','Regular4G','DSL','WiFi, Offline'
 *
 * @returns {Promise}
 */

module.exports.emulateNetwork = async networkType => {
  validate();
  await networkHandler.setNetworkEmulation(networkType);
  descEvent.emit('success', 'Set network emulation with values ' + JSON.stringify(networkType));
};

/**
 * Overrides the values of device screen dimensions according to a predefined list of devices. To provide custom device dimensions, use setViewPort API.
 *
 * @example
 * await emulateDevice('iPhone 6')
 *
 * @param {string} deviceModel - See [device model](https://github.com/getgauge/taiko/blob/master/lib/data/devices.js) for a list of all device models.
 *
 * @returns {Promise}
 */

module.exports.emulateDevice = emulateDevice;
async function emulateDevice(deviceModel) {
  validate();
  const devices = require('./data/devices').default;
  const deviceEmulate = devices[deviceModel];
  let deviceNames = Object.keys(devices);
  if (deviceEmulate == undefined) {
    throw new Error(`Please set one of the given device models \n${deviceNames.join('\n')}`);
  }
  await Promise.all([
    emulationHandler.setViewport(deviceEmulate.viewport),
    network.setUserAgentOverride({
      userAgent: deviceEmulate.userAgent,
    }),
  ]);
  descEvent.emit('success', 'Device emulation set to ' + deviceModel);
}

/**
 * Overrides the values of device screen dimensions
 *
 * @example
 * await setViewPort({width:600, height:800})
 *
 * @param {Object} options - See [chrome devtools setDeviceMetricsOverride](https://chromedevtools.github.io/devtools-protocol/tot/Emulation#method-setDeviceMetricsOverride) for a list of options
 *
 * @returns {Promise}
 */
module.exports.setViewPort = async options => {
  validate();
  await emulationHandler.setViewport(options);
  descEvent.emit(
    'success',
    'ViewPort is set to width ' + options.width + ' and height ' + options.height,
  );
};

/**
 * Changes the timezone of the page. See [`metaZones.txt`](https://cs.chromium.org/chromium/src/third_party/icu/source/data/misc/metaZones.txt?rcl=faee8bc70570192d82d2978a71e2a615788597d1)
 * for a list of supported timezone IDs.
 * @example
 * await emulateTimezone('America/Jamaica')
 */

module.exports.emulateTimezone = async timezoneId => {
  await emulationHandler.setTimeZone(timezoneId);
  descEvent.emit('success', 'Timezone set to ' + timezoneId);
};

/**
 * Launches a new tab. If url is provided, the new tab is opened with the url loaded.
 * @example
 * await openTab('https://taiko.dev')
 * await openTab() # opens a blank tab.
 *
 * @param {string} [targetUrl=undefined] - Url of page to open in newly created tab.
 * @param {Object} options
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the reload. Default navigation timeout is 5000 milliseconds, to override pass `{ navigationTimeout: 10000 }` in `options` parameter.
 * @param {number} [options.navigationTimeout=5000] - Navigation timeout value in milliseconds for navigation after click. Accepts value in milliseconds.
 * @param {number} [options.waitForStart=100] - time to wait to check for occurrence of page load events. Accepts value in milliseconds.
 * @param {string[]} [options.waitForEvents = ['firstMeaningfulPaint']] - Page load events to implicitly wait for. Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']]
 *
 * @returns {Promise}
 */
module.exports.openTab = async (
  targetUrl,
  options = {
    navigationTimeout: defaultConfig.navigationTimeout,
  },
) => {
  validate();
  if (!targetUrl) {
    _client.removeAllListeners();
    let target = await cri.New({
      host: currentHost,
      port: currentPort,
    });
    await connect_to_cri(target);
    descEvent.emit('success', 'Opened a new tab');
    return;
  }
  if (!/^https?:\/\//i.test(targetUrl) && !/^file/i.test(targetUrl)) {
    targetUrl = 'http://' + targetUrl;
  }
  options = setNavigationOptions(options);
  options.isPageNavigationAction = true;
  await doActionAwaitingNavigation(options, async () => {
    _client.removeAllListeners();
    let target = await cri.New({
      host: currentHost,
      port: currentPort,
      url: targetUrl,
    });
    await connect_to_cri(target);
  });
  descEvent.emit('success', 'Opened tab with URL ' + targetUrl);
};

/**
 * Closes the given tab with given URL or closes current tab.
 *
 * @example
 * # Closes the current tab.
 * await closeTab()
 * # Closes all the tabs with Title 'Open Source Test Automation Framework | Gauge'.
 * await closeTab('Open Source Test Automation Framework | Gauge')
 * # Closes all the tabs with URL 'https://gauge.org'.
 * await closeTab('https://gauge.org')
 * # Closes all the tabs with Regex Title 'Go*gle'
 * await closeTab(/Go*gle/)
 * # Closes all the tabs with Regex URL '/http(s?):\/\/(www?).google.(com|co.in|co.uk)/'
 * await closeTab(/http(s?):\/\/(www?).google.(com|co.in|co.uk)/)
 *
 * @param {string} [targetUrl=undefined] - URL/Page title of the tab to close.
 *
 * @returns {Promise}
 */
module.exports.closeTab = async targetUrl => {
  validate();
  if (
    targetUrl != null &&
    (Object.prototype.toString.call(targetUrl).includes('RegExp') || typeof targetUrl != 'string')
  ) {
    targetUrl = new RegExp(targetUrl);
  }
  const { matching, others } = await targetHandler.getCriTargets(
    targetUrl,
    currentHost,
    currentPort,
  );
  if (!others.length) {
    await _closeBrowser();
    descEvent.emit('success', 'Closing last target and browser.');
    return;
  }
  if (!matching.length) {
    throw new Error(`No tab(s) matching ${targetUrl} found`);
  }
  let currentUrl = await currentURL();
  let closedTabUrl;
  for (let target of matching) {
    closedTabUrl = target.url;
    await cri.Close({
      host: currentHost,
      port: currentPort,
      id: target.id,
    });
  }
  if (
    !targetHandler.isMatchingUrl(others[0], currentUrl) &&
    !targetHandler.isMatchingRegex(others[0], currentUrl)
  ) {
    _client.removeAllListeners();
    _client = null;
    await connect_to_cri(others[0]);
    await dom.getDocument();
  }
  let message = targetUrl
    ? `Closed tab(s) matching ${targetUrl}`
    : `Closed current tab matching ${closedTabUrl}`;
  descEvent.emit('success', message);
};

/**
 * Override specific permissions to the given origin
 *
 * @example
 * await overridePermissions('http://maps.google.com',['geolocation']);
 *
 * @param {string} origin - url origin to override permissions
 * @param {Array<string>} permissions - See [chrome devtools permission types](https://chromedevtools.github.io/devtools-protocol/tot/Browser/#type-PermissionType) for a list of permission types.
 *
 * @returns {Promise}
 */
module.exports.overridePermissions = async (origin, permissions) => {
  validate();
  await browserHandler.overridePermissions(origin, permissions);
  descEvent.emit('success', 'Override permissions with ' + permissions);
};

/**
 * Clears all permission overrides for all origins.
 *
 * @example
 * await clearPermissionOverrides()
 *
 * @returns {Promise}
 */
module.exports.clearPermissionOverrides = async () => {
  validate();
  await browserHandler.clearPermissionOverrides();
  descEvent.emit('success', 'Cleared permission overrides');
};

/**
 * Sets a cookie with the given cookie data. It may overwrite equivalent cookie if it already exists.
 *
 * @example
 * await setCookie("CSRFToken","csrfToken", {url: "http://the-internet.herokuapp.com"})
 * await setCookie("CSRFToken","csrfToken", {domain: "herokuapp.com"})
 *
 * @param {string} name - Cookie name.
 * @param {string} value - Cookie value.
 * @param {Object} options
 * @param {string} [options.url=undefined] - sets cookie with the URL.
 * @param {string} [options.domain=undefined] - sets cookie with the exact domain.
 * @param {string} [options.path=undefined] - sets cookie with the exact path.
 * @param {boolean} [options.secure=undefined] - True if cookie to be set is secure.
 * @param {boolean} [options.httpOnly=undefined] - True if cookie to be set is http-only.
 * @param {string} [options.sameSite=undefined] - Represents the cookie's 'SameSite' status: Refer https://tools.ietf.org/html/draft-west-first-party-cookies.
 * @param {number} [options.expires=undefined] - UTC time in seconds, counted from January 1, 1970. eg: 2019-02-16T16:55:45.529Z
 *
 * @returns {Promise}
 */
module.exports.setCookie = async (name, value, options = {}) => {
  validate();
  if (options.url === undefined && options.domain === undefined) {
    throw new Error('At least URL or domain needs to be specified for setting cookies');
  }
  options.name = name;
  options.value = value;
  let res = await network.setCookie(options);
  if (!res.success) {
    throw new Error('Unable to set ' + name + ' cookie');
  }
  descEvent.emit('success', name + ' cookie set successfully');
};

/**
 * Deletes browser cookies with matching name and URL or domain/path pair. If cookie name is not given or empty, all browser cookies are deleted.
 *
 * @example
 * await deleteCookies() # clears all browser cookies
 * await deleteCookies("CSRFToken", {url: "http://the-internet.herokuapp.com"})
 * await deleteCookies("CSRFToken", {domain: "herokuapp.com"})
 *
 * @param {string} [cookieName=undefined] - Cookie name.
 * @param {Object} options
 * @param {string} [options.url=undefined] - deletes all the cookies with the given name where domain and path match provided URL. eg: https://google.com
 * @param {string} [options.domain=undefined] - deletes only cookies with the exact domain. eg: google.com
 * @param {string} [options.path=undefined] - deletes only cookies with the exact path. eg: Google/Chrome/Default/Cookies/..
 *
 * @returns {Promise}
 */
module.exports.deleteCookies = async (cookieName, options = {}) => {
  validate();
  if (!cookieName || !cookieName.trim()) {
    await network.clearBrowserCookies();
    descEvent.emit('success', 'Browser cookies deleted successfully');
  } else {
    if (options.url === undefined && options.domain === undefined) {
      throw new Error('At least URL or domain needs to be specified for deleting cookies');
    }
    options.name = cookieName;
    await network.deleteCookies(options);
    descEvent.emit('success', `"${cookieName}" cookie deleted successfully`);
  }
};

/**
 * Get browser cookies
 *
 * @example
 * await getCookies()
 * await getCookies({urls:['https://the-internet.herokuapp.com']})
 *
 * @param {Object} options
 * @param {Array} [options.urls=undefined] - The list of URLs for which applicable cookies will be fetched
 *
 * @returns {Promise<Object[]>} - Array of cookie objects
 */
module.exports.getCookies = async (options = {}) => {
  validate();
  return (await network.getCookies(options)).cookies;
};

/**
 * Overrides the Geolocation Position
 *
 * @example
 * await setLocation({ latitude: 27.1752868, longitude: 78.040009, accuracy:20 })
 *
 * @param {Object} options Latitue, logitude and accuracy to set the location.
 * @param {number} options.latitude - Mock latitude
 * @param {number} options.longitude - Mock longitude
 * @param {number} options.accuracy - Mock accuracy
 *
 * @returns {Promise}
 */
module.exports.setLocation = async options => {
  validate();
  await emulationHandler.setLocation(options);
  descEvent.emit('success', 'Geolocation set');
};

/**
 * Opens the specified URL in the browser's tab. Adds `http` protocol to the URL if not present.
 * @example
 * await goto('https://google.com')
 * await goto('google.com')
 * await goto({ navigationTimeout:10000, headers:{'Authorization':'Basic cG9zdG1hbjpwYXNzd29y2A=='}})
 *
 * @param {string} url - URL to navigate page to.
 * @param {Object} options
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the goto. Default navigationTimeout is 30 seconds to override pass `{ navigationTimeout: 10000 }` in `options` parameter.
 * @param {string[]} [options.waitForEvents = ['firstMeaningfulPaint']] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']
 * @param {number} [options.navigationTimeout=30000] - Navigation timeout value in milliseconds for navigation after click.
 * @param {Object} options.headers - Map with extra HTTP headers.
 * @param {number} [options.waitForStart = 100] - time to wait for navigation to start. Accepts value in milliseconds.
 *
 * @returns {Promise}
 */
module.exports.goto = async (
  url,
  options = { navigationTimeout: defaultConfig.navigationTimeout },
) => {
  validate();
  if (!/^https?:\/\//i.test(url) && !/^file/i.test(url)) {
    url = 'http://' + url;
  }
  if (options.headers) {
    await network.setExtraHTTPHeaders({ headers: options.headers });
  }
  options = setNavigationOptions(options);
  options.isPageNavigationAction = true;
  await doActionAwaitingNavigation(options, async () => {
    await pageHandler.handleNavigation(url);
  });
  descEvent.emit('success', 'Navigated to URL ' + url);
};

/**
 * Reloads the page.
 * @example
 * await reload('https://google.com')
 * await reload('https://google.com', { navigationTimeout: 10000 })
 *
 * @param {string} url - DEPRECATED URL to reload
 * @param {Object} options
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the reload. Default navigation timeout is 30 seconds, to override pass `{ navigationTimeout: 10000 }` in `options` parameter.
 * @param {string[]} [options.waitForEvents = ['firstMeaningfulPaint']] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']
 * @param {number} [options.navigationTimeout=30000] - Navigation timeout value in milliseconds for navigation after click.
 * @param {number} [options.waitForStart = 100] - time to wait for navigation to start. Accepts value in milliseconds.
 * @param {boolean} [options.ignoreCache = false] - Ignore Cache on reload - Default to false
 *
 * @returns {Promise}
 */
module.exports.reload = async (
  url,
  options = { navigationTimeout: defaultConfig.navigationTimeout },
) => {
  if (isString(url)) {
    console.warn('DEPRECATION WARNING: url is deprecated on reload');
  }
  if (typeof url === 'object') {
    options = Object.assign(url, options);
  }
  validate();
  options = setNavigationOptions(options);
  options.isPageNavigationAction = true;
  await doActionAwaitingNavigation(options, async () => {
    const value = options.ignoreCache || false;
    await page.reload({ ignoreCache: value });
  });
  let windowLocation = (await runtimeHandler.runtimeEvaluate('window.location.toString()')).result
    .value;
  descEvent.emit('success', windowLocation + 'reloaded');
};

/**
 * Mimics browser back button click functionality.
 * @example
 * await goBack()
 *
 * @param {Object} options
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the goBack. Default navigation timeout is 30 seconds, to override pass `{ navigationTimeout: 10000 }` in `options` parameter.
 * @param {string[]} [options.waitForEvents = ['firstMeaningfulPaint']] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']
 * @param {number} [options.navigationTimeout=30000] - Navigation timeout value in milliseconds for navigation after click.
 * @param {number} [options.waitForStart = 100] - time to wait for navigation to start. Accepts value in milliseconds.
 *
 * @returns {Promise}
 */
module.exports.goBack = async (
  options = { navigationTimeout: defaultConfig.navigationTimeout },
) => {
  validate();
  await _go(-1, options);
  descEvent.emit('success', 'Performed clicking on browser back button');
};

/**
 * Mimics browser forward button click functionality.
 * @example
 * await goForward()
 *
 * @param {Object} options
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the goForward. Default navigation timeout is 30 seconds, to override pass `{ navigationTimeout: 10000 }` in `options` parameter.
 * @param {string[]} [options.waitForEvents = ['firstMeaningfulPaint']] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']
 * @param {number} [options.navigationTimeout=30000] - Navigation timeout value in milliseconds for navigation after click.
 * @param {number} [options.waitForStart = 100] - time to wait for navigation to start. Accepts value in milliseconds.
 *
 * @returns {Promise}
 */
module.exports.goForward = async (
  options = { navigationTimeout: defaultConfig.navigationTimeout },
) => {
  validate();
  await _go(+1, options);
  descEvent.emit('success', 'Performed clicking on browser forward button');
};

const _go = async (delta, options) => {
  const history = await page.getNavigationHistory();
  const entry = history.entries[history.currentIndex + delta];
  if (!entry) {
    return null;
  }
  if (
    entry.url === 'about:blank' &&
    !Object.prototype.hasOwnProperty.call(options, 'waitForNavigation')
  ) {
    options.waitForNavigation = false;
  }
  options = setNavigationOptions(options);
  await doActionAwaitingNavigation(options, async () => {
    await page.navigateToHistoryEntry({ entryId: entry.id });
  });
};

/**
 * Returns window's current URL.
 * @example
 * await openBrowser();
 * await goto("www.google.com");
 * await currentURL(); # returns "https://www.google.com/?gws_rd=ssl"
 *
 * @returns {Promise<string>} - The URL of the current window.
 */
const currentURL = async () => {
  validate();
  const locationObj = await runtimeHandler.runtimeEvaluate('window.location.toString()');
  return locationObj.result.value;
};
module.exports.currentURL = currentURL;

/**
 * Returns page's title.
 * @example
 * await openBrowser();
 * await goto("www.google.com");
 * await title(); # returns "Google"
 *
 * @returns {Promise<string>} - The title of the current page.
 */
module.exports.title = async () => {
  validate();
  const result = await runtimeHandler.runtimeEvaluate(
    'document.querySelector("title").textContent',
  );
  return result.result.value;
};

const checkIfElementAtPointOrChild = async e => {
  function isElementAtPointOrChild() {
    function getDirectParent(nodes, elem) {
      return nodes.find(node => node.contains(elem));
    }

    let value,
      elem = this;
    if (elem.nodeType === Node.TEXT_NODE) {
      let range = document.createRange();
      range.selectNodeContents(elem);
      value = range.getClientRects()[0];
      elem = elem.parentElement;
    } else {
      value = elem.getBoundingClientRect();
    }
    const y = (value.top + value.bottom) / 2;
    const x = (value.left + value.right) / 2;

    const nodes = document.elementsFromPoint(x, y);
    const isElementCoveredByAnotherElement = nodes[0] !== elem;
    let node = null;
    if (isElementCoveredByAnotherElement) {
      node = document.elementFromPoint(x, y);
    } else {
      node = getDirectParent(nodes, elem);
    }
    return (
      elem.contains(node) ||
      node.contains(elem) ||
      window.getComputedStyle(node).getPropertyValue('opacity') < 0.1 ||
      window.getComputedStyle(elem).getPropertyValue('opacity') < 0.1
    );
  }
  const nodeId = e.get();
  const res = await runtimeHandler.runtimeCallFunctionOn(isElementAtPointOrChild, null, {
    nodeId: nodeId,
  });
  return res.result.value;
};

const checkIfElementIsCovered = async (elem, isElemAtPoint) => {
  isElemAtPoint = await checkIfElementAtPointOrChild(elem);
  return isElemAtPoint;
};

async function _click(selector, options, ...args) {
  const elems = await handleRelativeSearch(await findElements(selector), args);
  let elemsLength = elems.length;
  let isElemAtPoint;
  let X;
  let Y;
  options = setClickOptions(options);
  if (elemsLength > options.elementsToMatch) {
    elems.splice(options.elementsToMatch, elems.length);
  }
  for (let elem of elems) {
    const nodeId = elem.get();
    isElemAtPoint = false;
    await scrollTo(elem);
    let { x, y } = await domHandler.boundingBoxCenter(nodeId);
    (X = x), (Y = y);
    isElemAtPoint = await checkIfElementIsCovered(elem, isElemAtPoint);
    let isDisabled = (
      await evaluate(elem, function() {
        return this.hasAttribute('disabled') ? this.disabled : false;
      })
    ).value;
    if (isDisabled) {
      throw Error(description(selector) + 'is disabled');
    }
    if (isElemAtPoint) {
      const type = (
        await evaluate(elem, function getType() {
          return this.type;
        })
      ).value;
      assertType(
        nodeId,
        () => type !== 'file',
        'Unsupported operation, use `attach` on file input field',
      );
      if (defaultConfig.headful) {
        await highlightElement(elem);
      }
      break;
    }
  }
  if (!isElemAtPoint && elemsLength != elems.length) {
    throw Error('Please provide a more specific selector, too many matches.');
  }
  if (!isElemAtPoint) {
    throw Error(description(selector) + ' is covered by other element');
  }
  (options.x = X), (options.y = Y);
  options.noOfClicks = options.noOfClicks || 1;
  for (let count = 0; count < options.noOfClicks; count++) {
    await waitForMouseActions(options);
  }
}

/**
 * Fetches an element with the given selector, scrolls it into view if needed, and then clicks in the center of the element. If there's no element matching selector, the method throws an error.
 * @example
 * await click('Get Started')
 * await click(link('Get Started'))
 * await click({x : 170, y : 567})
 *
 * @param {selector|string|Object} selector - A selector to search for element to click / coordinates of the elemets to click on. If there are multiple elements satisfying the selector, the first will be clicked.
 * @param {Object} options
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the click. Default navigation timeout is 30 seconds, to override pass `{ navigationTimeout: 10000 }` in `options` parameter.
 * @param {number} [options.navigationTimeout=30000] - Navigation timeout value in milliseconds for navigation after click.
 * @param {string} [options.button='left'] - `left`, `right`, or `middle`.
 * @param {number} [options.clickCount=1] - Number of times to click on the element.
 * @param {number} [options.elementsToMatch=10] - Number of elements to loop through to match the element with given selector.
 * @param {string[]} [options.waitForEvents = ['firstMeaningfulPaint']] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']
 * @param {number} [options.waitForStart=100] - time to wait for navigation to start. Accepts time in milliseconds.
 * @param {relativeSelector[]} args
 *
 * @returns {Promise}
 */
module.exports.click = click;

async function click(selector, options = {}, ...args) {
  validate();
  if (options instanceof RelativeSearchElement) {
    args = [options].concat(args);
    options = {};
  }
  if (isSelector(selector) || isString(selector) || isElement(selector)) {
    options.noOfClicks = options.clickCount || 1;
    await _click(selector, options, ...args);
    descEvent.emit(
      'success',
      'Clicked ' + description(selector, true) + ' ' + options.noOfClicks + ' times',
    );
  } else {
    options = setClickOptions(options, selector.x, selector.y);
    options.noOfClicks = options.clickCount || 1;
    for (let count = 0; count < options.noOfClicks; count++) {
      await waitForMouseActions(options);
    }
    descEvent.emit(
      'success',
      'Clicked ' +
        options.noOfClicks +
        ' times on coordinates x : ' +
        selector.x +
        ' and y : ' +
        selector.y,
    );
  }
}

/**
 * Fetches an element with the given selector, scrolls it into view if needed, and then double clicks the element. If there's no element matching selector, the method throws an error.
 *
 * @example
 * await doubleClick('Get Started')
 * await doubleClick(button('Get Started'))
 *
 * @param {selector|string} selector - A selector to search for element to click. If there are multiple elements satisfying the selector, the first will be double clicked.
 * @param {Object} options
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the click. Default navigation timout is 30 seconds, to override pass `{ navigationTimeout: 10000 }` in `options` parameter.
 * @param {relativeSelector[]} args
 *
 * @returns {Promise}
 */
module.exports.doubleClick = async (selector, options = {}, ...args) => {
  validate();
  if (options instanceof RelativeSearchElement) {
    args = [options].concat(args);
    options = {};
  }
  options = {
    waitForNavigation: options.waitForNavigation,
    clickCount: 2,
  };
  await _click(selector, options, ...args);
  descEvent.emit('success', 'Double clicked ' + description(selector, true));
};

/**
 * Fetches an element with the given selector, scrolls it into view if needed, and then right clicks the element. If there's no element matching selector, the method throws an error.
 *
 * @example
 * await rightClick('Get Started')
 * await rightClick(text('Get Started'))
 *
 * @param {selector|string} selector - A selector to search for element to right click. If there are multiple elements satisfying the selector, the first will be clicked.
 * @param {Object} options - Click options.
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the click. Default navigation timout is 30 seconds, to override pass `{ navigationTimeout: 10000 }` in `options` parameter.
 *
 * @returns {Promise}
 */
module.exports.rightClick = async (selector, options = {}, ...args) => {
  validate();
  if (options instanceof RelativeSearchElement) {
    args = [options].concat(args);
    options = {};
  }
  options = {
    waitForNavigation: options.waitForNavigation,
    button: 'right',
  };
  await _click(selector, options, ...args);
  descEvent.emit('success', 'Right clicked ' + description(selector, true));
};

/**
 * Fetches the source element with given selector and moves it to given destination selector or moves for given distance. If there's no element matching selector, the method throws an error.
 *Drag and drop of HTML5 draggable does not work as expected. Issue tracked here https://github.com/getgauge/taiko/issues/279
 *
 * @example
 * await dragAndDrop($("work"),into($('work done')))
 * await dragAndDrop($("work"),{up:10,down:10,left:10,right:10})
 *
 * @param {selector|string} source - Element to be Dragged
 * @param {selector|string} destination - Element for dropping the dragged element
 * @param {Object} distance - Distance to be moved from position of source element
 *
 * @returns {Promise}
 */
module.exports.dragAndDrop = async (source, destination) => {
  validate();
  let sourceElem = await findFirstElement(source);
  let dest =
    isSelector(destination) || isString(destination) || isElement(destination)
      ? await findFirstElement(destination)
      : destination;
  let options = setClickOptions({});
  await doActionAwaitingNavigation(options, async () => {
    if (defaultConfig.headful) {
      await highlightElement(sourceElem);
      if (isElement(dest)) {
        await highlightElement(dest);
      }
    }
    await dragAndDrop(options, sourceElem, dest);
  });
  const desc = isElement(dest)
    ? `Dragged and dropped ${description(sourceElem, true)} to ${description(dest, true)}}`
    : `Dragged and dropped ${description(sourceElem, true)} at ${JSON.stringify(destination)}`;
  descEvent.emit('success', desc);
};

const dragAndDrop = async (options, sourceElem, dest) => {
  let sourcePosition = await domHandler.boundingBoxCenter(sourceElem.get());
  await scrollTo(sourceElem);
  options.x = sourcePosition.x;
  options.y = sourcePosition.y;
  options.type = 'mouseMoved';
  await input.dispatchMouseEvent(options);
  options.type = 'mousePressed';
  await input.dispatchMouseEvent(options);
  let destPosition = await calculateDestPosition(sourceElem.get(), dest);
  await inputHandler.mouse_move(sourcePosition, destPosition);
  options.x = destPosition.x;
  options.y = destPosition.y;
  options.type = 'mouseReleased';
  await input.dispatchMouseEvent(options);
};

const calculateDestPosition = async (sourceElemNodeId, dest) => {
  if (isElement(dest)) {
    await scrollTo(dest);
    return await domHandler.boundingBoxCenter(dest.get());
  }
  const destPosition = await domHandler.calculateNewCenter(sourceElemNodeId, dest);
  const newBoundary = destPosition.newBoundary;
  if (defaultConfig.headful) {
    await overlayHandler.highlightQuad([
      newBoundary.right,
      newBoundary.top,
      newBoundary.right,
      newBoundary.bottom,
      newBoundary.left,
      newBoundary.bottom,
      newBoundary.left,
      newBoundary.top,
    ]);
    await waitFor(1000);
    await overlayHandler.hideHighlight();
  }
  return destPosition;
};

/**
 * Fetches an element with the given selector, scrolls it into view if needed, and then hovers over the center of the element. If there's no element matching selector, the method throws an error.
 *
 * @example
 * await hover('Get Started')
 * await hover(link('Get Started'))
 *
 * @param {selector|string} selector - A selector to search for element to right click. If there are multiple elements satisfying the selector, the first will be hovered.
 * @param {Object} options
 * @param {string[]} [options.waitForEvents = ['firstMeaningfulPaint']] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']
 */
module.exports.hover = async (selector, options = {}) => {
  validate();
  options = setNavigationOptions(options);
  const e = await findFirstElement(selector);
  await scrollTo(e);
  if (defaultConfig.headful) {
    await highlightElement(e);
  }
  const { x, y } = await domHandler.boundingBoxCenter(e.get());
  const option = {
    x: x,
    y: y,
  };
  await doActionAwaitingNavigation(options, async () => {
    Promise.resolve()
      .then(() => {
        option.type = 'mouseMoved';
        return input.dispatchMouseEvent(option);
      })
      .catch(err => {
        throw new Error(err);
      });
  });
  descEvent.emit('success', 'Hovered over the ' + description(selector, true));
};

/**
 * Fetches an element with the given selector and focuses it. If there's no element matching selector, the method throws an error.
 *
 * @example
 * await focus(textBox('Username:'))
 *
 * @param {selector|string} selector - A selector of an element to focus. If there are multiple elements satisfying the selector, the first will be focused.
 * @param {Object} options
 * @param {string[]} [options.waitForEvents = ['firstMeaningfulPaint']] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']
 */
module.exports.focus = async (selector, options = {}) => {
  validate();
  options = setNavigationOptions(options);
  await doActionAwaitingNavigation(options, async () => {
    if (defaultConfig.headful) {
      await highlightElement(await findFirstElement(selector));
    }
    await _focus(selector);
  });
  descEvent.emit('success', 'Focussed on the ' + description(selector, true));
};

/**
 * Types the given text into the focused or given element.
 * @example
 * await write('admin', into('Username:'))
 * await write('admin', 'Username:')
 * await write('admin')
 *
 * @param {string} text - Text to type into the element.
 * @param {selector|string} into - A selector of an element to write into.
 * @param {Object} options
 * @param {number} [options.delay = 10] - Time to wait between key presses in milliseconds.
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the click. Default navigation timeout is 15 seconds, to override pass `{ navigationTimeout: 10000 }` in `options` parameter.
 * @param {number} [options.waitForStart=100] - wait for navigation to start. Accepts time in milliseconds.
 * @param {number} [options.navigationTimeout=30000] - Navigation timeout value in milliseconds for navigation after click.
 * @param {boolean} [options.hideText=false] - Prevent given text from being written to log output.
 * @param {string[]} [options.waitForEvents = ['firstMeaningfulPaint']] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']
 *
 * @returns {Promise}
 */
module.exports.write = async (text, into, options = { delay: 10 }) => {
  if (text == null || text == undefined) {
    console.warn(`Invalid text value ${text}, setting value to empty ''`);
    text = '';
  } else {
    if (!isString(text)) {
      text = text.toString();
    }
  }
  validate();
  let desc;
  if (into && !isSelector(into) && !isElement(into)) {
    if (!into.delay) {
      into.delay = options.delay;
    }
    options = into;
    into = undefined;
  }
  options = setNavigationOptions(options);
  await doActionAwaitingNavigation(options, async () => {
    if (into) {
      const selector = isString(into) ? textBox(into) : into,
        elems = await handleRelativeSearch(await findElements(selector), []);
      await waitUntil(
        async () => {
          for (let elem of elems) {
            try {
              await _focus(elem);
              let activeElement = await runtimeHandler.activeElement();
              if (activeElement.notWritable) {
                continue;
              }
              return true;
            } catch (e) {}
          }
          return false;
        },
        100,
        1000,
      ).catch(() => {
        throw new Error('Element focused is not writable');
      });
      const textDesc = await _write(text, options);
      const d = description(selector, true);
      desc = `Wrote ${textDesc} into the ${d === '' ? 'focused element' : d}`;
    } else {
      const textDesc = await _write(text, options);
      desc = `Wrote ${textDesc} into the focused element.`;
    }
  });
  descEvent.emit('success', desc);
};

const _write = async (text, options) => {
  let activeElement = await runtimeHandler.activeElement();
  if (activeElement.notWritable) {
    await waitUntil(
      async () => !(await runtimeHandler.activeElement()).notWritable,
      100,
      10000,
    ).catch(() => {
      throw new Error('Element focused is not writable');
    });
    activeElement = await runtimeHandler.activeElement();
  }
  const showOrMaskText = activeElement.isPassword || options.hideText ? '*****' : text;
  if (defaultConfig.headful) {
    await highlightElement(new Element(activeElement.nodeId, '', runtimeHandler));
  }
  for (const char of text) {
    await inputHandler.down(char);
    await inputHandler.up(char);
    await new Promise(resolve => {
      const timeoutId = setTimeout(resolve, options.delay);
      timeouts.push(timeoutId);
    });
  }
  return showOrMaskText;
};

/**
 * Clears the value of given selector. If no selector is given clears the current active element.
 *
 * @example
 * await clear()
 * await clear(textBox({placeholder:'Email'}))
 *
 * @param {selector} selector - A selector to search for element to clear. If there are multiple elements satisfying the selector, the first will be cleared.
 * @param {Object} options - Click options.
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after clear. Default navigation timeout is 30 seconds, to override pass `{ navigationTimeout: 10000 }` in `options` parameter.
 * @param {number} [options.waitForStart=100] - wait for navigation to start. Accepts time in milliseconds.
 * @param {number} [options.navigationTimeout=30000] - Navigation timeout value in milliseconds for navigation after click.
 * @param {string[]} [options.waitForEvents = ['firstMeaningfulPaint']] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']
 *
 * @returns {Promise}
 */
module.exports.clear = async (selector, options = {}) => {
  validate();
  if (selector && !isSelector(selector) && !isElement(selector)) {
    options = selector;
    selector = undefined;
  }
  options = setNavigationOptions(options);
  let activeElement = await runtimeHandler.activeElement();
  if (activeElement.notWritable || selector) {
    await waitUntil(
      async () => {
        try {
          if (selector) {
            await _focus(selector);
          }
        } catch (_) {}
        return !(await runtimeHandler.activeElement()).notWritable;
      },
      100,
      10000,
    ).catch(() => {
      throw new Error('Element cannot be cleared');
    });
    activeElement = await runtimeHandler.activeElement();
  }
  if (activeElement.notWritable) {
    throw new Error('Element cannot be cleared');
  }
  const desc = !selector ? 'Cleared element on focus' : 'Cleared ' + description(selector, true);
  await doActionAwaitingNavigation(options, async () => {
    await _clear(activeElement.nodeId);
    if (defaultConfig.headful) {
      await highlightElement(new Element(activeElement.nodeId, '', runtimeHandler));
    }
  });
  descEvent.emit('success', desc);
};

const _clear = async elem => {
  await runtimeHandler.runtimeCallFunctionOn(
    function() {
      document.execCommand('selectall', false, null);
    },
    null,
    { nodeId: elem },
  );
  await inputHandler.down('Backspace');
  await inputHandler.up('Backspace');
};

/**
 * Attaches a file to a file input element.
 *
 * @example
 * await attach('c:/abc.txt', to('Please select a file:'))
 * await attach('c:/abc.txt', 'Please select a file:')
 *
 * @param {string} filepath - The path of the file to be attached.
 * @param {selector|string} to - The file input element to which to attach the file.
 */
module.exports.attach = async (filepath, to) => {
  validate();
  let resolvedPath = filepath ? path.resolve(process.cwd(), filepath) : path.resolve(process.cwd());
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`File ${resolvedPath} does not exist.`);
  }
  if (isString(to)) {
    to = fileField(to);
  } else if (!isSelector(to) && !isElement(to)) {
    throw Error('Invalid element passed as parameter');
  }
  const element = await findFirstElement(to);
  if (defaultConfig.headful) {
    await highlightElement(element);
  }
  await dom.setFileInputFiles({
    nodeId: element.get(),
    files: [resolvedPath],
  });
  descEvent.emit('success', 'Attached ' + resolvedPath + ' to the ' + description(to, true));
};

/**
 * Presses the given keys.
 *
 * @example
 * await press('Enter')
 * await press('a')
 * await press(['Shift', 'ArrowLeft', 'ArrowLeft'])
 *
 * @param {string | Array<string> } keys - Name of keys to press. See [USKeyboardLayout](https://github.com/getgauge/taiko/blob/master/lib/data/USKeyboardLayout.js) for a list of all key names.
 * @param {Object} options
 * @param {string} [options.text = ""] - If specified, generates an input event with this text.
 * @param {number} [options.delay=0] - Time to wait between keydown and keyup in milliseconds.
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the click. Default navigation timeout is 30 seconds, to override pass `{ navigationTimeout: 10000 }` in `options` parameter.
 * @param {number} [options.waitForStart=100] - wait for navigation to start.
 * @param {number} [options.navigationTimeout=30000] - Navigation timeout value in milliseconds for navigation after click.
 * @param {string[]} [options.waitForEvents = ['firstMeaningfulPaint']] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']
 *
 * @returns {Promise}
 */
module.exports.press = async (keys, options = {}) => {
  validate();
  options = setNavigationOptions(options);
  return await _press([].concat(keys), options);
};

async function _press(keys, options) {
  await doActionAwaitingNavigation(options, async () => {
    for (let i = 0; i < keys.length; i++) {
      await inputHandler.down(keys[i], options);
    }
    if (options && options.delay) {
      await new Promise(f => {
        const timeoutId = setTimeout(f, options.delay);
        timeouts.push(timeoutId);
      });
    }
    keys = keys.reverse();
    for (let i = 0; i < keys.length; i++) {
      await inputHandler.up(keys[i]);
    }
  });
  descEvent.emit('success', 'Pressed the ' + keys.reverse().join(' + ') + ' key');
}

/**
 * Highlights the given element on the page by drawing a red rectangle around it. This is useful for debugging purposes.
 *
 * @example
 * await highlight('Get Started')
 * await highlight(link('Get Started'))
 *
 * @param {selector|string} selector - A selector of an element to highlight. If there are multiple elements satisfying the selector, the first will be highlighted.
 * @param {relativeSelector[]} args - Proximity selectors
 *
 * @returns {Promise}
 */
module.exports.highlight = highlight;

async function highlight(selector, ...args) {
  validate();

  function highlightNode() {
    if (this.nodeType === Node.TEXT_NODE) {
      this.parentElement.style.outline = '0.5em solid red';
      return;
    }
    this.style.outline = '0.5em solid red';
  }
  let elems = await handleRelativeSearch(await findElements(selector), args);
  await evaluate(elems[0], highlightNode);
  descEvent.emit('success', 'Highlighted the ' + description(elems[0], true));
}

/**
 * Performs the given mouse action on the given coordinates. This is useful in performing actions on canvas.
 *
 * @example
 * await mouseAction('press', {x:0,y:0})
 * await mouseAction('move', {x:9,y:9})
 * await mouseAction('release', {x:9,y:9})
 * await mouseAction($("#elementID"),'press', {x:0,y:0})
 * await mouseAction($(".elementClass"),'move', {x:9,y:9})
 * await mouseAction($("testxpath"),'release', {x:9,y:9})
 *
 * @param {string} action - Action to be performed on the canvas
 * @param {Object} coordinates - Coordinates of a point on canvas to perform the action.
 * @param {Object} options
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the click. Default navigation timeout is 30 seconds, to override pass `{ navigationTimeout: 10000 }` in `options` parameter.
 * @param {number} [options.navigationTimeout=30000] - Navigation timeout value in milliseconds for navigation after click.
 * @param {string[]} [options.waitForEvents = ['firstMeaningfulPaint']] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']
 * @param {number} [options.waitForStart=100] - time to wait for navigation to start. Accepts time in milliseconds.
 */
module.exports.mouseAction = mouseAction;

async function mouseAction(selector, action, coordinates, options = {}) {
  validate();
  var actions = ['press', 'move', 'release'];
  if (!actions.includes(selector) && !isSelector(selector) && !isString(selector)) {
    throw Error('Invalid Selector value passed : ' + selector);
  }
  if (!actions.includes(selector)) {
    const elem = await findFirstElement(selector);
    if (elem == null) {
      throw Error('Please provide a valid selector, unable to find element');
    }
    await scrollTo(elem);
    let rect = await domHandler.getBoundingClientRect(elem.get());
    coordinates.x = coordinates.x + parseInt(rect.left);
    coordinates.y = coordinates.y + parseInt(rect.top);
  } else if (actions.includes(selector)) {
    coordinates = action;
    action = selector;
  }
  options = setNavigationOptions(options);
  if (defaultConfig.headful) {
    await overlayHandler.highlightRect({
      x: coordinates.x,
      y: coordinates.y,
      width: 1,
      height: 1,
    });
  }
  options = setClickOptions(options, coordinates.x, coordinates.y);
  await doActionAwaitingNavigation(options, async () => {
    if (action === 'press') {
      options.type = 'mousePressed';
    } else if (action === 'move') {
      options.type = 'mouseMoved';
    } else if (action === 'release') {
      options.type = 'mouseReleased';
    }
    await input.dispatchMouseEvent(options);
  });
  descEvent.emit(
    'success',
    'Performed mouse ' + action + 'action at {' + coordinates.x + ', ' + coordinates.y + '}',
  );
}

/**
 * Scrolls the page to the given element.
 *
 * @example
 * await scrollTo('Get Started')
 * await scrollTo(link('Get Started'))
 *
 * @param {selector|string} selector - A selector of an element to scroll to.
 * @param {Object} options
 * @param {string[]} [options.waitForEvents = ['firstMeaningfulPaint']] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']
 *
 * @returns {Promise}
 */
module.exports.scrollTo = async (selector, options = {}) => {
  validate();
  options = setNavigationOptions(options);
  await doActionAwaitingNavigation(options, async () => {
    await scrollTo(selector);
  });
  if (defaultConfig.headful) {
    await highlightElement(await findFirstElement(selector));
  }
  descEvent.emit('success', 'Scrolled to the ' + description(selector, true));
};

async function scrollTo(selector) {
  validate();

  function scrollToNode() {
    const element = this.nodeType === Node.TEXT_NODE ? this.parentElement : this;
    element.scrollIntoViewIfNeeded();
    return 'result';
  }
  await evaluate(selector, scrollToNode);
}

const scroll = async (e, px, scrollPage, scrollElement, direction) => {
  e = e || 100;
  if (Number.isInteger(e)) {
    const res = await runtimeHandler.runtimeEvaluate(
      `(${scrollPage}).apply(null, ${JSON.stringify([e])})`,
    );
    if (res.result.subtype == 'error') {
      throw new Error(res.result.description);
    }
    return {
      description: `Scrolled ${direction} the page by ${e} pixels`,
    };
  }

  const element = await findFirstElement(e);
  if (defaultConfig.headful) {
    await highlightElement(element);
  }
  //TODO: Allow user to set options for scroll
  const options = setNavigationOptions({});
  await doActionAwaitingNavigation(options, async () => {
    const res = await runtimeHandler.runtimeCallFunctionOn(scrollElement, null, {
      nodeId: element.get(),
      arg: px,
    });
    if (res.result.subtype == 'error') {
      throw new Error(res.result.description);
    }
  });
  descEvent.emit(
    'success',
    'Scrolled ' + direction + description(e, true) + 'by ' + px + ' pixels',
  );
};

/**
 * Scrolls the page/element to the right.
 *
 * @example
 * await scrollRight()
 * await scrollRight(1000)
 * await scrollRight('Element containing text')
 * await scrollRight('Element containing text', 1000)
 *
 * @param {selector|string|number} [e='Window']
 * @param {number} px - Accept px in pixels
 *
 * @returns {Promise}
 */
module.exports.scrollRight = async (e, px = 100) => {
  validate();
  return await scroll(
    e,
    px,
    px => window.scrollBy(px, 0),
    function sr(px) {
      if (this.tagName === 'IFRAME') {
        this.contentWindow.scroll(this.contentWindow.scrollX + px, this.contentWindow.scrollY);
        return true;
      }
      this.scrollLeft += px;
      return true;
    },
    'right',
  );
};

/**
 * Scrolls the page/element to the left.
 *
 * @example
 * await scrollLeft()
 * await scrollLeft(1000)
 * await scrollLeft('Element containing text')
 * await scrollLeft('Element containing text', 1000)
 *
 * @param {selector|string|number} [e='Window']
 * @param {number} px - Accept px in pixels
 *
 * @returns {Promise}
 */
module.exports.scrollLeft = async (e, px = 100) => {
  validate();
  return await scroll(
    e,
    px,
    px => window.scrollBy(px * -1, 0),
    function sl(px) {
      if (this.tagName === 'IFRAME') {
        this.contentWindow.scroll(this.contentWindow.scrollX - px, this.contentWindow.scrollY);
        return true;
      }
      this.scrollLeft -= px;
      return true;
    },
    'left',
  );
};

/**
 * Scrolls up the page/element.
 *
 * @example
 * await scrollUp()
 * await scrollUp(1000)
 * await scrollUp('Element containing text')
 * await scrollUp('Element containing text', 1000)
 *
 * @param {selector|string|number} [e='Window']
 * @param {number} px - Accept px in pixels
 *
 * @returns {Promise}
 */
module.exports.scrollUp = async (e, px = 100) => {
  validate();
  return await scroll(
    e,
    px,
    px => window.scrollBy(0, px * -1),
    function su(px) {
      if (this.tagName === 'IFRAME') {
        this.contentWindow.scroll(this.contentWindow.scrollX, this.contentWindow.scrollY - px);
        return true;
      }
      this.scrollTop -= px;
      return true;
    },
    'up',
  );
};

/**
 * Scrolls down the page/element.
 *
 * @example
 * await scrollDown()
 * await scrollDown(1000)
 * await scrollDown('Element containing text')
 * await scrollDown('Element containing text', 1000)
 *
 * @param {selector|string|number} [e='Window']
 * @param {number} px - Accept px in pixels
 *
 * @returns {Promise}
 */
module.exports.scrollDown = async (e, px = 100) => {
  validate();
  return await scroll(
    e,
    px,
    px => window.scrollBy(0, px),
    function sd(px) {
      if (this.tagName === 'IFRAME') {
        this.contentWindow.scroll(this.contentWindow.scrollX, this.contentWindow.scrollY + px);
        return true;
      }
      this.scrollTop += px;
      return true;
    },
    'down',
  );
};

/**
 * Captures a screenshot of the page. Appends timeStamp to filename if no filepath given.
 *
 * @example
 * await screenshot()
 * await screenshot({path : 'screenshot.png'})
 * await screenshot({fullPage:true})
 * await screenshot(text('Images', toRightOf('gmail')))
 *
 * @param {selector|string} selector
 * @param {Object} options
 *
 * @returns {Promise<Buffer>} - Promise which resolves to buffer with captured screenshot if {encoding:'base64'} given.
 */
module.exports.screenshot = async (selector, options = {}) => {
  validate();
  if (selector && !isSelector(selector) && !isElement(selector)) {
    options = selector;
  }
  options.path = options.path || `Screenshot-${Date.now()}.png`;
  let screenShot = await pageHandler.captureScreenshot(domHandler, selector, options);
  if (options.encoding === 'base64') {
    return screenShot.data;
  }
  fs.writeFileSync(options.path, Buffer.from(screenShot.data, 'base64'));
  const e = options.encoding !== undefined ? options.encoding : options.path;
  descEvent.emit('success', 'Screenshot is created at ' + e);
};

/**
 * Fetches an element with the given selector, scrolls it into view if needed, and then taps on the element. If there's no element matching selector, the method throws an error.
 * @example
 * await tap('Gmail')
 * await tap(link('Gmail'))
 *
 * @param {selector} selector
 * @param {Object} options
 * @param {boolean} [options.waitForNavigation = true] - - Wait for navigation after the click. Default navigation timeout is 15 seconds, to override pass `{ navigationTimeout: 10000 }` in `options` parameter.
 * @param {string[]} [options.waitForEvents = ['firstMeaningfulPaint']] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']
 * @param {relativeSelector[]} args - Proximity selectors
 *
 * @returns {Promise}
 */
module.exports.tap = async (selector, options = {}, ...args) => {
  validate();
  let elems = await handleRelativeSearch(await findElements(selector), args);
  let elemsLength = elems.length;
  let isElemAtPoint;
  for (let elem of elems) {
    isElemAtPoint = false;
    await scrollTo(elem);
    isElemAtPoint = await checkIfElementIsCovered(elem, elems, isElemAtPoint);
    if (isElemAtPoint) {
      const type = (
        await evaluate(elem, function getType() {
          return this.type;
        })
      ).value;
      assertType(
        elem,
        () => type !== 'file',
        'Unsupported operation, use `attach` on file input field',
      );
      if (defaultConfig.headful) {
        await highlightElement(elem);
      }
      const { x, y } = await domHandler.boundingBoxCenter(elem.get());
      options = setNavigationOptions(options);
      await doActionAwaitingNavigation(options, async () => {
        await inputHandler.tap(x, y);
      });
      break;
    }
  }
  if (!isElemAtPoint && elemsLength != elems.length) {
    throw Error('Please provide a more specific selector, too many matches.');
  }
  if (!isElemAtPoint) {
    throw Error(description(selector) + ' is covered by other element');
  }
  descEvent.emit('success', 'Tap has been performed');
};

/**
 * This {@link selector} lets you identify elements on the web page via XPath or CSS selector and proximity selectors.
 * @example
 * await highlight($(`//*[text()='text']`))
 * await $(`//*[text()='text']`).exists()
 * $(`#id`,near('username'),below('login'))
 *
 * @param {string} selector - XPath or CSS selector.
 * @param {...relativeSelector} args - Proximity selectors
 * @returns {ElementWrapperList}
 */
module.exports.$ = (selector, ...args) => {
  validate();
  const get = async () =>
    await handleRelativeSearch(
      await (selector.startsWith('//') || selector.startsWith('(')
        ? $$xpath(selector)
        : $$(selector)),
      args,
    );
  const description = `Custom selector $(${selector})`;

  return createElementWrapper(get, description);
};

/**
 * This {@link selector} lets you identify an image on a web page. This is done via the image's alt text or attribute and value pairs
 * and proximity selectors.
 *
 * @example
 * await click(image('alt'))
 * await image('alt').exists()
 * await image({id:'imageId'}).exists()
 * await image({id:'imageId'},below('text')).exists()
 * await image(below('text')).exists()
 *
 * @param {string} alt - The image's alt text.
 * @param {Object} attrValuePairs - Pairs of attribute and value like {"id":"name","class":"class-name"}
 * @param {...relativeSelector} args - Proximity selectors
 * @returns {ElementWrapperList}
 */
module.exports.image = (attrValuePairs, _options = {}, ...args) => {
  validate();
  const { selector, options } = prepareParameters(attrValuePairs, _options, ...args);
  const get = getElementGetter(
    selector,
    async () =>
      await $$xpath(`//img[contains(@alt, ${xpath(selector.label)})]`, options.selectHiddenElement),
    '//img|//*[contains(@style, "background-image")]',
    options.selectHiddenElement,
  );
  const description = desc(selector, 'alt', 'image');

  return createElementWrapper(get, description);
};

/**
 * This {@link selector} lets you identify a link on a web page with text or attribute and value pairs and proximity selectors.
 *
 * @example
 * await click(link('Get Started'))
 * await link('Get Started').exists()
 * await link({id:'linkId'}).exists()
 * await link({id:'linkId'},below('text')).exists()
 * await link(below('text')).exists()
 *
 * @param {string} text - The link text.
 * @param {Object} attrValuePairs - Pairs of attribute and value like {"id":"name","class":"class-name"}
 * @param {...relativeSelector} args - Proximity selectors
 * @returns {ElementWrapperList}
 */
module.exports.link = (attrValuePairs, _options = {}, ...args) => {
  validate();
  const { selector, options } = prepareParameters(attrValuePairs, _options, ...args);
  const get = getElementGetter(
    selector,
    async () => await match(selector.label, options.selectHiddenElement).elements('a', 0, 0),
    '//a',
    options.selectHiddenElement,
  );
  const description = desc(selector, 'text', 'link');

  return createElementWrapper(get, description);
};

/**
 * This {@link selector} lets you identify a list item (HTML `<li>` element) on a web page with label or attribute and value pairs and proximity selectors.
 *
 * @example
 * await highlight(listItem('Get Started'))
 * await listItem('Get Started').exists()
 * await listItem({id:'listId'}).exists()
 * await listItem({id:'listItemId'},below('text')).exists()
 * await listItem(below('text')).exists()
 *
 * @param {string} label - The label of the list item.
 * @param {Object} attrValuePairs - Pairs of attribute and value like {"id":"name","class":"class-name"}
 * @param {...relativeSelector} args - Proximity selectors
 * @returns {ElementWrapperList}
 */
module.exports.listItem = (attrValuePairs, ...args) => {
  validate();
  const { selector } = prepareParameters(attrValuePairs, ...args);
  const get = getElementGetter(
    selector,
    async () => await match(selector.label).elements('li', 0, 0),
    '//li',
  );
  const description = desc(selector, 'label', 'list Item');

  return createElementWrapper(get, description);
};

/**
 * This {@link selector} lets you identify a button on a web page with label or attribute and value pairs and proximity selectors.
 * Tags button and input with type submit, reset and button are identified using this selector
 *
 * @example
 * await highlight(button('Get Started'))
 * await button('Get Started').exists()
 * await button({id:'buttonId'}).exists()
 * await button({id:'buttonId'},below('text')).exists()
 * await button(below('text')).exists()
 *
 * @param {string} label - The button label.
 * @param {Object} attrValuePairs - Pairs of attribute and value like {"id":"name","class":"class-name"}
 * @param {...relativeSelector} args - Proximity selectors
 * @returns {ElementWrapperList}
 */
module.exports.button = (attrValuePairs, _options = {}, ...args) => {
  validate();
  let get;
  const { selector, options } = prepareParameters(attrValuePairs, _options, ...args);
  if (!selector.attrValuePairs && !selector.label) {
    get = async () =>
      await handleRelativeSearch(
        await $$xpath(
          '//input[@type="submit" or @type="reset" or @type="button" or @type="image"] | //button',
          options.selectHiddenElement,
        ),
        selector.args,
      );
  } else {
    const getByButton = getElementGetter(
      selector,
      async () => match(selector.label, options.selectHiddenElement).elements('button', 0, 0),
      '//button',
      options.selectHiddenElement,
    );

    const getByInput = getElementGetter(
      selector,
      async () =>
        await $$xpath(
          `//input[@type='submit' or @type='reset' or @type='button' or @type='image'][@id=(//label[contains(string(), ${xpath(
            selector.label,
          )})]/@for)] | //label[contains(string(), ${xpath(
            selector.label,
          )})]/input[@type='submit' or @type='reset' or @type='button' or @type='image'] | //input[contains(@value, ${xpath(
            selector.label,
          )})]`,
          options.selectHiddenElement,
        ),
      '//input[@type="submit" or @type="reset" or @type="button" or @type="image"]',
      options.selectHiddenElement,
    );
    get = async () => {
      const input = await getByInput();
      if (input.length) {
        return input;
      }
      return getByButton();
    };
  }

  const description = desc(selector, 'label', 'Button');

  // return generateElementWrapper(get, description);
  return createElementWrapper(get, description);
};

/**
 * This {@link selector} lets you identify a file input field on a web page either with label or with attribute and value pairs and proximity selectors.
 *
 * @example
 * await attach('file.txt', to(fileField('Please select a file:')))
 * await fileField('Please select a file:').exists()
 * await fileField({'id':'file'}).exists()
 * await fileField({id:'fileFieldId'},below('text')).exists()
 * await fileField(below('text')).exists()
 *
 * @param {string} label - The label (human-visible name) of the file input field.
 * @param {Object} attrValuePairs - Pairs of attribute and value like {"id":"name","class":"class-name"}
 * @param {...relativeSelector} args - Proximity selectors
 * @returns {ElementWrapperList}
 */
module.exports.fileField = fileField;

function fileField(attrValuePairs, _options = {}, ...args) {
  validate();
  const { selector, options } = prepareParameters(attrValuePairs, _options, ...args);
  const get = getElementGetter(
    selector,
    async () =>
      await $$xpath(
        `//input[@type='file'][@id=(//label[contains(string(), ${xpath(
          selector.label,
        )})]/@for)] | //label[contains(string(), ${xpath(selector.label)})]/input[@type='file']`,
        options.selectHiddenElement,
      ),
    '//input[@type="file"]',
    options.selectHiddenElement,
  );

  const description = desc(selector, 'label', 'File field');
  return createElementWrapper(get, description, 'fileField');
}

/**
 * This {@tableCell selector} lets you identify a table cell
 * on a web page with row and column and row values as options and locating table using proximity selectors,
 * or table labels.
 *
 * @example
 * tableCell({row:1, col:1}, "Table Caption")
 * tableCell({id:'myColumn'}).text()
 * tableCell({row:1,col:3}).text()
 * highlight(tableCell({row:2, col:3}, "Table Caption"))
 * highlight(text("Table Cell 2",above(tableCell({row:2, col:2}, "Table Caption"))))
 * highlight(text("Table Cell 1",near(tableCell({row:1, col:1}, "Table Caption"))))
 * click(link(above(tableCell({row:4,col:1},"Table Caption"))))
 * highlight(link(above(tableCell({row:4,col:1},above("Code")))))
 *
 *
 * @param {Object} options - Pair of row and column like {row:1, col:3}
 * @param {Object} attrValuePairs - Pairs of attribute and value like {"id":"name","class":"class-name"}
 * @param {string} label - The Table Caption or any Table Header or Table ID.
 * @param {...relativeSelector} args - Proximity selectors
 * @returns {ElementWrapper}
 **/
module.exports.tableCell = tableCell;
function tableCell(options = {}, attrValuePairs, ...args) {
  validate();
  if (
    !options.row &&
    !options.col &&
    Object.keys(options).length > 0 &&
    typeof options == 'object'
  ) {
    attrValuePairs = options;
    options = {};
  }
  const { selector } = prepareParameters(attrValuePairs, ...args);
  let get;
  if (!selector.attrValuePairs && !selector.label) {
    if (!options.row || !options.col) {
      throw new Error('Table Row or Column Value required');
    }
    get = async () =>
      await handleRelativeSearch(
        await $$xpath(
          `//table//tr[${options.row}]/td[${options.col}]`,
          options.selectHiddenElement,
        ),
        selector.args,
      );
  } else {
    const getTableCell = getElementGetter(
      selector,
      async () =>
        await $$xpath(
          `//table[@id=${xpath(selector.label)}]//tr[
            ${options.row}
          ]/td[${options.col}] |
        //table[caption=${xpath(selector.label)}]//tr[${options.row}]/td[${options.col}] |
        //table[thead[contains(string(),${xpath(selector.label)})]]//tr[${options.row}]//td[${
            options.col
          }]`,
        ),
      '//table//td',
    );
    get = async () => {
      return getTableCell();
    };
  }
  let description;
  if (selector.label) {
    description = `tableCell at row:${options.row} and column:${options.col}`;
  } else {
    description = desc(selector, 'Table', 'Table Cell');
  }
  return createElementWrapper(get, description);
}

/**
 * This {@link selector} lets you identify a text field(input (with type text, password, url, search, number, email, tel), textarea and contenteditable fields)
 * on a web page either with label or with attribute and value pairs and proximity selectors.
 *
 * @example
 * await focus(textBox('Username:'))
 * await textBox('Username:').exists()
 * await textBox({id:'textBoxId'},below('text')).exists()
 * await textBox(below('text')).exists()
 *
 * @param {Object} attrValuePairs - Pairs of attribute and value like {"id":"name","class":"class-name"}
 * @param {string} label - The label (human-visible name) of the text field.
 * @param {...relativeSelector} args - Proximity selectors
 * @returns {ElementWrapperList}
 */
module.exports.textBox = textBox;

function textBox(attrValuePairs, ...args) {
  validate();
  const { selector } = prepareParameters(attrValuePairs, ...args);
  let get;
  const inputTypesExps = [
    'input[@type="text" or @type="password" or @type="search" or @type="number" or @type="email" or @type="tel" or @type="url"]',
    'input[not(@type)]',
  ];
  if (!selector.attrValuePairs && !selector.label) {
    get = async () =>
      await handleRelativeSearch(
        await $$xpath(
          `//${inputTypesExps[0]} | //${inputTypesExps[1]} | //textarea | //*[@contenteditable]`,
        ),
        selector.args,
      );
  } else {
    const getInputText = getElementGetter(
      selector,
      async () => {
        const xpathForInputSelection = inputTypesExps
          .map(
            inputTypesExp =>
              `//${inputTypesExp}[@id=(//label[contains(string(), ${xpath(
                selector.label,
              )})]/@for)] | \
                //label[contains(string(), ${xpath(selector.label)})]/${inputTypesExp} | \
                //${inputTypesExp}[following-sibling::text()[position() = 1 and contains(., ${xpath(
                selector.label,
              )})]]`,
          )
          .join('|');
        return await $$xpath(xpathForInputSelection);
      },
      `//${inputTypesExps[0]}|//${inputTypesExps[1]}`,
    );

    const getTextArea = getElementGetter(
      selector,
      async () =>
        await $$xpath(`//textarea[@id=(//label[contains(string(), ${xpath(
          selector.label,
        )})]/@for)] | \
            //label[contains(string(), ${xpath(selector.label)})]/textarea`),
      '//textarea',
    );
    const getContentEditable = getElementGetter(
      selector,
      async () =>
        await $$xpath(`//*[@contenteditable][@id=(//label[contains(string(), ${xpath(
          selector.label,
        )})]/@for)] | \
             //label[contains(string(), ${xpath(selector.label)})]/*[@contenteditable]`),
      '//*[@contenteditable]',
    );
    get = async () => {
      let elems = await getInputText();
      elems = elems.concat(await getTextArea());
      elems = elems.concat(await getContentEditable());
      return elems;
    };
  }
  const description = desc(selector, 'label', 'Text field');
  return createElementWrapper(get, description, 'textBox');
}

/**
 * This {@link selector} lets you identify a dropDown on a web page either with label or with attribute and value pairs and proximity selectors.
 * Any value can be selected using value or text or index of the options.
 *
 * @example
 * await dropDown('Vehicle:').select('Car')
 * await dropDown('Vehicle:').select({index:'0'}) - index starts from 0
 * await dropDown('Vehicle:').value()
 * await dropDown('Vehicle:').exists()
 * await dropDown({id:'dropDownId'},below('text')).exists()
 * await dropDown(below('text')).exists()
 *
 * @param {object} attrValuePairs - Pairs of attribute and value like {"id":"name","class":"class-name"}
 * @param {string} label - The label (human-visible name) of the drop down.
 * @param {...relativeSelector} args - Proximity selectors
 * @returns {ElementWrapperList}
 */
module.exports.dropDown = dropDown;

function dropDown(attrValuePairs, ...args) {
  validate();
  const { selector } = prepareParameters(attrValuePairs, ...args);
  const get = getElementGetter(
    selector,
    async () =>
      await $$xpath(
        `//select[@id=(//label[contains(string(), ${xpath(
          selector.label,
        )})]/@for)] | //label[contains(string(), ${xpath(selector.label)})]/select`,
      ),
    '//select',
  );
  const description = desc(selector, 'label', 'DropDown');
  return createElementWrapper(get, description, 'dropDown');
}

/**
 * This {@link selector} lets you identify a checkbox on a web page either with label or with attribute and value pairs and proximity selectors.
 *
 * @example
 * await checkBox('Vehicle').check()
 * await checkBox('Vehicle').uncheck()
 * await checkBox('Vehicle').isChecked()
 * await checkBox('Vehicle').exists()
 * await checkBox({id:'checkBoxId'},below('text')).exists()
 * await checkBox(below('text')).exists()
 *
 * @param {Object} attrValuePairs - Pairs of attribute and value like {"id":"name","class":"class-name"}
 * @param {string} label - The label (human-visible name) of the check box.
 * @param {...relativeSelector} args Proximity selectors
 * @returns {ElementWrapperList}
 */
module.exports.checkBox = (attrValuePairs, _options, ...args) => {
  validate();
  const { selector, options } = prepareParameters(attrValuePairs, _options, ...args);
  const get = getElementGetter(
    selector,
    async () =>
      await $$xpath(
        `//input[@type='checkbox'][@id=(//label[contains(string(), ${xpath(
          selector.label,
        )})]/@for)] | //label[contains(string(), ${xpath(
          selector.label,
        )})]/input[@type='checkbox'] | //input[@type='checkbox'][following-sibling::text()[position() = 1 and contains(., ${xpath(
          selector.label,
        )})]]`,
        options.selectHiddenElement,
      ),
    '//input[@type="checkbox"]',
    options.selectHiddenElement,
  );

  const description = desc(selector, 'label', 'Checkbox');
  return createElementWrapper(get, description, 'checkBox');
};

/**
 * This {@link selector} lets you identify a radio button on a web page either with label or with attribute and value pairs and proximity selectors.
 *
 * @example
 * await radioButton('Vehicle').select()
 * await radioButton('Vehicle').deselect()
 * await radioButton('Vehicle').isSelected()
 * await radioButton('Vehicle').exists()
 * await radioButton({id:'radioButtonId'},below('text')).exists()
 * await radioButton(below('text')).exists()
 *
 * @param {Object} attrValuePairs - Pairs of attribute and value like {"id":"name","class":"class-name"}
 * @param {string} label - The label (human-visible name) of the radio button.
 * @param {...relativeSelector} args
 * @returns {ElementWrapperList}
 */
module.exports.radioButton = (attrValuePairs, _options, ...args) => {
  validate();
  const { selector, options } = prepareParameters(attrValuePairs, _options, ...args);
  const get = getElementGetter(
    selector,
    async () =>
      await $$xpath(
        `//input[@type='radio'][@id=(//label[contains(string(), ${xpath(
          selector.label,
        )})]/@for)] | //label[contains(string(), ${xpath(
          selector.label,
        )})]/input[@type='radio'] | //input[@type='radio'][following-sibling::text()[position() = 1 and contains(., ${xpath(
          selector.label,
        )})]]`,
        options.selectHiddenElement,
      ),
    '//input[@type="radio"]',
    options.selectHiddenElement,
  );

  const description = desc(selector, 'label', 'Radio button');
  return createElementWrapper(get, description, 'radioButton');
};

/**
 * This {@link selector} lets you identify an element with text. Looks for exact match if not found does contains, accepts proximity selectors.
 *
 * @example
 * await highlight(text('Vehicle'))
 * await text('Vehicle').exists()
 * await text('Vehicle', below('text')).exists()
 *
 * @param {string} text - Text to match.
 * @param {...relativeSelector} args - Proximity selectors
 * @returns {ElementWrapperList}
 */
module.exports.text = text;

function text(text, ...args) {
  validate();
  const get = async () => await handleRelativeSearch(await match(text).elements('*', 0, 0), args);
  const description = `Element with text "${text}"`;

  return createElementWrapper(get, description);
}

/**
 * Search relative HTML elements with this {@link relativeSelector}.
 *
 * @example
 * await click(link("Block", toLeftOf("name"))
 * await write(textBox("first name", toLeftOf("last name"))
 *
 * @param {selector|string} selector - Web element selector.
 * @returns {RelativeSearchElement}.
 */

module.exports.toLeftOf = selector => {
  validate();
  return new RelativeSearchElement(
    async (e, v) => {
      const rect = await domHandler.getBoundingClientRect(e);
      return rect.right <= v;
    },
    rectangle(selector, r => r.left),
    isString(selector) ? `To left of ${selector}` : `To left of ${selector.description}`,
  );
};

/**
 * Search relative HTML elements with this {@link relativeSelector}.
 *
 * @example
 * await click(link("Block", toRightOf("name"))
 * await write(textBox("last name", toRightOf("first name"))
 *
 * @param {selector|string} selector - Web element selector.
 * @returns {RelativeSearchElement}.
 */

module.exports.toRightOf = selector => {
  validate();
  const value = rectangle(selector, r => r.right);
  const desc = isString(selector)
    ? `To right of ${selector}`
    : `To right of ${selector.description}`;
  return new RelativeSearchElement(
    async (e, v) => {
      const rect = await domHandler.getBoundingClientRect(e);
      return rect.left >= v;
    },
    value,
    desc,
  );
};

/**
 * Search relative HTML elements with this {@link relativeSelector}.
 *
 * @example
 * await click(link("Block", above("name"))
 * await write(textBox("name", above("email"))
 *
 * @param {selector|string} selector - Web element selector.
 * @returns {RelativeSearchElement}.
 */

module.exports.above = selector => {
  validate();
  const desc = isString(selector) ? `Above ${selector}` : `Above ${selector.description}`;
  const value = rectangle(selector, r => r.top);
  return new RelativeSearchElement(
    async (e, v) => {
      const rect = await domHandler.getBoundingClientRect(e);
      return rect.bottom <= v;
    },
    value,
    desc,
  );
};

/**
 * Search relative HTML elements with this {@link relativeSelector}.
 *
 * @example
 * await click(link("Block", below("name"))
 * await write(textBox("email", below("name"))
 *
 * @param {selector|string} selector - Web element selector.
 * @returns {RelativeSearchElement}.
 */

module.exports.below = selector => {
  validate();
  const desc = isString(selector) ? `Below ${selector}` : `Below ${selector.description}`;
  const value = rectangle(selector, r => r.bottom);
  return new RelativeSearchElement(
    async (e, v) => {
      const rect = await domHandler.getBoundingClientRect(e);
      return rect.top >= v;
    },
    value,
    desc,
  );
};

/**
 * Search relative HTML elements with this {@link relativeSelector}.
 * An element is considered nearer to a reference element,
 * only if the element offset is lesser than the 30px of the reference element in any direction.
 * Default offset is 30px to override set options = {offset:50}
 *
 * @example
 * await click(link("Block", near("name"))
 * await click(link("Block", near("name", {offset: 50}))
 *
 * @param {selector|string} selector - Web element selector.
 * @returns {RelativeSearchElement}.
 *
 */
module.exports.near = (selector, opts = { offset: 30 }) => {
  validate();
  const desc = isString(selector) ? `Near ${selector}` : `Near ${selector.description}`;
  const value = rectangle(selector, r => r);
  const nearOffset = opts.offset;
  return new RelativeSearchElement(
    async (e, v) => {
      const rect = await domHandler.getBoundingClientRect(e);
      return (
        [rect.bottom, rect.top].some(
          offSet => offSet > v.top - nearOffset && offSet < v.bottom + nearOffset,
        ) &&
        [rect.left, rect.right].some(
          offSet => offSet > v.left - nearOffset && offSet < v.right + nearOffset,
        )
      );
    },
    value,
    desc,
  );
};

/**
 * Accept or dismiss an `alert` matching a text.<br>
 *
 * @example
 * alert('Message', async () => await accept())
 * alert('Message', async () => await dismiss())
 *
 * // Note: Taiko's `alert` listener has to be setup before the alert
 * // displays on the page. For example, if clicking on a button
 * // shows the alert, the Taiko script is
 * alert('Message', async () => await accept())
 * await click('Show Alert')
 *
 * @param {string} message - Identify alert based on this message.
 * @param {function} callback - Action to perform. accept/dismiss.
 */
module.exports.alert = (message, callback) => dialog('alert', message, callback);

/**
 * Accept or dismiss a `prompt` matching a text.<br>
 * Write into the `prompt` with `accept('Something')`.
 *
 * @example
 * prompt('Message', async () => await accept('Something'))
 * prompt('Message', async () => await dismiss())
 *
 * // Note: Taiko's `prompt` listener has to be setup before the prompt
 * // displays on the page. For example, if clicking on a button
 * // shows the prompt, the Taiko script is
 * prompt('Message', async () => await accept('Something'))
 * await click('Show Prompt')
 *
 * @param {string} message - Identify prompt based on this message.
 * @param {function} callback - Action to perform. accept/dismiss.
 */
module.exports.prompt = (message, callback) => dialog('prompt', message, callback);

/**
 * Accept or dismiss a `confirm` popup matching a text.<br>
 *
 * @example
 * confirm('Message', async () => await accept())
 * confirm('Message', async () => await dismiss())
 *
 * // Note: Taiko's `confirm` listener has to be setup before the confirm
 * // popup displays on the page. For example, if clicking on a button
 * // shows the confirm popup, the Taiko script is
 * confirm('Message', async () => await accept())
 * await click('Show Confirm')
 *
 * @param {string} message - Identify confirm based on this message.
 * @param {function} callback - Action to perform. accept/dismiss.
 */
module.exports.confirm = (message, callback) => dialog('confirm', message, callback);

/**
 * Accept or dismiss a `beforeunload` popup matching a text.<br>
 *
 * @example
 * beforeunload('Message', async () => await accept())
 * beforeunload('Message', async () => await dismiss())
 *
 * // Note: Taiko's `beforeunload` listener can be setup anywhere in the
 * // script. The listener will run when the pop displays on the page.
 *
 * @param {string} message - Identify beforeunload based on this message.
 * @param {function} callback - Action to perform. Accept/Dismiss.
 */
module.exports.beforeunload = (message, callback) => dialog('beforeunload', message, callback);

/**
 * Evaluates script on element matching the given selector.
 *
 * @example
 *
 * await evaluate(link("something"), (element) => element.style.backgroundColor)
 *
 * await evaluate((element) => {
 *      element.style.backgroundColor = 'red';
 * })
 *
 * await evaluate(() => {
 *   // Callback function have access to all DOM APIs available in the developer console.
 *   return document.title;
 * } )
 *
 * let options = { args: [ '.main-content', {backgroundColor:'red'}]}
 *
 * await evaluate(link("something"), (element, args) => {
 *      element.style.backgroundColor = args[1].backgroundColor;
 *      element.querySelector(args[0]).innerText = 'Some thing';
 * }, options)
 *
 * @param {selector|string} selector - Web element selector.
 * @param {function} callback - callback method to execute on the element or root HTML element when selector is not provided.<br>
 * NOTE : In callback, we can access only inline css not the one which are define in css files.
 * @param {Object} options - options.
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the click. Default navigation timeout is 15 seconds, to override pass `{ navigationTimeout: 10000 }` in `options` parameter.
 * @param {number} [options.waitForStart=100] - wait for navigation to start. Accepts value in milliseconds
 * @param {number} [options.navigationTimeout=5000] - Navigation timeout value in milliseconds for navigation after click.
 * @param {Array} options.args - Arguments to be passed to the provided callback.
 * @param {string[]} [options.waitForEvents = ['firstMeaningfulPaint']] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']]
 * @returns {Promise<Object>} Object with return value of callback given
 */
module.exports.evaluate = async (selector, callback, options = {}) => {
  validate();
  let result;
  let elem;
  if (isFunction(selector)) {
    options = callback || options;
    callback = selector;
    elem = (await $$xpath('//*'))[0];
  } else {
    elem = await findFirstElement(selector);
  }
  if (defaultConfig.headful) {
    await highlightElement(elem);
  }

  async function evalFunc({ callback, args }) {
    let fn;
    eval(`fn = ${callback}`);
    return await fn(this, args);
  }

  options = setNavigationOptions(options);
  await doActionAwaitingNavigation(options, async () => {
    result = await runtimeHandler.runtimeCallFunctionOn(evalFunc, null, {
      nodeId: elem.get(),
      arg: { callback: callback.toString(), args: options.args },
      returnByValue: true,
    });
  });
  descEvent.emit('success', 'Evaluated given script. Result:' + result.result.value);
  return result.result.value;
};

/**
 * This function is used to improve the readability. It simply returns the parameter passed into it.
 *
 * @example
 * await attach('c:/abc.txt', to('Please select a file:'))
 *
 * @param {string|selector}
 * @return {string|selector}
 */
module.exports.to = value => value;

/**
 * This function is used to improve the readability. It simply returns the parameter passed into it.
 *
 * @example
 * await write("user", into('Username:'))
 *
 * @param {string|selector}
 * @return {string|selector}
 */
module.exports.into = value => value;

/**
 * This function is used to wait for number of milliseconds given or a given element or a given condition.
 *
 * @example
 * waitFor(5000)
 * waitFor("1 item in cart")
 * waitFor("Order Created", 2000)
 * waitFor(async () => !(await $("loading-text").exists()))
 *
 * @param {string} element - Element/condition to wait for
 * @param {number|time} time - Time to wait. default to 10s
 * @return {promise}
 */

const waitFor = async (element, time) => {
  validate();
  let timeout = time || defaultConfig.retryTimeout;
  if (!element || isFinite(element)) {
    time = element;
    return wait(time);
  } else if (isString(element)) {
    let foundElements = await match(element).elements(
      undefined,
      defaultConfig.retryInterval,
      timeout,
    );
    if (!foundElements.length) {
      throw new Error(`Waiting Failed: Element '${element}' not found within ${timeout} ms`);
    }
  } else if (isSelector(element)) {
    let foundElements = await element.elements(undefined, defaultConfig.retryInterval, timeout);
    if (!foundElements.length) {
      throw new Error(`Waiting Failed: Element '${element}' not found within ${timeout} ms`);
    }
  } else {
    await waitUntil(element, defaultConfig.retryInterval, timeout);
  }
};

module.exports.waitFor = waitFor;

/**
 * Action to perform on dialogs
 *
 * @example
 * prompt('Message', async () => await accept('Something'))
 */
module.exports.accept = async (text = '') => {
  await page.handleJavaScriptDialog({
    accept: true,
    promptText: text,
  });
  descEvent.emit('success', 'Accepted dialog');
};

/**
 * Action to perform on dialogs
 *
 * @example
 * prompt('Message', async () => await dismiss())
 */
module.exports.dismiss = async () => {
  await page.handleJavaScriptDialog({
    accept: false,
  });
  descEvent.emit('success', 'Dismissed dialog');
};

/**
 * Starts a REPL when taiko is invoked as a runner with `--load` option.
 * @name repl
 *
 * @example
 * import { repl } from 'taiko/recorder';
 * await repl();
 *
 * @example
 * taiko --load script.js
 */

/**
 * This function is used by taiko to initiate the plugin.
 *
 * @param {string} ID - unique id or name of the plugin
 * @param {Function} init - callback method to set taiko instance for plugin
 */

let plugins = new Map();
const loadPlugin = (id, init) => {
  try {
    if (!plugins.has(id)) {
      if (!eventHandlerProxy) {
        eventHandlerProxy = getEventProxy(eventHandler);
      }
      init(module.exports, eventHandlerProxy, descEvent);
      plugins.set(id, init);
    }
  } catch (error) {
    console.trace(error);
  }
};

const overriddenAPIs = {};
const { getPlugins } = require('./plugins');
getPlugins().forEach(pluginName => {
  let pluginPath = path.resolve(`node_modules/${pluginName}`);
  const globalPath = childProcess
    .spawnSync('npm', ['root', '-g'], { shell: true })
    .stdout.toString()
    .slice(0, -1);
  if (!fs.existsSync(pluginPath)) {
    pluginPath = path.resolve(globalPath, pluginName);
  }
  let plugin = require(pluginPath);
  plugin.ID = pluginName
    .split('-')
    .slice(1)
    .join('-');
  loadPlugin(plugin.ID, plugin.init);
  module.exports[plugin.ID] = plugin;
  for (var api in plugin) {
    const isApiOverridden = Object.prototype.hasOwnProperty.call(overriddenAPIs, api);
    if (!isApiOverridden && Object.prototype.hasOwnProperty.call(module.exports, api)) {
      module.exports[api] = plugin[api];
      overriddenAPIs[api] = pluginName;
    } else if (isApiOverridden) {
      throw new Error(
        `${pluginName} cannot override ${api} API as it has already been overridden by ${overriddenAPIs[api]}`,
      );
    }
  }
});

/**
 * Lets you read the global configurations.
 *
 * @example
 * getConfig("retryInterval");
 *
 * @param {String} optionName - Specifies the name of the configuration option/paramter you want to get (optional). If not specified, returns a shallow copy of the full global configuration.
 * @param {String} ["navigationTimeout"] Navigation timeout value in milliseconds for navigation after performing
 * @param {String} ["observeTime"] Option to modify delay time in milliseconds for observe mode.
 * @param {String} ["retryInterval"] Option to modify delay time in milliseconds to retry the search of element existence.
 * @param {String} ["retryTimeout"] Option to modify timeout in milliseconds while retrying the search of element existence.
 * @param {String} ["observe"] Option to run each command after a delay. Useful to observe what is happening in the browser.
 * @param {String} ["waitForNavigation"] Wait for navigation after performing <a href="#goto">goto</a>, <a href="#click">click</a>,
 * <a href="#doubleclick">doubleClick</a>, <a href="#rightclick">rightClick</a>, <a href="#write">write</a>, <a href="#clear">clear</a>,
 * <a href="#press">press</a> and <a href="#evaluate">evaluate</a>.
 * @param {String} ["ignoreSSLErrors"] Option to ignore SSL errors encountered by the browser.
 * @param {String} ["headful"] Option to open browser in headless/headful mode.
 * @param {String} ["highlightOnAction"] Option to highlight an element on action.
 */
module.exports.getConfig = getConfig;

/**
 * Lets you configure global configurations.
 *
 * @example
 * setConfig( { observeTime: 3000});
 *
 * @param {Object} options
 * @param {number} [options.observeTime = 3000 ] - Option to modify delay time in milliseconds for observe mode.
 * @param {number} [options.navigationTimeout = 30000 ] Navigation timeout value in milliseconds for navigation after performing
 * <a href="#opentab">openTab</a>, <a href="#goto">goto</a>, <a href="#reload">reload</a>, <a href="#goback">goBack</a>,
 * <a href="#goforward">goForward</a>, <a href="#click">click</a>, <a href="#write">write</a>, <a href="#clear">clear</a>,
 * <a href="#press">press</a> and <a href="#evaluate">evaluate</a>.
 * @param {number} [options.retryInterval = 100 ] Option to modify delay time in milliseconds to retry the search of element existence.
 * @param {number} [options.retryTimeout = 10000 ] Option to modify timeout in milliseconds while retrying the search of element existence.
 * @param {boolean} [options.waitForNavigation = true ] Wait for navigation after performing <a href="#goto">goto</a>, <a href="#click">click</a>,
 * <a href="#doubleclick">doubleClick</a>, <a href="#rightclick">rightClick</a>, <a href="#write">write</a>, <a href="#clear">clear</a>,
 * <a href="#press">press</a> and <a href="#evaluate">evaluate</a>.
 */
module.exports.setConfig = setConfig;

const description = (selector, lowerCase = false) => {
  const d = (() => {
    if (isString(selector)) {
      return `Element matching text "${selector}"`;
    } else if (isSelector(selector) || isElement(selector)) {
      return selector.description;
    }
    return '';
  })();
  return lowerCase ? d.charAt(0).toLowerCase() + d.slice(1) : d;
};

const waitForMouseActions = async options => {
  await doActionAwaitingNavigation(options, async () => {
    options.type = 'mouseMoved';
    await input.dispatchMouseEvent(options);
    options.type = 'mousePressed';
    await input.dispatchMouseEvent(options);
    options.type = 'mouseReleased';
    await input.dispatchMouseEvent(options);
  });
};

const _focus = async selector => {
  let elems = [selector];
  if (isSelector(selector) || isElement(selector)) {
    elems = await handleRelativeSearch(await findElements(selector), []);
  }
  let error;
  for (const elem of elems) {
    await scrollTo(elem);
    const result = await evaluate(elem, focusElement);
    if (result.subtype != 'error') {
      return;
    } else if (result.subtype == 'error') {
      error = result.description;
    }
  }
  throw new Error(error);

  function focusElement() {
    if (this.disabled == true) {
      throw new Error('Element is not focusable');
    }
    this.focus();
    return true;
  }
};

const dialog = (dialogType, dialogMessage, callback) => {
  validate();
  return eventHandler.once(
    createJsDialogEventName(dialogMessage, dialogType),
    async ({ message }) => {
      if (dialogMessage === message) {
        await callback();
      }
    },
  );
};

const evaluate = async (selector, func) => {
  let nodeId = (await findFirstElement(selector)).get();
  const { result } = await runtimeHandler.runtimeCallFunctionOn(func, null, { nodeId: nodeId });
  return result;
};

const validate = () => {
  if (!dom || !page) {
    throw new Error('Browser or page not initialized. Call `openBrowser()` before using this API');
  }
};

const rectangle = async (selector, callback) => {
  const elems = await findElements(selector);
  let results = [];
  for (const e of elems) {
    if (e.get) {
      const nodeId = e.get();
      const r = await domHandler.getBoundingClientRect(nodeId);
      results.push({ elem: nodeId, result: callback(r) });
    }
  }
  return results;
};

/**
 * Identifies an element on the page.
 * @callback selector
 *
 * @example
 * link('Sign in')
 * button('Get Started')
 * $('#id')
 * text('Home')
 *
 * @param {string} text - Text to identify the element.
 */

/**
 * Lets you perform relative HTML element searches.
 * @callback relativeSelector
 *
 * @example
 * near('Home')
 * toLeftOf('Sign in')
 * toRightOf('Get Started')
 * above('Sign in')
 * below('Home')
 * link('Sign In',near("Home"),toLeftOf("Sign Out")) - Multiple selectors can be used to perform relative search
 *
 * @param {selector|string} selector - Web element selector.
 * @returns {RelativeSearchElement}.
 */

/**
 * Represents a relative HTML element search. This is returned by {@link relativeSelector}
 *
 * @class RelativeSearchElement
 * @example
 * above('username')
 * near('Get Started')
 *
 */

/**
 * Wrapper object of all found elements. This list mimics the behaviour of {@link ElementWrapper} 
 * by exposing similar methods. The call of these methods gets delegated to first element wrapper.
 *
 * It exposes a method `elements()` which gives the actual list of element wrappers. It can be used to loop over the elements.
 * * `elements()`, `exists()`, `description`, `text()` for all the elements.
 * (NOTE: `exists()` returns boolean from version `0.4.0`)

 * @typedef {Object} ElementWrapperList
 * @property @private {function} get - Deprecated from version `1.0.3`. DOM element getter. Implicitly wait for the element to appears with timeout of 10 seconds.
 * @property @private {function} elements - DOM element wrapper getter. Implicitly wait for the element to appears with timeout of 10 seconds. Returns a list of element wrappers found.
 * @property {function(number, number)} exists - Checks existence for element.  Accepts `(retryInterval, retryTimeout)` parameters (defaults to global settings).
 * @property {string} description - Describes the operation performed.
 * @property {String} text - Gives innerText of the first element found.
 *
 * @example
 * link('google').exists()
 * link('google').exists(1000)
 * link('google').description
 *
 * // To loop over all the elements
 * let elements = await $('a').elements();
 * for (element of elements) {
 *    console.log(await element.text());
 * }
 * 
 * textBox('username').value()
 * (await textBox('username').elements())[0].value() # same as above
 *
 * $('.class').text()
 * (await $('.class').elements())[0].text() # same as above
 *
 */

/**
 * Wrapper object for the element present on the web page. Extra methods are available based on the element type.
 *
 * (NOTE: `exists()` returns boolean from version `0.4.0`)
 * * `value()` for input field, fileField and text field.
 * * `value()`, `select()` for combo box.
 * * `check()`, `uncheck()`, `isChecked()` for checkbox.
 * * `select()`, `deselect()`, `isSelected()` for radio button.
 *
 * @typedef {Object} ElementWrapper
 * @property {function(number, number)} exists - Checks existence for element.  Accepts `(retryInterval, retryTimeout)` parameters (defaults to global settings).
 * @property {string} description - Describes the operation performed.
 * @property {String} text - Gives innerText of the first element found.
 *
 * @example
 *
 * link('google').exists()
 * link('google').exists(1000)
 * link('google').description
 */

const realFuncs = {};
for (const func in module.exports) {
  realFuncs[func] = module.exports[func];
  if (realFuncs[func].constructor.name === 'AsyncFunction') {
    module.exports[func] = async function() {
      if (defaultConfig.observe) {
        await waitFor(defaultConfig.observeTime);
      }
      return await realFuncs[func].apply(this, arguments);
    };
  }
}

module.exports.metadata = {
  'Browser actions': [
    'openBrowser',
    'closeBrowser',
    'client',
    'switchTo',
    'intercept',
    'emulateNetwork',
    'emulateDevice',
    'setViewPort',
    'openTab',
    'closeTab',
    'overridePermissions',
    'clearPermissionOverrides',
    'setCookie',
    'deleteCookies',
    'getCookies',
    'setLocation',
    'clearIntercept',
  ],
  'Page actions': [
    'goto',
    'reload',
    'goBack',
    'goForward',
    'currentURL',
    'title',
    'click',
    'doubleClick',
    'rightClick',
    'dragAndDrop',
    'hover',
    'focus',
    'write',
    'clear',
    'attach',
    'press',
    'highlight',
    'mouseAction',
    'scrollTo',
    'scrollRight',
    'scrollLeft',
    'scrollUp',
    'scrollDown',
    'screenshot',
    'tap',
    'emulateTimezone',
  ],
  Selectors: [
    '$',
    'image',
    'link',
    'listItem',
    'button',
    'fileField',
    'textBox',
    'dropDown',
    'checkBox',
    'radioButton',
    'text',
    'tableCell',
  ],
  'Proximity selectors': ['toLeftOf', 'toRightOf', 'above', 'below', 'near'],
  Events: ['alert', 'prompt', 'confirm', 'beforeunload'],
  Helpers: [
    'evaluate',
    'to',
    'into',
    'accept',
    'dismiss',
    'setConfig',
    'getConfig',
    'waitFor',
    'repl',
  ],
};

/**
 * Removes interceptor for the provided URL or all interceptors if no URL is specified
 *
 * @example
 * # case 1: Remove intercept for a single  URL :
 * await clearIntercept(requestUrl)
 * # case 2: Reset intercept for all URL :
 * await clearIntercept()
 *
 * @param {string} requestUrl request URL to intercept. Optional parameters
 */
module.exports.clearIntercept = requestUrl => {
  if (requestUrl) {
    var success = networkHandler.resetInterceptor(requestUrl);
    if (success) {
      descEvent.emit('success', 'Intercepts reset for url ' + requestUrl);
    } else {
      descEvent.emit('success', 'Intercepts not found for url ' + requestUrl);
    }
  } else {
    networkHandler.resetInterceptors();
    descEvent.emit('success', 'Intercepts reset for all url');
  }
};
