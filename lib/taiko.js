const { doActionAwaitingNavigation } = require('./doActionAwaitingNavigation');
const {
  wait,
  isString,
  isRegex,
  isStrictObject,
  isFunction,
  waitUntil,
  descEvent,
  isSelector,
  isElement,
  isObject,
} = require('./helper');
const inputHandler = require('./handlers/inputHandler');
const domHandler = require('./handlers/domHandler');
const networkHandler = require('./handlers/networkHandler');
const fetchHandler = require('./handlers/fetchHandler');
const pageHandler = require('./handlers/pageHandler');
const targetHandler = require('./handlers/targetHandler');
const runtimeHandler = require('./handlers/runtimeHandler');
const browserHandler = require('./handlers/browserHandler');
const emulationHandler = require('./handlers/emulationHandler');
const { description } = require('./actions/pageActionChecks');
const { match, $$xpath, findElements, findFirstElement } = require('./elementSearch');
const { RelativeSearchElement } = require('./proximityElementSearch');
const { scrollToElement } = require('./actions/scrollTo');
const { setConfig, getConfig, defaultConfig, setNavigationOptions } = require('./config');
const fs = require('fs-extra');
const path = require('path');
const childProcess = require('child_process');
const crypto = require('crypto');
const { eventHandler, eventRegexMap } = require('./eventBus');
const { highlightElement } = require('./elements/elementHelper');
const { launchBrowser } = require('./browserLauncher');
const {
  connect_to_cri,
  closeConnection,
  cleanUpListenersOnClient,
  validate,
  getClient,
} = require('./connection');
const { getPlugins, registerHooks } = require('./plugins');
let eventHandlerProxy;

module.exports.emitter = descEvent;

/**
 * Launches a browser with a tab. The browser will be closed when the parent node.js process is closed.<br>
 * Note : `openBrowser` launches the browser in headless mode by default, but when `openBrowser` is called from {@link repl} it launches the browser in headful mode.
 * @example
 * await openBrowser({headless: false})
 * @example
 * await openBrowser()
 * @example
 * await openBrowser({args:['--window-size=1440,900']})
 * @example
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
 * @param {Array<string>} [options.args=[]] - [Chromium browser launch options](https://peter.sh/experiments/chromium-command-line-switches/).
 * @param {string} [options.host='127.0.0.1'] - Remote host to connect to.
 * @param {string} [options.target] - Determines which target the client should interact.(https://github.com/cyrus-and/chrome-remote-interface#cdpoptions-callback)
 * @param {number} [options.port=0] - Remote debugging port, if not given connects to any open port.
 * @param {boolean} [options.ignoreCertificateErrors=true] - Option to ignore certificate errors.
 * @param {boolean} [options.observe=false] - Option to run each command after a delay. Useful to observe what is happening in the browser.
 * @param {number} [options.observeTime=3000] - Option to modify delay time for observe mode. Accepts value in milliseconds.
 * @param {boolean} [options.dumpio=false] - Option to dump IO from browser.
 *
 * @returns {Promise<void>}
 */
module.exports.openBrowser = async (
  options = {
    headless: true,
  },
) => {
  if (!isStrictObject(options)) {
    throw new TypeError(
      'Invalid option parameter. Refer https://docs.taiko.dev/api/openBrowser for the correct format.',
    );
  }
  defaultConfig.alterPath = options.alterPath;
  if ((options.host && options.port) || options.target) {
    defaultConfig.host = options.host;
    defaultConfig.port = options.port;
    defaultConfig.browserDebugUrl = options.target;
    defaultConfig.connectedToRemoteBrowser = true;
  } else {
    const { currentHost, currentPort, browserDebugUrl } = await launchBrowser(options);
    defaultConfig.host = currentHost;
    defaultConfig.port = currentPort;
    defaultConfig.browserDebugUrl = browserDebugUrl;
  }
  await connect_to_cri();
  var description = defaultConfig.device
    ? `Browser opened with viewport ${defaultConfig.device}`
    : 'Browser opened';
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
 * @returns {Promise<void>}
 */
module.exports.closeBrowser = async () => {
  try {
    validate();
  } catch (error) {
    console.warn(`WARNING: ${error.message}`);
    return;
  }
  await _closeBrowser();
  targetHandler.clearRegister();
  descEvent.emit('success', 'Browser closed');
};

const _closeBrowser = async () => {
  fetchHandler.resetInterceptors();
  await closeConnection(promisesToBeResolvedBeforeCloseBrowser);
};

/**
 * Gives CRI client object (a wrapper around Chrome DevTools Protocol).
 * Refer https://github.com/cyrus-and/chrome-remote-interface
 * Please refer [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/) for
 * the complete API.
 *
 * @returns {Object}
 */
module.exports.client = () => getEventProxy(getClient());
function getEventProxy(target) {
  if (!target) {
    return target;
  }
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
 * Allows switching between tabs and windows using URL or page title or Window name.
 *
 * @example
 * # Switch using URL
 * await switchTo(/taiko.dev/)
 * @example
 * # Switch using Title
 * await switchTo(/Taiko/)
 * @example
 * # Switch using Regex URL
 * await switchTo(/http(s?):\/\/(www?).google.(com|co.in|co.uk)/)
 * @example
 * # Switch using wild cards in the Regex
 * await switchTo(/Go*gle/)
 * @example
 * # Switch to a window identifier
 * await openBrowser();
 * await goto('google.com');
 * openIncognitoWindow({ name: "newyorktimes"});
 * switchTo(/google.com/);
 * switchTo({ name: "newyorktimes"});
 * @example
 * openTab('https://taiko.dev', {name: 'taiko'})
 * openIncognitoWindow({ name: "newyorktimes"});
 * switchTo({name: 'taiko'});
 * @param {string} arg - Regex (Regular expression) the tab's title/URL or `Object` with
 * window name for example `{ name: "windowname"}`
 *
 * @returns {Promise<void>}
 */

module.exports.switchTo = async (arg) => {
  validate();
  let targetId, message;
  if (isObject(arg) && !isRegex(arg) && !isString(arg)) {
    targetId = targetHandler.register(arg.name);
    if (!targetId) {
      throw new Error(`Could not find window/tab with name ${arg.name} to switch.`);
    }
    message = `Switched to window/tab matching ${arg.name}`;
  } else {
    if (!isString(arg) && !isRegex(arg)) {
      throw new TypeError(
        `The "targetUrl" argument must be of type string, regex or identifier. Received type ${typeof arg}`,
      );
    }
    if (isString(arg) && arg.trim() === '') {
      throw new Error(
        'Cannot switch to tab or window as the targetUrl is empty. Please use a valid string, regex or identifier',
      );
    }
    if (isRegex(arg)) {
      arg = new RegExp(arg);
    }
    const targets = await targetHandler.getCriTargets(arg);
    if (targets.matching.length === 0) {
      throw new Error(`No tab(s) matching ${arg} found`);
    }
    targetId = targets.matching[0].targetId;
    message = `Switched to tab matching ${arg}`;
  }
  await targetHandler.switchBrowserContext(targetId);
  await connect_to_cri(targetId);
  descEvent.emit('success', message);
};

/**
 * Add interceptor for the network call. Helps in overriding request or to mock response of a network call.
 *
 * @example
 * # Case 1: Block a specific URL
 * await intercept(url)
 * @example
 * # Case 2: Mock a response
 * await intercept(url, {mockObject})
 * @example
 * # Case 3: Override request
 * await intercept(url, (request) => {request.continue({overrideObject})})
 * @example
 * # Case 4: Redirect always
 * await intercept(url, redirectUrl)
 * @example
 * # Case 5: Mock response based on a request
 * await intercept(url, (request) => { request.respond({mockResponseObject}) })
 * @example
 * # Case 6: Block URL twice
 * await intercept(url, undefined, 2)
 * @example
 * # Case 7: Mock the response only 3 times
 * await intercept(url, {mockObject}, 3)
 *
 * @param {string} requestUrl request URL to intercept
 * @param {function|Object} option action to be done after interception. For more examples refer to https://github.com/getgauge/taiko/issues/98#issuecomment-42024186
 * @param {number} count number of times the request has to be intercepted . Optional parameter
 *
 * @returns {Promise<void>}
 */
module.exports.intercept = async (requestUrl, option, count) => {
  await fetchHandler.addInterceptor({
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
 * # Emulate offline conditions
 * await emulateNetwork("Offline")
 * @example
 * # Emulate slow network conditions
 * await emulateNetwork("Good2G")
 * @example
 * # Emulate precise network conditions
 * await emulateNetwork({ offline: false, downloadThroughput: 6400, uploadThroughput: 2560, latency: 500 })
 * @example
 * # Emulate precise network conditions with any subset of these properties, with default fallbacks of `offline` as true and all numbers as 0
 * await emulateNetwork({ downloadThroughput: 6400, uploadThroughput: 2560, latency: 500 })
 *
 * @param {(string|object)} networkType - 'GPRS','Regular2G','Good2G','Good3G','Regular3G','Regular4G','DSL','WiFi','Offline', {offline: boolean, downloadThroughput: number, uploadThroughput: number, latency: number}
 *
 * @returns {Promise<void>}
 */

module.exports.emulateNetwork = async (networkType) => {
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
 * @param {string} deviceModel - See [device model](https://docs.taiko.dev/devices) for a list of all device models.
 *
 * @returns {Promise<void>}
 */

module.exports.emulateDevice = emulateDevice;
async function emulateDevice(deviceModel) {
  validate();
  await emulationHandler.emulateDevice(deviceModel);
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
 * @returns {Promise<void>}
 */
module.exports.setViewPort = async (options) => {
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

module.exports.emulateTimezone = async (timezoneId) => {
  await emulationHandler.setTimeZone(timezoneId);
  descEvent.emit('success', 'Timezone set to ' + timezoneId);
};

/**
 * Launches a new tab. If url is provided, the new tab is opened with the url loaded.
 * @example
 * await openTab('https://taiko.dev')
 * @example
 * await openTab() # opens a blank tab.
 * @example
 * await openTab('https://taiko.dev', {name: 'taiko'}) # Tab with identifier
 * @param {string} [targetUrl=undefined] - Url of page to open in newly created tab.
 * @param {Object} options
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the reload. Default navigation timeout is 5000 milliseconds, to override pass `{ navigationTimeout: 10000 }` in `options` parameter.
 * @param {string} [options.name] - Tab identifier
 * @param {number} [options.navigationTimeout=5000] - Navigation timeout value in milliseconds for navigation after click. Accepts value in milliseconds.
 * @param {number} [options.waitForStart=100] - time to wait to check for occurrence of page load events. Accepts value in milliseconds.
 * @param {string[]} [options.waitForEvents = []] - Page load events to implicitly wait for. Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint', 'targetNavigated']
 *
 * @returns {Promise<void>}
 */
module.exports.openTab = async (targetUrl, options = {}) => {
  validate();
  options = setNavigationOptions(options);
  if (isObject(targetUrl) && targetUrl.name) {
    options.name = targetUrl.name;
  }

  targetUrl = isString(targetUrl) ? targetUrl : 'about:blank';

  if (
    isString(targetUrl) &&
    targetUrl != 'about:blank' &&
    !/^https?:\/\//i.test(targetUrl) &&
    !/^file/i.test(targetUrl)
  ) {
    targetUrl = 'http://' + targetUrl;
  }

  if (targetHandler.register(options.name)) {
    throw new Error(
      `There is a window or tab already registered with the name '${options.name}' please use another name.`,
    );
  }

  const createNewTarget = async () => {
    await cleanUpListenersOnClient();
    let target = await targetHandler.createTarget(targetUrl);
    await connect_to_cri(target);
    targetHandler.register(options.name, target);
  };

  await doActionAwaitingNavigation(options, createNewTarget);
  descEvent.emit('success', `Opened tab with URL ${targetUrl}`);
};

/**
 * Opens the specified URL in the browser's window. Adds `http` protocol to the URL if not present.
 * @example
 * await openIncognitoWindow('https://google.com', { name: 'windowName' }) - Open a incognito window
 * @param {string} url - URL to navigate page to.
 * @param {Object} options
 * @param {string} [options.name] - Window name (required).
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the goto. Default navigationTimeout is 30 seconds to override pass `{ navigationTimeout: 10000 }` in `options` parameter.
 * @param {string[]} [options.waitForEvents = []] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint', 'targetNavigated']
 * @param {number} [options.navigationTimeout=30000] - Navigation timeout value in milliseconds for navigation after click.
 * @param {Object} options.headers - Map with extra HTTP headers.
 * @param {number} [options.waitForStart = 100] - time to wait for navigation to start. Accepts value in milliseconds.
 *
 * @returns {Promise<void>}
 */
module.exports.openIncognitoWindow = async (url, options = {}) => {
  validate();
  if (typeof url === 'object') {
    options = url;
    url = 'about:blank';
  }

  options = setNavigationOptions(options);
  options.incognito = true;

  if (!options.name) {
    throw new TypeError('Window name needs to be provided');
  }

  if (targetHandler.register(options.name)) {
    throw new Error(
      `There is a already a window/tab with name ${options.name}. Please use another name`,
    );
  }

  if (url !== 'about:blank' && !/^https?:\/\//i.test(url) && !/^file/i.test(url)) {
    url = 'http://' + url;
  }
  const targetId = await targetHandler.createBrowserContext(url, options);
  await cleanUpListenersOnClient();
  await connect_to_cri(targetId);
  targetHandler.register(options.name, targetId);

  if (url !== 'about:blank') {
    await doActionAwaitingNavigation(options, async () => {
      await pageHandler.handleNavigation(url);
    });
  }

  descEvent.emit('success', `Incognito window opened with name ${options.name}`);
};

/**
 * Closes the specified browser window.
 * @example
 * await closeIncognitoWindow('windowName') - Close incognito window
 * @param {string}  windowName - incognito window name
 */
module.exports.closeIncognitoWindow = async (arg) => {
  if (typeof arg !== 'string') {
    throw new TypeError('Window name needs to be provided');
  }

  if (!targetHandler.register(arg)) {
    console.warn(`Could not find Window with name ${arg} to close.`);
    return;
  }

  const hasClosedActiveBrowserContext = await targetHandler.closeBrowserContext(
    targetHandler.register(arg),
  );
  targetHandler.unregister(arg);

  if (hasClosedActiveBrowserContext) {
    const promiseReconnect = new Promise((resolve) => {
      eventHandler.once('reconnected', resolve);
    });
    await promiseReconnect;
  }
  descEvent.emit('success', `Window with name ${arg} closed`);
};

/**
 * Closes the given tab with given URL or closes current tab.
 *
 * @example
 * # Closes the current tab.
 * await closeTab()
 * @example
 * # Closes all the tabs with Title 'Open Source Test Automation Framework | Gauge'.
 * await closeTab('Open Source Test Automation Framework | Gauge')
 * @example
 * # Closes all the tabs with URL 'https://gauge.org'.
 * await closeTab('https://gauge.org')
 * @example
 * # Closes all the tabs with Regex Title 'Go*gle'
 * await closeTab(/Go*gle/)
 * @example
 * # Closes all the tabs with Regex URL '/http(s?):\/\/(www?).google.(com|co.in|co.uk)/'
 * await closeTab(/http(s?):\/\/(www?).google.(com|co.in|co.uk)/)
 *
 * @param {string} [targetUrl=undefined] - URL/Page title of the tab to close.
 *
 * @returns {Promise<void>}
 */
module.exports.closeTab = async (identifier) => {
  const { matching, others } = await targetHandler.getCriTargets(identifier);
  if (!others.length) {
    await _closeBrowser();
    descEvent.emit('success', 'Closing last target and browser.');
    return;
  }
  if (!matching.length) {
    throw new Error(`No tab(s) matching ${identifier} found`);
  }
  let activeTab = { url: await currentURL(), title: await title() };
  let closedTabUrl;
  for (let target of matching) {
    closedTabUrl = target.url;
    await targetHandler.closeTarget(target.targetId);
  }
  if (
    !identifier ||
    targetHandler.isMatchingUrl(activeTab, identifier) ||
    targetHandler.isMatchingRegex(activeTab, identifier) ||
    targetHandler.isMatchingTarget(activeTab, identifier)
  ) {
    await cleanUpListenersOnClient();
    await connect_to_cri(others[0].targetId);
  }
  let message = identifier
    ? `Closed tab(s) matching ${identifier.name ? identifier.name : identifier}`
    : `Closed current tab matching ${closedTabUrl}`;

  if (identifier) {
    targetHandler.unregister(identifier.name);
  }

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
 * @returns {Promise<void>}
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
 * @returns {Promise<void>}
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
 * @example
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
 * @returns {Promise<void>}
 */
module.exports.setCookie = async (name, value, options = {}) => {
  validate();
  if (options.url === undefined && options.domain === undefined) {
    throw new Error('At least URL or domain needs to be specified for setting cookies');
  }
  options.name = name;
  options.value = value;
  let res = await networkHandler.setCookie(options);
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
 * @example
 * await deleteCookies("CSRFToken", {url: "http://the-internet.herokuapp.com"})
 * @example
 * await deleteCookies("CSRFToken", {domain: "herokuapp.com"})
 *
 * @param {string} [cookieName=undefined] - Cookie name.
 * @param {Object} options
 * @param {string} [options.url=undefined] - deletes all the cookies with the given name where domain and path match provided URL. eg: https://google.com
 * @param {string} [options.domain=undefined] - deletes only cookies with the exact domain. eg: google.com
 * @param {string} [options.path=undefined] - deletes only cookies with the exact path. eg: Google/Chrome/Default/Cookies/..
 *
 * @returns {Promise<void>}
 */
module.exports.deleteCookies = async (cookieName, options = {}) => {
  validate();
  if (!cookieName || !cookieName.trim()) {
    await networkHandler.clearBrowserCookies();
    descEvent.emit('success', 'Browser cookies deleted successfully');
  } else {
    if (options.url === undefined && options.domain === undefined) {
      throw new Error('At least URL or domain needs to be specified for deleting cookies');
    }
    options.name = cookieName;
    await networkHandler.deleteCookies(options);
    descEvent.emit('success', `"${cookieName}" cookie deleted successfully`);
  }
};

/**
 * Resize the browser window
 *
 * @example
 * await resizeWindow({width:600, height:800})
 *
 * @returns {Promise<void>}
 */
module.exports.resizeWindow = async (options = {}) => {
  validate();
  if (options.height === undefined || options.width === undefined) {
    throw new Error('Please specify the window height and width');
  }
  const [{ targetId }] = await targetHandler.getFirstAvailablePageTarget();
  await browserHandler.setWindowBounds(targetId, options.height, options.width);
  descEvent.emit(
    'success',
    `Window resized to height ${options.height} and width ${options.width}`,
  );
};
/**
 * Get browser cookies
 *
 * @example
 * await getCookies()
 * @example
 * await getCookies({urls:['https://the-internet.herokuapp.com']})
 *
 * @param {Object} options
 * @param {Array} [options.urls=undefined] - The list of URLs for which applicable cookies will be fetched
 *
 * @returns {Promise<Object[]>} - Array of cookie objects
 */
module.exports.getCookies = async (options = {}) => {
  validate();
  return (await networkHandler.getCookies(options)).cookies;
};

/**
 * Overrides the Geolocation Position
 *
 * @example
 * await setLocation({ latitude: 27.1752868, longitude: 78.040009, accuracy:20 })
 *
 * @param {Object} options Latitude, longitude and accuracy to set the location.
 * @param {number} options.latitude - Mock latitude
 * @param {number} options.longitude - Mock longitude
 * @param {number} options.accuracy - Mock accuracy
 *
 * @returns {Promise<void>}
 */
module.exports.setLocation = async (options) => {
  validate();
  await emulationHandler.setLocation(options);
  descEvent.emit('success', 'Geolocation set');
};

/**
 * Opens the specified URL in the browser's tab. Adds `http` protocol to the URL if not present.
 * @example
 * await goto('https://google.com')
 * @example
 * await goto('google.com')
 * @example
 * await goto('example.com',{ navigationTimeout:10000, headers:{'Authorization':'Basic cG9zdG1hbjpwYXNzd29y2A=='}})
 * @example
 * const response = await goto('gauge.org'); if(response.status.code === 200) {console.log("Success!!")}
 * response: {
 * redirectedResponse: [
 *  {
 *    url: 'http://gauge.org/',
 *    status: { code: 307, text: 'Internal Redirect' }
 *  }
 * ],
 * url: 'https://gauge.org/',
 * status: { code: 200, text: '' }
 * }
 *
 * @param {string} url - URL to navigate page to.
 * @param {Object} options
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the goto. Default navigationTimeout is 30 seconds to override pass `{ navigationTimeout: 10000 }` in `options` parameter.
 * @param {string[]} [options.waitForEvents = []] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint', 'targetNavigated']
 * @param {number} [options.navigationTimeout=30000] - Navigation timeout value in milliseconds for navigation after click.
 * @param {Object} options.headers - Map with extra HTTP headers.
 * @param {number} [options.waitForStart = 100] - time to wait for navigation to start. Accepts value in milliseconds.
 *
 * @returns {Promise<Object>} response
 */
module.exports.goto = async (
  url,
  options = { navigationTimeout: defaultConfig.navigationTimeout },
) => {
  validate();
  if (!/:\/\//i.test(url)) {
    url = 'http://' + url;
  }
  if (options.headers) {
    await fetchHandler.setHTTPHeaders(options.headers, url);
  }
  options = setNavigationOptions(options);
  let response;
  await doActionAwaitingNavigation(options, async () => {
    response = await pageHandler.handleNavigation(url);
  });
  descEvent.emit('success', 'Navigated to URL ' + url);
  return response;
};

/**
 * Reloads the page.
 * @example
 * await reload('https://google.com')
 * @example
 * await reload('https://google.com', { navigationTimeout: 10000 })
 *
 * @param {string} url - DEPRECATED URL to reload
 * @param {Object} options
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the reload. Default navigation timeout is 30 seconds, to override pass `{ navigationTimeout: 10000 }` in `options` parameter.
 * @param {string[]} [options.waitForEvents = []] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint', 'targetNavigated']
 * @param {number} [options.navigationTimeout=30000] - Navigation timeout value in milliseconds for navigation after click.
 * @param {number} [options.waitForStart = 100] - time to wait for navigation to start. Accepts value in milliseconds.
 * @param {boolean} [options.ignoreCache = false] - Ignore Cache on reload - Default to false
 *
 * @returns {Promise<void>}
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
  await doActionAwaitingNavigation(options, async () => {
    const value = options.ignoreCache || false;
    await pageHandler.reload(value);
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
 * @param {string[]} [options.waitForEvents = []] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint', 'targetNavigated']
 * @param {number} [options.navigationTimeout=30000] - Navigation timeout value in milliseconds for navigation after click.
 * @param {number} [options.waitForStart = 100] - time to wait for navigation to start. Accepts value in milliseconds.
 *
 * @returns {Promise<void>}
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
 * @param {string[]} [options.waitForEvents = []] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint', 'targetNavigated']
 * @param {number} [options.navigationTimeout=30000] - Navigation timeout value in milliseconds for navigation after click.
 * @param {number} [options.waitForStart = 100] - time to wait for navigation to start. Accepts value in milliseconds.
 *
 * @returns {Promise<void>}
 */
module.exports.goForward = async (
  options = { navigationTimeout: defaultConfig.navigationTimeout },
) => {
  validate();
  await _go(+1, options);
  descEvent.emit('success', 'Performed clicking on browser forward button');
};

const _go = async (delta, options) => {
  const history = await pageHandler.getNavigationHistory();
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
    await pageHandler.navigateToHistoryEntry(entry.id);
  });
};

/**
 * Returns window's current URL.
 * @example
 * await openBrowser();
 * @example
 * await goto("www.google.com");
 * @example
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
 * @example
 * await goto("www.google.com");
 * @example
 * await title(); # returns "Google"
 *
 * @returns {Promise<string>} - The title of the current page.
 */
const title = async () => {
  validate();
  const result = await runtimeHandler.runtimeEvaluate(
    'document.querySelector("title").textContent',
  );
  return result.result.value;
};
module.exports.title = title;

/**
 * Fetches an element with the given selector, scrolls it into view if needed, and then clicks in the center of the element. If there's no element matching selector, the method throws an error.
 * @example
 * await click('Get Started')
 * @example
 * await click(link('Get Started'))
 * @example
 * await click({x : 170, y : 567})
 * @example
 * await click('Get Started', { navigationTimeout: 60000,  force: true })
 * @example
 * await click('Get Started', { navigationTimeout: 60000 }, below('text'))
 * @example
 * await click('Get Started', { navigationTimeout: 60000, position: 'right' }, below('text'))
 * @param {selector|string|Object} selector - A selector to search for element to click / coordinates of the elemets to click on. If there are multiple elements satisfying the selector, the first will be clicked.
 * @param {Object} options
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the click. Default navigation timeout is 30 seconds, to override pass `{ navigationTimeout: 10000 }` in `options` parameter.
 * @param {number} [options.navigationTimeout=30000] - Navigation timeout value in milliseconds for navigation after click.
 * @param {string} [options.button='left'] - `left`, `right`, or `middle`.
 * @param {number} [options.clickCount=1] - Number of times to click on the element.
 * @param {number} [options.elementsToMatch=10] - Number of elements to loop through to match the element with given selector.
 * @param {string[]} [options.waitForEvents = []] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint', 'targetNavigated']
 * @param {number} [options.waitForStart=100] - time to wait for navigation to start. Accepts time in milliseconds.
 * @param {boolean} [options.force=false] - Set to true to perform action on hidden/disabled elements.
 * @param {string} [options.position='right'] - Available positions right, left, topRight, topLeft, bottomRight, bottomLeft
 * @param {relativeSelector[]} args - Proximity selectors
 *
 * @returns {Promise<void>}
 */
module.exports.click = async (selector, options = {}, ...args) => {
  validate();
  const { click } = require('./actions/click');
  const desc = await click(selector, options, ...args);
  descEvent.emit('success', desc);
};

/**
 * Fetches an element with the given selector, scrolls it into view if needed, and then double clicks the element. If there's no element matching selector, the method throws an error.
 *
 * @example
 * await doubleClick('Get Started')
 * @example
 * await doubleClick(button('Get Started'))
 * @example
 * await doubleClick('Get Started', { waitForNavigation: true,  force: true })
 * @example
 * await doubleClick('Get Started', { waitForNavigation: false }, below('text'))
 *
 * @param {selector|string} selector - A selector to search for element to click. If there are multiple elements satisfying the selector, the first will be double clicked.
 * @param {Object} options
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the click. Default navigation timeout is 30 seconds, to override pass `{ navigationTimeout: 10000 }` in `options` parameter.
 * @param {boolean} [options.force=false] - Set to true to perform action on hidden/disabled elements.
 * @param {relativeSelector[]} args - Proximity selectors
 *
 * @returns {Promise<void>}
 */
module.exports.doubleClick = async (selector, options = {}, ...args) => {
  validate();
  options.clickCount = 2;
  const { click } = require('./actions/click');
  await click(selector, options, ...args);
  descEvent.emit('success', 'Double clicked ' + description(selector, true));
};

/**
 * Fetches an element with the given selector, scrolls it into view if needed, and then right clicks the element. If there's no element matching selector, the method throws an error.
 *
 * @example
 * await rightClick('Get Started')
 * @example
 * await rightClick(text('Get Started'), { force: true})
 *
 * @param {selector|string} selector - A selector to search for element to right click. If there are multiple elements satisfying the selector, the first will be clicked.
 * @param {Object} options - Click options.
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the click. Default navigation timeout is 30 seconds, to override pass `{ navigationTimeout: 10000 }` in `options` parameter.
 * @param {boolean} [options.force=false] - Set to true to perform action on hidden/disabled elements.
 * @param {relativeSelector[]} args - Proximity selectors
 *
 * @returns {Promise<void>}
 */
module.exports.rightClick = async (selector, options = {}, ...args) => {
  validate();
  options.button = 'right';
  const { click } = require('./actions/click');
  await click(selector, options, ...args);
  descEvent.emit('success', 'Right clicked ' + description(selector, true));
};

/**
 * Fetches the source element with given selector and moves it to given destination selector
 * or moves for given distance. If there's no element matching selector, the method throws an error.
 * Drag and drop of HTML5 draggable does not work as expected, refer https://github.com/getgauge/taiko/issues/279
 *
 * @example
 * await dragAndDrop($("work"),into($('work done')))
 * @example
 * await dragAndDrop($("work"),{up:10,down:10,left:10,right:10}, { force: true})
 *
 * @param {selector|string} source - Element to be Dragged
 * @param {selector|string|Object} destinationOrDistance - Element for dropping the dragged element
 *        or an object specifying the drag&drop distance to be moved from position of source element
 * @param {boolean} [options.force=false] - Set to true to perform action on hidden/disabled elements.
 * @returns {Promise<void>}
 */
module.exports.dragAndDrop = async (source, destination, options = {}) => {
  validate();
  const { dragAndDrop } = require('./actions/dragAndDrop');
  const desc = await dragAndDrop(source, destination, options);
  descEvent.emit('success', desc);
};

/**
 * Fetches an element with the given selector, scrolls it into view if needed, and then hovers over the center of the element. If there's no element matching selector, the method throws an error.
 *
 * @example
 * await hover('Get Started')
 * @example
 * await hover(link('Get Started'))
 * @example
 * await hover(link('Get Started'), { waitForEvents: ['firstMeaningfulPaint'],  force: true })
 *
 * @param {selector|string} selector - A selector to search for element to right click. If there are multiple elements satisfying the selector, the first will be hovered.
 * @param {Object} options
 * @param {boolean} [options.force=false] - Set to true to perform action on hidden/disabled elements.
 * @param {string[]} [options.waitForEvents = []] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint', 'targetNavigated']
 */
module.exports.hover = async (selector, options = {}) => {
  validate();
  options = setNavigationOptions(options);
  const { hover } = require('./actions/hover');
  const desc = await hover(selector, options);
  descEvent.emit('success', desc);
};

/**
 * Fetches an element with the given selector and focuses it. If there's no element matching selector, the method throws an error.
 *
 * @example
 * await focus(textBox('Username:'))
 * @example
 * await focus(textBox('Username:'), { waitForEvents: ['firstMeaningfulPaint'], force: true })
 *
 * @param {selector|string} selector - A selector of an element to focus. If there are multiple elements satisfying the selector, the first will be focused.
 * @param {Object} options
 * @param {boolean} [options.force=false] - Set to true to perform action on hidden/disabled elements.
 * @param {string[]} [options.waitForEvents = []] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint', 'targetNavigated']
 */
module.exports.focus = async (selector, options = {}) => {
  validate();
  const { focus } = require('./actions/focus');
  options = setNavigationOptions(options);
  const desc = await focus(selector, options, true);
  descEvent.emit('success', desc);
};

/**
 * Types the given text into the focused or given element.
 * @example
 * await write('admin')
 * @example
 * await write('admin', into(textBox("Username"),{force:true})
 *
 * @param {string} text - Text to type into the element.
 * @param {selector|Element|string} into - A selector of an element to write into.
 * @param {Object} options
 * @param {number} [options.delay = 0] - Time to wait between key presses in milliseconds.
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the click. Default navigation timeout is 15 seconds, to override pass `{ navigationTimeout: 10000 }` in `options` parameter.
 * @param {number} [options.waitForStart=100] - wait for navigation to start. Accepts time in milliseconds.
 * @param {number} [options.navigationTimeout=30000] - Navigation timeout value in milliseconds for navigation after click.
 * @param {boolean} [options.hideText=false] - Prevent given text from being written to log output.
 * @param {boolean} [options.force=false] - Set to true to perform action on hidden/disabled elements.
 * @param {string[]} [options.waitForEvents = []] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint', 'targetNavigated']
 *
 * @returns {Promise<void>}
 */
module.exports.write = async (text, into, options = { delay: 0 }) => {
  validate();
  const { write } = require('./actions/write');
  options = setNavigationOptions(options);
  const desc = await write(text, into, options);
  descEvent.emit('success', desc);
};

/**
 * Clears the value of given selector. If no selector is given clears the current active element.
 *
 * @example
 * await clear()
 * @example
 * await clear(textBox({placeholder:'Email'}))
 * @example
 * await clear(textBox({ placeholder: 'Email' }), { waitForNavigation: true, force: true })
 *
 * @param {selector} selector - A selector to search for element to clear. If there are multiple elements satisfying the selector, the first will be cleared.
 * @param {Object} options - Click options.
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after clear. Default navigation timeout is 30 seconds, to override pass `{ navigationTimeout: 10000 }` in `options` parameter.
 * @param {number} [options.waitForStart=100] - wait for navigation to start. Accepts time in milliseconds.
 * @param {number} [options.navigationTimeout=30000] - Navigation timeout value in milliseconds for navigation after click.
 * @param {boolean} [options.force=false] - Set to true to perform action on hidden/disabled elements.
 * @param {string[]} [options.waitForEvents = []] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint', 'targetNavigated']
 *
 * @returns {Promise<void>}
 */
module.exports.clear = async (selector, options = {}) => {
  validate();
  if (selector && !isSelector(selector) && !isElement(selector)) {
    options = selector;
    selector = undefined;
  }
  options = setNavigationOptions(options);
  const { clear } = require('./actions/clear');
  const desc = await clear(selector, options);
  descEvent.emit('success', desc);
};

/**
 * Attaches a file to a file input element.
 *
 * @example
 * await attach('c:/abc.txt', to('Please select a file:'))
 * @example
 * await attach('c:/abc.txt', 'Please select a file:')
 *  @example
 * await attach('c:/abc.txt', 'Please select a file:',{force:true})
 *
 * @param {string|Array} filepath or filepaths- The path or paths of the file to be attached.
 * @param {selector|string} to - The file input element to which to attach the file.
 * @param {boolean} [options.force=false] - Set to true to perform action on hidden/disabled elements.
 */
module.exports.attach = async (filepath, to, options = {}) => {
  validate();
  const { attach } = require('./actions/attach');
  const desc = await attach(filepath, to, options);
  descEvent.emit('success', desc);
};

/**
 * Presses the given keys.
 *
 * @example
 * await press('Enter')
 * @example
 * await press('a')
 * @example
 * await press(['Shift', 'ArrowLeft', 'ArrowLeft'])
 * @example
 * awaitpress('a', { waitForNavigation: false })
 *
 * @param {string | Array<string> } keys - Name of keys to press. See [USKeyboardLayout](https://github.com/getgauge/taiko/blob/master/lib/data/USKeyboardLayout.js) for a list of all key names.
 * @param {Object} options
 * @param {string} [options.text = ""] - If specified, generates an input event with this text.
 * @param {number} [options.delay=0] - Time to wait between keydown and keyup in milliseconds.
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the click. Default navigation timeout is 30 seconds, to override pass `{ navigationTimeout: 10000 }` in `options` parameter.
 * @param {number} [options.waitForStart=100] - wait for navigation to start.
 * @param {number} [options.navigationTimeout=30000] - Navigation timeout value in milliseconds for navigation after click.
 * @param {string[]} [options.waitForEvents = []] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint', 'targetNavigated']
 *
 * @returns {Promise<void>}
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
      await new Promise((f) => {
        setTimeout(f, options.delay);
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
 * @example
 * await highlight(link('Get Started'))
 *
 * @param {selector|string} selector - A selector of an element to highlight. If there are multiple elements satisfying the selector, the first will be highlighted.
 * @param {relativeSelector[]} args - Proximity selectors
 *
 * @returns {Promise<void>}
 */
module.exports.highlight = highlight;

async function highlight(selector, ...args) {
  validate();
  if (!defaultConfig.highlightOnAction) {
    console.warn('Highlights are disabled. Please enable highlights.');
    return;
  }
  const { highlight } = require('./actions/highlight');
  const desc = await highlight(selector, args);
  descEvent.emit('success', desc);
}

/**
 * Clear all highlights marked using {@link highlight} on the current page.
 *
 * @example
 * await clearHighlights();
 *
 * @returns {Promise<void>}
 */

module.exports.clearHighlights = async () => {
  validate();
  const { clearHighlights } = require('./actions/highlight');
  const desc = await clearHighlights();
  descEvent.emit('success', desc);
};

/**
 * Performs the given mouse action on the given coordinates. This is useful in performing actions on canvas.
 *
 * @example
 * await mouseAction('press', {x:0,y:0})
 * @example
 * await mouseAction('move', {x:9,y:9})
 * @example
 * await mouseAction('release', {x:9,y:9})
 * @example
 * await mouseAction($("#elementID"),'press', {x:0,y:0})
 * @example
 * await mouseAction($(".elementClass"),'move', {x:9,y:9})
 * @example
 * await mouseAction($("testxpath"),'release', {x:9,y:9})
 * @example
 * await mouseAction('release', {x:9, y:9}, {navigationTimeout: 30000})
 *
 * @param {string} action - Action to be performed on the canvas
 * @param {Object} coordinates - Coordinates of a point on canvas to perform the action.
 * @param {Object} options
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the click. Default navigation timeout is 30 seconds, to override pass `{ navigationTimeout: 10000 }` in `options` parameter.
 * @param {number} [options.navigationTimeout=30000] - Navigation timeout value in milliseconds for navigation after click.
 * @param {string[]} [options.waitForEvents = []] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint', 'targetNavigated']
 * @param {number} [options.waitForStart=100] - time to wait for navigation to start. Accepts time in milliseconds.
 * @param {boolean} [options.force=false] - Set to true to perform action on hidden/disabled elements.
 */
module.exports.mouseAction = mouseAction;

async function mouseAction(selector, action, coordinates, options = {}) {
  validate();
  const { mouseAction } = require('./actions/mouseAction');
  const desc = await mouseAction(selector, action, coordinates, options);
  descEvent.emit('success', desc);
}

/**
 * Scrolls the page to the given element.
 *
 * @example
 * await scrollTo('Get Started')
 * @example
 * await scrollTo(link('Get Started'))
 *
 * @param {selector|string} selector - A selector of an element to scroll to.
 * @param {Object} options
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the goto. Default navigationTimeout is 30 seconds to override pass `{ navigationTimeout: 10000 }` in `options` parameter.
 * @param {string[]} [options.waitForEvents = []] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint', 'targetNavigated']
 * @param {number} [options.navigationTimeout=30000] - Navigation timeout value in milliseconds for navigation after click.
 * @param {number} [options.waitForStart = 100] - time to wait for navigation to start. Accepts value in milliseconds.
 * @param {Object} options.alignments
 * @param {string} [options.alignments.block = 'nearest'] - Defines vertical alignment.
 * @param {string} [options.alignments.inline = 'nearest'] - Defines horizontal alignmen.
 * 
 * @returns {Promise<void>}
 */
module.exports.scrollTo = async (selector, options = {}) => {
  validate();
  options = setNavigationOptions(options);
  let alignments = setScrollAlignments(options);
  const element = await findFirstElement(selector);
  await doActionAwaitingNavigation(options, async () => {
    await scrollToElement(element, alignments);
  });
  if (defaultConfig.headful) {
    await highlightElement(element);
  }
  descEvent.emit('success', 'Scrolled to the ' + description(selector, true));
};

/**
 * Scrolls the page/element to the right.
 *
 * @example
 * await scrollRight()
 * @example
 * await scrollRight(1000)
 * @example
 * await scrollRight('Element containing text')
 * @example
 * await scrollRight('Element containing text', 1000)
 *
 * @param {selector|string|number} [e='Window']
 * @param {number} px - Accept px in pixels
 *
 * @returns {Promise<void>}
 */
module.exports.scrollRight = async (e, px = 100) => {
  validate();
  const { scroll } = require('./actions/scrollTo');
  const desc = await scroll(
    e,
    px,
    (px) => window.scrollBy(px, 0),
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
  descEvent.emit('success', desc);
};

/**
 * Scrolls the page/element to the left.
 *
 * @example
 * await scrollLeft()
 * @example
 * await scrollLeft(1000)
 * @example
 * await scrollLeft('Element containing text')
 * @example
 * await scrollLeft('Element containing text', 1000)
 *
 * @param {selector|string|number} [e='Window']
 * @param {number} px - Accept px in pixels
 *
 * @returns {Promise<void>}
 */
module.exports.scrollLeft = async (e, px = 100) => {
  validate();
  const { scroll } = require('./actions/scrollTo');
  const desc = await scroll(
    e,
    px,
    (px) => window.scrollBy(px * -1, 0),
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
  descEvent.emit('success', desc);
};

/**
 * Scrolls up the page/element.
 *
 * @example
 * await scrollUp()
 * @example
 * await scrollUp(1000)
 * @example
 * await scrollUp('Element containing text')
 * @example
 * await scrollUp('Element containing text', 1000)
 *
 * @param {selector|string|number} [e='Window']
 * @param {number} px - Accept px in pixels
 *
 * @returns {Promise<void>}
 */
module.exports.scrollUp = async (e, px = 100) => {
  validate();
  const { scroll } = require('./actions/scrollTo');
  const desc = await scroll(
    e,
    px,
    (px) => window.scrollBy(0, px * -1),
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
  descEvent.emit('success', desc);
};

/**
 * Scrolls down the page/element.
 *
 * @example
 * await scrollDown()
 * @example
 * await scrollDown(1000)
 * @example
 * await scrollDown('Element containing text')
 * @example
 * await scrollDown('Element containing text', 1000)
 *
 * @param {selector|string|number} [e='Window']
 * @param {number} px - Accept px in pixels
 *
 * @returns {Promise<void>}
 */
module.exports.scrollDown = async (e, px = 100) => {
  validate();
  const { scroll } = require('./actions/scrollTo');
  const desc = await scroll(
    e,
    px,
    (px) => window.scrollBy(0, px),
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
  descEvent.emit('Success', desc);
};

/**
 * Captures a screenshot of the page. Appends timeStamp to filename if no filepath given.
 *
 * @example
 * await screenshot()
 * @example
 * await screenshot({path : 'screenshot.png'})
 * @example
 * await screenshot({fullPage:true})
 * @example
 * await screenshot(text('Images', toRightOf('gmail')))
 *
 * @param {selector|string} selector
 * @param {Object} options
 * @param {boolean} [options.fullpage=false] - toggles full page screenshot
 * @param {string} [options.path='Screenshot-${Date.now()}.png'] - path of the output file
 * @param {string} [options.encoding='base64'] - encoding for the image
 *
 * @returns {Promise<Buffer>} - Promise which resolves to buffer with captured screenshot if `{encoding:'base64'}` given, otherwise it resolves to undefined.
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
 * @example
 * await tap(link('Gmail'))
 * @example
 * tap(link('Gmail'), { waitForNavigation: true, waitForEvents: ['firstMeaningfulPaint'],  force: true });
 * @example
 * tap(link('Gmail'), {}, below('title'))
 *
 * @param {selector} selector
 * @param {Object} options
 * @param {boolean} [options.waitForNavigation = true] - - Wait for navigation after the click. Default navigation timeout is 15 seconds, to override pass `{ navigationTimeout: 10000 }` in `options` parameter.
 * @param {boolean} [options.force=false] - Set to true to perform action on hidden/disabled elements.
 * @param {string[]} [options.waitForEvents = []] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint', 'targetNavigated']
 * @param {relativeSelector[]} args - Proximity selectors
 *
 * @returns {Promise<void>}
 */
module.exports.tap = async (selector, options = {}, ...args) => {
  validate();
  options.tap = true;
  const { click } = require('./actions/click');
  await click(selector, options, ...args);
  descEvent.emit('success', 'Tap has been performed');
};

/**
 * This {@link selector} lets you identify elements on the web page via XPath or CSS selector and proximity selectors.
 * @example
 * await highlight($(`//*[text()='text']`))
 * @example
 * await $(`//*[text()='text']`).exists()
 * @example
 * $(`#id`,near('username'),below('login'))
 * @example
 * $(() => {return document.querySelector('#foo');})
 * @example
 * $((selector) => document.querySelector(selector), { args: '#foo' })
 * @example
 * $((selector) => document.getElementById(selector), { args: 'foo' })
 *
 * @param {string} selector - XPath or CSS selector or Function.
 * @param {Object} _options
 * @param {...relativeSelector} args - Proximity selectors
 * @returns {DollarWrapper}
 */
module.exports.$ = (attrValuePairs, _options = {}, ...args) => {
  validate();
  const DollarWrapper = require('./elementWrapper/dollarWrapper');
  return new DollarWrapper(attrValuePairs, _options, ...args);
};

/**
 * This {@link selector} lets you identify an image on a web page. This is done via the image's alt text or attribute and value pairs
 * and proximity selectors.
 *
 * @example
 * await click(image('alt'))
 * @example
 * await image('alt').exists()
 * @example
 * await image({id:'imageId'}).exists()
 * @example
 * await image({id:'imageId'},below('text')).exists()
 * @example
 * await image(below('text')).exists()
 *
 * @param {string} alt - The image's alt text.
 * @param {Object} _options
 * @param {Object} attrValuePairs - Pairs of attribute and value like {"id":"name","class":"class-name"}
 * @param {...relativeSelector} args - Proximity selectors
 * @returns {ImageWrapper}
 */
module.exports.image = (attrValuePairs, _options = {}, ...args) => {
  validate();
  const ImageWrapper = require('./elementWrapper/imageWrapper');
  return new ImageWrapper(attrValuePairs, _options, ...args);
};

/**
 * This {@link selector} lets you identify a link on a web page with text or attribute and value pairs and proximity selectors.
 *
 * @example
 * await click(link('Get Started'))
 * @example
 * await link('Get Started').exists()
 * @example
 * await link({id:'linkId'}).exists()
 * @example
 * await link({id:'linkId'},below('text')).exists()
 * @example
 * await link(below('text')).exists()
 *
 * @param {string} text - The link text.
 * @param {Object} _options
 * @param {Object} attrValuePairs - Pairs of attribute and value like {"id":"name","class":"class-name"}
 * @param {...relativeSelector} args - Proximity selectors
 * @returns {LinkWrapper}
 */
module.exports.link = (attrValuePairs, _options = {}, ...args) => {
  validate();
  const LinkWrapper = require('./elementWrapper/linkWrapper');
  return new LinkWrapper(attrValuePairs, _options, ...args);
};

/**
 * This {@link selector} lets you identify a list item (HTML `<li>` element) on a web page with label or attribute and value pairs and proximity selectors.
 *
 * @example
 * await highlight(listItem('Get Started'))
 * @example
 * await listItem('Get Started').exists()
 * @example
 * await listItem({id:'listId'}).exists()
 * @example
 * await listItem({id:'listItemId'},below('text')).exists()
 * @example
 * await listItem(below('text')).exists()
 *
 * @param {string} label - The label of the list item.
 * @param {Object} _options
 * @param {Object} attrValuePairs - Pairs of attribute and value like {"id":"name","class":"class-name"}
 * @param {...relativeSelector} args - Proximity selectors
 * @returns {ListItemWrapper}
 */
module.exports.listItem = (attrValuePairs, _options = {}, ...args) => {
  validate();
  const ListItemWrapper = require('./elementWrapper/listItemWrapper');
  return new ListItemWrapper(attrValuePairs, _options, ...args);
};

/**
 * This {@link selector} lets you identify a button on a web page with label or attribute and value pairs and proximity selectors.
 * Tags button and input with type submit, reset and button are identified using this selector
 *
 * @example
 * await highlight(button('Get Started'))
 * @example
 * await button('Get Started').exists()
 * @example
 * await button({id:'buttonId'}).exists()
 * @example
 * await button({id:'buttonId'},below('text')).exists()
 * @example
 * await button(below('text')).exists()
 *
 * @param {string} label - The button label.
 * @param {Object} _options
 * @param {Object} attrValuePairs - Pairs of attribute and value like {"id":"name","class":"class-name"}
 * @param {...relativeSelector} args - Proximity selectors
 * @returns {ButtonWrapper}
 */
module.exports.button = (attrValuePairs, _options = {}, ...args) => {
  validate();
  const ButtonWrapper = require('./elementWrapper/buttonWrapper');
  return new ButtonWrapper(attrValuePairs, _options, ...args);
};

/**
 * This {@link selector} lets you identify a file input field on a web page either with label or with attribute and value pairs and proximity selectors.
 *
 * @example
 * await attach('file.txt', to(fileField('Please select a file:')))
 * @example
 * await fileField('Please select a file:').exists()
 * @example
 * await fileField({'id':'file'}).exists()
 * @example
 * await fileField({id:'fileFieldId'},below('text')).exists()
 * @example
 * await fileField(below('text')).exists()
 *
 * @param {string} label - The label (human-visible name) of the file input field.
 * @param {Object} _options
 * @param {Object} attrValuePairs - Pairs of attribute and value like {"id":"name","class":"class-name"}
 * @param {...relativeSelector} args - Proximity selectors
 * @returns {FileFieldWrapper}
 */
module.exports.fileField = fileField;

function fileField(attrValuePairs, _options = {}, ...args) {
  validate();
  const FileFieldWrapper = require('./elementWrapper/fileFieldWrapper');
  return new FileFieldWrapper(attrValuePairs, _options, ...args);
}

/**
 * This {@link selector} lets you identify time based input types [ date, datetime-local, month, time, week ] on a web page either with label
 * or with attribute and value pairs and proximity selectors.
 *
 * @example
 * await write('31082020', into(timeField('Birthday:')))
 * @example
 * await timeField('Birthday:').select(new Date('2020-09-20'))
 * @example
 * await timeField('Birthday:').exists()
 * @example
 * await timeField({'id':'Birthday'}).exists()
 * @example
 * await timeField({id:'Birthday'},below('text')).exists()
 * @example
 * await timeField(below('text')).exists()
 *
 * @param {string} label - The label (human-visible name) of the file input field.
 * @param {Object} _options
 * @param {Object} attrValuePairs - Pairs of attribute and value like {"id":"name","class":"class-name"}
 * @param {...relativeSelector} args - Proximity selectors
 * @returns {TimeFieldWrapper}
 */
module.exports.timeField = timeField;

function timeField(attrValuePairs, _options = {}, ...args) {
  validate();
  const TimeFieldWrapper = require('./elementWrapper/timeFieldWrapper');
  return new TimeFieldWrapper(attrValuePairs, _options, ...args);
}

/**
 * This {@link selector} let you specify a value which must be no less than a given value, and no more than another given value,attribute and value pairs and proximity selectors.
 * This is typically represented using a slider or dial control rather than a text entry box like the number input type.
 *
 * @example
 * await range({ id: 'range-1' }).select(10.81);
 * @example
 * await range({ id: 'range-1' }).select('10');
 * @example
 * await range({ id: 'range-1' }, below('head')).select(10);
 *
 * @param {Object} _options
 * @param {Object} attrValuePairs - Pairs of attribute and value like {"id":"name","class":"class-name"}
 * @param {...relativeSelector} args - Proximity selectors
 * @returns {RangeWrapper}
 */
module.exports.range = range;

function range(attrValuePairs, _options = {}, ...args) {
  validate();
  const RangeWrapper = require('./elementWrapper/rangeWrapper');
  return new RangeWrapper(attrValuePairs, _options, ...args);
}

/**
 * This {@link selector} lets you set color values on color picker on web page with attribute and value pairs and proximity selectors.
 *
 * @example
 * await color({'id':'colorId'}).exists()
 * @example
 * await color({id:'colorId'},below('text')).exists()
 * @example
 * await color(below('text')).exists()
 * @example
 * await color(below('text')).select('#f236cf')
 * @example
 * await color({'id':'colorId'}).select('#f236cf')
 *
 * @param {Object} attrValuePairs - Pairs of attribute and value like {"id":"name","class":"class-name"}
 * @param {Object} _options
 * @param {...relativeSelector} args - Proximity selectors
 * @returns {ColorWrapper}
 */

module.exports.color = color;

function color(attrValuePairs, _options = {}, ...args) {
  validate();
  if (attrValuePairs === undefined || attrValuePairs === '') {
    throw new Error('At least one attribute is required!');
  }

  const ColorWrapper = require('./elementWrapper/colorWrapper');
  return new ColorWrapper(attrValuePairs, _options, ...args);
}

/**
 * This {@link selector} lets you identify a table cell
 * on a web page with row and column and row values as options and locating table using proximity selectors,
 * or table labels.
 *
 * @example
 * tableCell({row:1, col:1}, "Table Caption")
 * @example
 * tableCell({id:'myColumn'}).text()
 * @example
 * tableCell({row:1,col:3}).text()
 * @example
 * highlight(tableCell({row:2, col:3}, "Table Caption"))
 * @example
 * highlight(text("Table Cell 2",above(tableCell({row:2, col:2}, "Table Caption"))))
 * @example
 * highlight(text("Table Cell 1",near(tableCell({row:1, col:1}, "Table Caption"))))
 * @example
 * click(link(above(tableCell({row:4,col:1},"Table Caption"))))
 * @example
 * highlight(link(above(tableCell({row:4,col:1},above("Code")))))
 *
 * @param {Object} options - Pair of row and column like {row:1, col:3}
 * @param {Object} attrValuePairs - Pairs of attribute and value like {"id":"name","class":"class-name"}
 * @param {string} label - The Table Caption or any Table Header or Table ID.
 * @param {...relativeSelector} args - Proximity selectors
 * @returns {TableCellWrapper}
 **/
module.exports.tableCell = tableCell;
function tableCell(_options = {}, attrValuePairs, ...args) {
  validate();
  if (_options.row === 0) {
    throw new Error('Table Row starts with "1", received "0"');
  }
  if (_options.col === 0) {
    throw new Error('Table Column starts with "1", received "0"');
  }

  if (
    !_options.row &&
    !_options.col &&
    Object.keys(_options).length > 0 &&
    typeof _options == 'object'
  ) {
    attrValuePairs = _options;
    _options = {};
  }
  let query = `tableCell at row:${_options.row} and column:${_options.col}`;
  if (isString(attrValuePairs)) {
    query = query + ' and label';
  }
  const TableCellWrapper = require('./elementWrapper/tableCellWrapper');
  return new TableCellWrapper(query, attrValuePairs, _options, ...args);
}

/**
 * This {@link selector} lets you identify a text field(input (with type text, password, url, search, number, email, tel), textarea and contenteditable fields)
 * on a web page either with label or with attribute and value pairs and proximity selectors.
 *
 * @example
 * await focus(textBox('Username:'))
 * @example
 * await textBox('Username:').exists()
 * @example
 * await textBox({id:'textBoxId'},below('text')).exists()
 * @example
 * await textBox(below('text')).exists()
 *
 * @param {Object} labelOrAttrValuePairs - Either the label (human-visible name) of the text field or pairs of attribute and value like {"id":"name","class":"class-name"}
 * @param {Object} _options
 * @param {...relativeSelector} args - Proximity selectors
 * @returns {TextBoxWrapper}
 */
module.exports.textBox = textBox;

function textBox(labelOrAttrValuePairs, _options, ...args) {
  validate();
  const TextBoxWrapper = require('./elementWrapper/textBoxWrapper');
  return new TextBoxWrapper(labelOrAttrValuePairs, _options, ...args);
}

/**
 * This {@link selector} lets you identify a dropDown on a web page either with label or with attribute and value pairs and proximity selectors.
 * Any value can be selected using value or text or index of the options.
 *
 * @example
 * await dropDown('Vehicle:').select('Car')
 * @example
 * await dropDown('Vehicle:').select({index:'0'}) - index starts from 0
 * @example
 * await dropDown('Vehicle:').value()
 * @example
 * await dropDown('Vehicle:').options() - Returns all available options from the drop down
 * @example
 * await dropDown('Vehicle:').exists()
 * @example
 * await dropDown({id:'dropDownId'},below('text')).exists()
 * @example
 * await dropDown(below('text')).exists()
 * @example
 * await dropDown('Vehicle:').select(/Car/) // Only matches drop down text and not the value
 *
 * @param {Object} labelOrAttrValuePairs - Either the label (human-visible name) of the text field or pairs of attribute and value like {"id":"name","class":"class-name"}
 * @param {Object} _options
 * @param {...relativeSelector} args - Proximity selectors
 * @returns {DropDownWrapper}
 */
module.exports.dropDown = dropDown;

function dropDown(labelOrAttrValuePairs, _options, ...args) {
  validate();
  const DropDownWrapper = require('./elementWrapper/dropDownWrapper');
  return new DropDownWrapper(labelOrAttrValuePairs, _options, ...args);
}

/**
 * This {@link selector} lets you identify a checkbox on a web page either with label or with attribute and value pairs and proximity selectors.
 *
 * @example
 * await checkBox('Vehicle').uncheck()
 * @example
 * await checkBox('Vehicle').exists()
 * @example
 * await checkBox({id:'checkBoxId'},below('text')).exists()
 * @example
 * await checkBox(below('text')).exists()
 *
 * @param {Object} labelOrAttrValuePairs - Either the label (human-visible name) of the text field or pairs of attribute and value like {"id":"name","class":"class-name"}
 * @param {Object} _options
 * @param {...relativeSelector} args Proximity selectors
 * @returns {CheckBoxWrapper}
 */
module.exports.checkBox = (labelOrAttrValuePairs, _options, ...args) => {
  validate();
  const CheckBoxWrapper = require('./elementWrapper/checkBoxWrapper');
  return new CheckBoxWrapper(labelOrAttrValuePairs, _options, ...args);
};

/**
 * This {@link selector} lets you identify a radio button on a web page either with label or with attribute and value pairs and proximity selectors.
 *
 * @example
 * await radioButton('Vehicle').exists()
 * @example
 * await radioButton({id:'radioButtonId'},below('text')).exists()
 * @example
 * await radioButton(below('text')).exists()
 *
 * @param {Object} labelOrAttrValuePairs - Either the label (human-visible name) of the text field or pairs of attribute and value like {"id":"name","class":"class-name"}
 * @param {Object} _options
 * @param {...relativeSelector} args
 * @returns {RadioButtonWrapper}
 */
module.exports.radioButton = (labelOrAttrValuePairs, _options, ...args) => {
  validate();
  const RadioButtonWrapper = require('./elementWrapper/radioButtonWrapper');
  return new RadioButtonWrapper(labelOrAttrValuePairs, _options, ...args);
};

/**
 * This {@link selector} lets you identify an element with text. Looks for exact match if not found does contains, accepts proximity selectors.
 *
 * @example
 * await highlight(text('Vehicle'))
 * @example
 * await text('Vehicle').exists()
 * @example
 * await text('Vehicle', below('text')).exists()
 * @example
 * await text('Vehicle', { exactMatch: true }, below('text')).exists()
 * @example
 * await text('/Vehicle/').exists() //regex as string
 * @example
 * await text(/Vehicle/).exists()
 * @example
 * await text(new RegExp('Vehicle')).exists()
 *
 * @param {string|RegExp} text - Text/regex to match.
 * @param {Object} _options
 * @param {boolean} [_options.exactMatch=false] - Option to look for exact match.
 * @param {...relativeSelector} args - Proximity selectors
 * @returns {TextWrapper}
 */
module.exports.text = text;

function text(text, _options = {}, ...args) {
  validate();
  const TextWrapper = require('./elementWrapper/textWrapper');
  return new TextWrapper(text, _options, ...args);
}

/**
 * Search relative HTML elements with this {@link relativeSelector}.
 *
 * @example
 * await click(link("Block", toLeftOf("name"))
 * @example
 * await write(textBox("first name", toLeftOf("last name"))
 *
 * @param {selector|string} selector - Web element selector.
 * @returns {RelativeSearchElement}.
 */

module.exports.toLeftOf = (selector) => {
  validate();
  return new RelativeSearchElement(
    async (e, v) => {
      const rect = await domHandler.getBoundingClientRect(e);
      return rect.right <= v;
    },
    async () => await rectangle(selector, (r) => r.left),
    isString(selector) ? `to left of ${selector}` : `to left of ${selector.description}`,
  );
};

/**
 * Search relative HTML elements with this {@link relativeSelector}.
 *
 * @example
 * await click(link("Block", toRightOf("name"))
 * @example
 * await write(textBox("last name", toRightOf("first name"))
 *
 * @param {selector|string} selector - Web element selector.
 * @returns {RelativeSearchElement}.
 */

module.exports.toRightOf = (selector) => {
  validate();
  const desc = isString(selector)
    ? `to right of ${selector}`
    : `to right of ${selector.description}`;
  return new RelativeSearchElement(
    async (e, v) => {
      const rect = await domHandler.getBoundingClientRect(e);
      return rect.left >= v;
    },
    async () => await rectangle(selector, (r) => r.right),
    desc,
  );
};

/**
 * Search relative HTML elements with this {@link relativeSelector}.
 *
 * @example
 * await click(link("Block", above("name"))
 * @example
 * await write(textBox("name", above("email"))
 *
 * @param {selector|string} selector - Web element selector.
 * @returns {RelativeSearchElement}.
 */

module.exports.above = (selector) => {
  validate();
  const desc = isString(selector) ? `above ${selector}` : `above ${selector.description}`;
  return new RelativeSearchElement(
    async (e, v) => {
      const rect = await domHandler.getBoundingClientRect(e);
      return rect.bottom <= v;
    },
    async () => await rectangle(selector, (r) => r.top),
    desc,
  );
};

/**
 * Search relative HTML elements with this {@link relativeSelector}.
 *
 * @example
 * await click(link("Block", below("name"))
 * @example
 * await write(textBox("email", below("name"))
 *
 * @param {selector|string} selector - Web element selector.
 * @returns {RelativeSearchElement}.
 */

module.exports.below = (selector) => {
  validate();
  const desc = isString(selector) ? `below ${selector}` : `below ${selector.description}`;
  return new RelativeSearchElement(
    async (e, v) => {
      const rect = await domHandler.getBoundingClientRect(e);
      return rect.top >= v;
    },
    async () => await rectangle(selector, (r) => r.bottom),
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
 * @example
 * await click(link("Block", near("name", {offset: 50}))
 *
 * @param {selector|string} selector - Web element selector.
 * @returns {RelativeSearchElement}.
 *
 */
module.exports.near = (selector, opts = { offset: 30 }) => {
  validate();
  const desc = isString(selector) ? `near ${selector}` : `near ${selector.description}`;
  const nearOffset = opts.offset;
  return new RelativeSearchElement(
    async (e, v) => {
      const rect = await domHandler.getBoundingClientRect(e);
      return (
        [rect.bottom, rect.top].some(
          (offSet) => offSet > v.top - nearOffset && offSet < v.bottom + nearOffset,
        ) &&
        [rect.left, rect.right].some(
          (offSet) => offSet > v.left - nearOffset && offSet < v.right + nearOffset,
        )
      );
    },
    async () => await rectangle(selector, (r) => r),
    desc,
  );
};

/**
 * Search relative HTML elements with this {@link relativeSelector}.
 * An element is considered within a reference element,
 * only if the element's bounding box is in range of reference element.
 *
 * @example
 * await click(link("Block", within("name"))
 *
 * @param {selector|string} selector - Web element selector.
 * @returns {RelativeSearchElement}.
 *
 */
module.exports.within = (selector) => {
  validate();
  const desc = isString(selector) ? `within ${selector}` : `within ${selector.description}`;
  return new RelativeSearchElement(
    async (e, v) => {
      const rect = await domHandler.getBoundingClientRect(e);
      return (
        rect.left >= v.left &&
        rect.left <= v.right &&
        rect.right <= v.right &&
        rect.right >= v.left &&
        rect.top <= v.bottom &&
        rect.top >= v.top &&
        rect.bottom >= v.top &&
        rect.bottom <= v.bottom
      );
    },
    async () => await rectangle(selector, (r) => r),
    desc,
  );
};

/**
 * Accept or dismiss a `alert` matching a text.<br>
 *
 * @example
 * alert('Are you sure', async () => await accept())
 *
 * alert('Are you sure', async () => await dismiss())
 *
 * // If alert message is unknown, A RegExp which matches
 * // the text can be used
 *
 * alert(/^Close.*$/, async () => await accept())
 *
 * // If alert message is completely unknown, A callback can
 * // be passed directly, it will get the message, url etc
 * // as arguments which can be used to make a decision.
 *
 * alert(async ({message}) => {
 *   if(message === "Are you sure?") {
 *     await accept();
 *    }
 * })
 *
 *
 * // Note: Taiko's `alert` listener has to be setup before the alert
 * // popup displays on the page. For example, if clicking on a button
 * // shows the confirm popup, the Taiko script is
 *
 * alert('Message', async () => await accept())
 * await click('Show Alert')
 *
 * @param {string | RegExp | function } messageOrCallback - Identify prompt based on this message, regex or callback.
 * @param {function} callback - Action to perform. accept/dismiss.
 */
module.exports.alert = (message, callback) => dialog('alert', message, callback);

/**
 * Accept or dismiss a `prompt` matching a text.<br>
 * Write into the `prompt` with `accept('Something')`.
 *
 * @example
 * prompt('Message', async () => await accept('something'))
 *
 * prompt('Message', async () => await dismiss())
 *
 * // If prompt message is unknown, A RegExp which matches
 * // the text can be used
 *
 * prompt(/^Please.+$name/, async () => await accept("NAME"))
 *
 * // If prompt message is completely unknown, A callback can
 * // be passed directly, it will get the message, defaultPrompt etc
 * // as arguments which can be used to make a decision.
 *
 * prompt(async ({message}) => {
 *   if(message === "Please enter your age?") {
 *     await accept('20')
 *    }
 * })
 *
 *
 * // Note: Taiko's `prompt` listener has to be setup before the promt
 * // popup displays on the page. For example, if clicking on a button
 * // shows the prompt popup, the Taiko script is
 *
 * prompt('Message', async () => await accept())
 * await click('Open Prompt')
 *
 * @param {string | RegExp | function } messageOrCallback - Identify prompt based on this message, regex or callback.
 * @param {function} callback - Action to perform. accept/dismiss.
 */
module.exports.prompt = (message, callback) => dialog('prompt', message, callback);

/**
 * Accept or dismiss a `confirm` popup matching a text.<br>
 *
 * @example
 * confirm('Message', async () => await accept())
 *
 * confirm('Message', async () => await dismiss())
 *
 * // If alert message is unknown, A RegExp which matches
 * // the text can be used
 *
 * confirm(/^Are.+$sure, async () => await accept())
 *
 * // If alert message is completely unknown, A callback can
 * // be passed directly, it will get the message, defaultPrompt etc
 * // as arguments which can be used to make a decision.
 *
 * confirm(async ({message,defaultPrompt}) => {
 *  if(message === "Continue?") {
 *    await accept();
 *  }else{
 *    await dismiss();
 *  }
 * })
 *
 *
 * // Note: Taiko's `confirm` listener has to be setup before the confirm
 * // popup displays on the page. For example, if clicking on a button
 * // shows the confirm popup, the Taiko script is
 *
 * confirm('Message', async () => await accept())
 * await click('Show Confirm')
 *
 * @param {string | RegExp | function } messageOrCallback - Identify alert based on this message, regex or callback.
 * @param {function} callback - Action to perform. accept/dismiss.
 */
module.exports.confirm = (message, callback) => dialog('confirm', message, callback);

/**
 * Accept or dismiss a `beforeunload` popup.<br>
 *
 * @example
 * beforeunload(async () => await accept())
 * @example
 * beforeunload(async () => await dismiss())
 *
 * // Note: Taiko's `beforeunload` listener can be setup anywhere in the
 * // script. The listener will run when the popup displays on the page.
 *
 * @param {function} callback - Action to perform. Accept/Dismiss.
 */
module.exports.beforeunload = (callback) => dialog('beforeunload', '', callback);

/**
 * Evaluates script on element matching the given selector.
 *
 * @example
 * await evaluate(link("something"), (element) => element.style.backgroundColor)
 * @example
 * await evaluate((element) => {
 *      element.style.backgroundColor = 'red';
 * })
 * @example
 * await evaluate(() => {
 *   // Callback function have access to all DOM APIs available in the developer console.
 *   return document.title;
 * } )
 * @example
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
 * @param {number} [options.waitForStart=100] - wait for navigation to start. Accepts value in milliseconds.
 * @param {number} [options.navigationTimeout=5000] - Navigation timeout value in milliseconds for navigation after click.
 * @param {Array} options.args - Arguments to be passed to the provided callback.
 * @param {string[]} [options.waitForEvents = []] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint', 'targetNavigated']
 * @param {boolean} [options.silent=false] - Set true to run script silently without printing messages.
 * @returns {Promise<Object>} Object with return value of callback given.
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
      objectId: elem.get(),
      arg: { callback: callback.toString(), args: options.args },
      returnByValue: true,
    });
  });

  if (!options.silent) {
    descEvent.emit('success', 'Evaluated given script');
  }

  return result.result.value;
};

/**
 * This function is used to improve the readability. It simply returns the parameter passed into it.
 *
 * @example
 * await attach('c:/abc.txt', to('Please select a file:'))
 *
 * @param {selector|string} selector - Web element selector.
 * @returns {selector|string} selector - Web element selector.
 */
module.exports.to = (value) => value;

/**
 * This function is used to improve the readability. It simply returns the parameter passed into it.
 *
 * @example
 * await write("user", into(textBox('Username:')))
 *
 * @param {selector|string} selector - Web element selector.
 * @returns {selector|string} selector - Web element selector.
 */
module.exports.into = (value) => value;

/**
 * This function is used to wait for number of milliseconds given or a given element or a given condition.
 *
 * @example
 * waitFor(5000)
 * @example
 * waitFor("1 item in cart")
 * @example
 * waitFor("Order Created", 2000)
 * @example
 * waitFor(async () => !(await $("loading-text").exists()))
 *
 * @param {string} element - Element/condition to wait for
 * @param {number|time} time - Time to wait. default to 10s
 * @param { options.message } - Custom message
 * @return {promise}
 */

const waitFor = async (element, time, options = {}) => {
  validate();
  let timeout;
  let message;
  if (isObject(time)) {
    timeout = defaultConfig.retryTimeout;
    message = time.message;
  } else {
    timeout = time || defaultConfig.retryTimeout;
    message = options.message;
  }
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
    let foundElements = await element.elements(defaultConfig.retryInterval, timeout);
    if (!foundElements.length) {
      throw new Error(`Waiting Failed: Element '${element}' not found within ${timeout} ms`);
    }
  } else {
    await waitUntil(element, defaultConfig.retryInterval, timeout, message);
  }
};

module.exports.waitFor = waitFor;

/**
 * Accept action to perform on dialogs
 *
 * @example
 * prompt('Message', async () => await accept('Something'))
 * @example
 * prompt('Message', async () => await accept())
 *
 * @param {string} [text] Expected text of the dialog (optional)
 * @return {Promise<void>} - Resolves when dialog is accepted
 */
module.exports.accept = async (text = '') => {
  await pageHandler.handleJavaScriptDialog(true, text);
  descEvent.emit('success', 'Accepted dialog');
};

/**
 * Dismiss action to perform on dialogs
 *
 * @example
 * prompt('Message', async () => await dismiss())
 *
 * @return {Promise<void>} - Resolves when dialog is dismissed
 */
module.exports.dismiss = async () => {
  await pageHandler.handleJavaScriptDialog(false);
  descEvent.emit('success', 'Dismissed dialog');
};

/**
 * Starts a REPL when Taiko is invoked as a runner with `--load` option.
 * @name repl
 *
 * @example
 * const { goto } = require('taiko');
 * const { repl } = require('taiko/recorder');
 * (async () => {
 * await goto('google.com')
 * await goto('google.com')
 * await repl();
 * })();
 * @example
 * taiko --load script.js
 */

/**
 * This function is used by taiko to initiate the plugin.
 *
 * @param {string} ID - unique id or name of the plugin
 * @param {Function} init - callback method to set taiko instance for plugin
 */
const loadPlugin = (id, init) => {
  let plugins = new Map();
  try {
    if (!plugins.has(id)) {
      if (!eventHandlerProxy) {
        eventHandlerProxy = getEventProxy(eventHandler);
      }
      init(module.exports, eventHandlerProxy, descEvent, registerHooks);
      plugins.set(id, init);
    }
  } catch (error) {
    console.trace(error);
  }
};

getPlugins().forEach((pluginName) => {
  const overriddenAPIs = {};
  let pluginPath = path.resolve(`node_modules/${pluginName}`);
  const globalPath = childProcess
    .spawnSync('npm', ['root', '-g'], { shell: true })
    .stdout.toString()
    .slice(0, -1);
  if (!fs.existsSync(pluginPath)) {
    pluginPath = path.resolve(globalPath, pluginName);
  }
  let plugin = require(pluginPath);
  plugin.ID = pluginName.split('-').slice(1).join('-');
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
 * @param {string} optionName - Specifies the name of the configuration option/parameter you want to get (optional).
 * If not specified, returns a shallow copy of the full global configuration.
 * @param {string} string "navigationTimeout" Navigation timeout value in milliseconds for navigation after performing
 * [goto](/api/goto), [click](/api/click), [doubleClick](/api/doubleclick), [rightClick](/api/rightclick),
 * [write](/api/write), [clear](/api/clear), [press](/api/press) and [evaluate](/api/evaluate).
 * @param {string} string "observeTime" Option to modify delay time in milliseconds for observe mode.
 * @param {string} string "retryInterval" Option to modify delay time in milliseconds to retry the search of element existence.
 * @param {string} string "retryTimeout" Option to modify timeout in milliseconds while retrying the search of element existence.
 * @param {string} string "observe" Option to run each command after a delay. Useful to observe what is happening in the browser.
 * @param {string} string "waitForNavigation" Wait for navigation after performing [goto](/api/goto), [click](/api/click),
 * [doubleClick](/api/doubleclick), [rightClick](/api/rightclick), [write](/api/write), [clear](/api/clear),
 * [press](/api/press) and [evaluate](/api/evaluate).
 * @param {string} string "ignoreSSLErrors" Option to ignore SSL errors encountered by the browser (defaults to true).
 * @param {string} string "headful" Option to open browser in headless/headful mode.
 * @param {string} string "highlightOnAction" Option to highlight an element on action.
 */
module.exports.getConfig = getConfig;

/**
 * Lets you configure global configurations.
 *
 * @example
 * setConfig( { observeTime: 3000});
 *
 * @param {Object} options
 * @param {number} [options.navigationTimeout = 30000 ] Navigation timeout value in milliseconds for navigation after performing
 * <a href="#opentab">openTab</a>, <a href="#goto">goto</a>, <a href="#reload">reload</a>, <a href="#goback">goBack</a>,
 * <a href="#goforward">goForward</a>, <a href="#click">click</a>, <a href="#write">write</a>, <a href="#clear">clear</a>,
 * <a href="#press">press</a> and <a href="#evaluate">evaluate</a>.
 * @param {number} [options.observeTime = 3000 ] Option to modify delay time in milliseconds for observe mode.
 * @param {number} [options.retryInterval = 100 ] Option to modify delay time in milliseconds to retry the search of element existence.
 * @param {number} [options.retryTimeout = 10000 ] Option to modify timeout in milliseconds while retrying the search of element existence.
 * @param {boolean} [options.observe = false ] Option to run each command after a delay. Useful to observe what is happening in the browser.
 * @param {boolean} [options.waitForNavigation = true ] Wait for navigation after performing <a href="#goto">goto</a>, <a href="#click">click</a>,
 * <a href="#doubleclick">doubleClick</a>, <a href="#rightclick">rightClick</a>, <a href="#write">write</a>, <a href="#clear">clear</a>,
 * <a href="#press">press</a> and <a href="#evaluate">evaluate</a>.
 * @param {string[]} [options.waitForEvents = []] - Wait for events after performing <a href="#goto">goto</a>, <a href="#click">click</a>,
 * <a href="#doubleclick">doubleClick</a>, <a href="#rightclick">rightClick</a>, <a href="#write">write</a>, <a href="#clear">clear</a>,
 * <a href="#press">press</a> and <a href="#evaluate">evaluate</a>. Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle',
 * 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint', 'targetNavigated']
 * @param {boolean} [options.ignoreSSLErrors = true ] Option to ignore SSL errors encountered by the browser.
 * @param {boolean} [options.headful = false ] Option to open browser in headless/headful mode.
 * @param {string} [options.highlightOnAction = 'false' ] Option to highlight an element on action.
 */
module.exports.setConfig = setConfig;

const promisesToBeResolvedBeforeCloseBrowser = [];

const dialog = (dialogType, dialogMessage, callback) => {
  validate();
  let resolver = null;
  if (dialogType === 'beforeunload') {
    promisesToBeResolvedBeforeCloseBrowser.push(
      new Promise((resolve) => {
        resolver = resolve;
      }),
    );
  }
  let eventName = '';
  if (isFunction(dialogMessage)) {
    eventName = dialogType;
    callback = dialogMessage;
  } else {
    eventName = createJsDialogEvent(dialogMessage, dialogType);
    eventRegexMap.set(eventName, new RegExp(dialogMessage));
  }
  return eventHandler.once(eventName, async (args) => {
    await callback(args);
    resolver && resolver();
  });
};

const createJsDialogEvent = (message, dType) => {
  let hash = crypto.createHash('md5').update(message.toString()).digest('hex');
  return dType + '_' + hash;
};

const rectangle = async (selector, callback) => {
  const elems = await findElements(selector);
  let results = [];
  for (const e of elems) {
    if (await e.isVisible()) {
      const objectId = e.get();
      const r = await domHandler.getBoundingClientRect(objectId);
      results.push({ elem: objectId, result: callback(r) });
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
 * @example
 * button('Get Started')
 * @example
 * $('#id')
 * @example
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
 * @example
 * toLeftOf('Sign in')
 * @example
 * toRightOf('Get Started')
 * @example
 * above('Sign in')
 * @example
 * below('Home')
 * @example
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
 * @example
 * near('Get Started')
 *
 */

const realFuncs = {};
for (const func in module.exports) {
  realFuncs[func] = module.exports[func];
  if (realFuncs[func].constructor.name === 'AsyncFunction') {
    module.exports[func] = async function () {
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
    'resizeWindow',
    'openTab',
    'closeTab',
    'openIncognitoWindow',
    'closeIncognitoWindow',
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
    'clearHighlights',
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
    'timeField',
    'textBox',
    'dropDown',
    'checkBox',
    'radioButton',
    'text',
    'tableCell',
    'color',
    'range',
  ],
  'Proximity selectors': ['toLeftOf', 'toRightOf', 'above', 'below', 'near', 'within'],
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
module.exports.clearIntercept = (requestUrl) => {
  if (requestUrl) {
    var success = fetchHandler.resetInterceptor(requestUrl);
    if (success) {
      descEvent.emit('success', 'Intercepts reset for url ' + requestUrl);
    } else {
      descEvent.emit('success', 'Intercepts not found for url ' + requestUrl);
    }
  } else {
    fetchHandler.resetInterceptors();
    descEvent.emit('success', 'Intercepts reset for all url');
  }
};
