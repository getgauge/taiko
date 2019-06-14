const cri = require('chrome-remote-interface');
const debug = require('debug');
const logEvent = debug('taiko:event');
const childProcess = require('child_process');
const BrowserFetcher = require('./browserFetcher');
const removeFolder = require('rimraf');
const { helper, wait, isString, isFunction, getIfExists, waitUntil,
    exists, xpath, waitForNavigation, timeouts } = require('./helper');
const { calcObserveDelay, createJsDialogEventName } = require('./util');
const removeFolderAsync = helper.promisify(removeFolder);
const inputHandler = require('./inputHandler');
const domHandler = require('./domHandler');
const networkHandler = require('./networkHandler');
const pageHandler = require('./pageHandler');
const targetHandler = require('./targetHandler');
const runtimeHandler = require('./runtimeHandler');
const browserHandler = require('./browserHandler');
const emulationHandler = require('./emulationHandler');
const { handleRelativeSearch, setDOM, RelativeSearchElement } = require('./proximityElementSearch');
const devices = require('./data/devices').default;
const { determineWaitForNavigation, setConfig, config } = require('./config');
const fs = require('fs');
const os = require('os');
const mkdtempAsync = helper.promisify(fs.mkdtemp);
const path = require('path');
const CHROME_PROFILE_PATH = path.join(os.tmpdir(), 'taiko_dev_profile-');
const { getPlugins } = require('./plugins');
const EventEmiter = require('events').EventEmitter;
const xhrEvent = new EventEmiter();
const descEvent = new EventEmiter();
let chromeProcess, temporaryUserDataDir, page, network, runtime, input, _client, dom, emulation, overlay, criTarget, currentPort, currentHost,
    headful, security, ignoreSSLErrors, observe, browser, device;
let xhrEventProxy;
let clientProxy;
let localProtocol = false;
let highlightOnAction = process.env.TAIKO_HIGHLIGHT_ON_ACTION || 'true';
let plugins = new Map();

module.exports.emitter = descEvent;

const connect_to_cri = async (target) => {
    if (process.env.LOCAL_PROTOCOL) {
        localProtocol = true;
    }
    if (_client) {
        await network.setRequestInterception({ patterns: [] });
        _client.removeAllListeners();
    }
    return new Promise(async function connect(resolve) {
        try {
            if (!target) {
                const browserTargets = await cri.List({ host: currentHost, port: currentPort });
                if (!browserTargets.length) throw new Error('No targets created yet!');
                target = browserTargets.filter((target) => target.type === 'page')[0];
            }
            await cri({ target, local: localProtocol }, async (c) => {
                _client = c;
                clientProxy = getEventProxy(_client);
                page = c.Page;
                network = c.Network;
                runtime = c.Runtime;
                input = c.Input;
                dom = c.DOM;
                emulation = c.Emulation;
                criTarget = c.Target;
                overlay = c.Overlay;
                security = c.Security;
                browser = c.Browser;
                await networkHandler.setNetwork(network, xhrEvent, logEvent);
                await inputHandler.setInput(input);
                await domHandler.setDOM(dom);
                await targetHandler.setTarget(criTarget, xhrEvent, connect_to_cri, currentHost, currentPort);
                await runtimeHandler.setRuntime(runtime, dom);
                await browserHandler.setBrowser(browser);
                await emulationHandler.setEmulation(emulation);
                await pageHandler.setPage(page, xhrEvent, logEvent, async function () {
                    if (!_client) return;
                    logEvent('DOMContentLoaded');
                    await dom.getDocument();
                });
                await Promise.all([runtime.enable(), network.enable(), page.enable(), dom.enable(), overlay.enable(), security.enable()]);
                await setDOM(domHandler);
                if (ignoreSSLErrors) security.setIgnoreCertificateErrors({ ignore: true });
                _client.on('disconnect', reconnect);
                device = process.env.TAIKO_EMULATE_DEVICE;
                if (device) emulateDevice(device);
                xhrEvent.emit('createdSession', _client);
                resolve();
            });
        } catch (e) {
            const timeoutId = setTimeout(() => { connect(resolve); }, 1000);
            timeouts.push(timeoutId);
        }
    });
};

async function reconnect() {
    try {
        xhrEvent.emit('reconnecting');
        _client.removeAllListeners();
        _client = null;
        const browserTargets = await cri.List({ host: currentHost, port: currentPort });
        const pages = browserTargets.filter((target) => {
            return target.type === 'page';
        });
        await connect_to_cri(pages[0]);
        await dom.getDocument();
        xhrEvent.emit('reconnected');
    } catch (e) {
        console.log(e);
    }
}

const setBrowserOptions = (options) => {
    options.port = options.port || 0;
    options.host = options.host || '127.0.0.1';
    options.headless = options.headless === undefined || options.headless === null ? true : options.headless;
    headful = !options.headless;
    ignoreSSLErrors = options.ignoreCertificateErrors;
    observe = options.observe || false;
    setConfig({ observeTime: calcObserveDelay(observe, options.observeTime) });
    return options;
};

/**
 * Launches a browser with a tab. The browser will be closed when the parent node.js process is closed.
 *
 * @example
 * await openBrowser({ headless: false })
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
module.exports.openBrowser = async (options = { headless: true }) => {
    const browserFetcher = new BrowserFetcher();
    const chromeExecutable = browserFetcher.getExecutablePath();
    if (options.host && options.port) {
        currentHost = options.host;
        currentPort = options.port;
    } else {
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
            '--enable-automation'
        ];
        if (options.args) args = args.concat(options.args);
        if (!args.some(arg => arg.startsWith('--user-data-dir'))) {
            temporaryUserDataDir = await mkdtempAsync(CHROME_PROFILE_PATH);
            args.push(`--user-data-dir=${temporaryUserDataDir}`);
        }
        if (options.headless) args = args.concat(['--headless', '--window-size=1440,900']);
        chromeProcess = await childProcess.spawn(chromeExecutable, args);
        if (options.dumpio) {
            chromeProcess.stderr.pipe(process.stderr);
            chromeProcess.stdout.pipe(process.stdout);
        }
        const endpoint = await browserFetcher.waitForWSEndpoint(chromeProcess, config.navigationTimeout);
        currentHost = endpoint.host;
        currentPort = endpoint.port;
    }
    await doActionAwaitingNavigation(setNavigationOptions({waitForEvents:['networkIdle']}),connect_to_cri);
    var description = device ? `Browser opened with viewport ${device}` : 'Browser opened';
    descEvent.emit('success', description);
    if (process.env.TAIKO_EMULATE_NETWORK)
        await module.exports.emulateNetwork(process.env.TAIKO_EMULATE_NETWORK);
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
    timeouts.forEach(timeout => { if (timeout) clearTimeout(timeout); });
    await _closeBrowser();
    networkHandler.resetInterceptors();
    descEvent.emit('success', 'Browser closed');
};

const _closeBrowser = async () => {
    if (_client) {
        await _client.removeAllListeners();
        await page.close();
        await _client.close();
        _client = null;
    }
    chromeProcess.kill('SIGTERM');
    const waitForChromeToClose = new Promise((fulfill) => {
        chromeProcess.once('exit', () => {
            if (temporaryUserDataDir) {
                removeFolderAsync(temporaryUserDataDir)
                    .then(() => fulfill())
                    .catch(() => { });
            } else {
                fulfill();
            }
        });
    });
    return waitForChromeToClose;
};

function getEventProxy(target) {
    let unsupportedClientMethods = ['removeListener', 'emit', 'removeAllListeners', 'setMaxListeners', 'off'];
    const handler = {
        get: (target, name) => {
            if (unsupportedClientMethods.includes(name)) throw new Error(`Unsupported action ${name} on client`);
            return target[name];
        }
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
 * await switchTo('https://taiko.gauge.org/') # switch using URL
 * await switchTo('Taiko') # switch using Title
 *
 * @param {string} targetUrl - URL/Page title of the tab to switch.
 *
 * @returns {Promise}
 */
module.exports.switchTo = async (targetUrl) => {
    validate();
    const targets = await targetHandler.getCriTargets(targetUrl);
    if (targets.matching.length === 0) {
        throw new Error('No target with given URL/Title found.');
    }
    await connect_to_cri(targets.matching[0]);
    await dom.getDocument();
    descEvent.emit('success', 'Switched to tab with URL ' + targetUrl);
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
 * #case 4: redirect :
 * await intercept(url, redirectUrl)
 * # case 5: mockResponse based on request :
 * await intercept(url, (request) => { request.respond({mockResponseObject}) })
 *
 * @param {string} requestUrl request URL to intercept
 * @param {function|Object} option action to be done after interception. For more examples refer to https://github.com/getgauge/taiko/issues/98#issuecomment-42024186
 *
 * @returns {Promise}
 */
module.exports.intercept = async (requestUrl, option) => {
    await networkHandler.addInterceptor({ requestUrl: requestUrl, action: option });
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
 * @param {string} deviceModel - See [device model](https://github.com/getgauge/taiko/blob/master/lib/data/devices.js) for a list of all device models.
 *
 * @returns {Promise}
 */

module.exports.emulateDevice = emulateDevice;
async function emulateDevice(deviceModel) {
    validate();
    const deviceEmulate = devices[deviceModel];
    let deviceNames = Object.keys(devices);
    if (deviceEmulate == undefined)
        throw new Error(`Please set one of the given device models \n${deviceNames.join('\n')}`);
    await Promise.all([
        emulationHandler.setViewport(deviceEmulate.viewport),
        network.setUserAgentOverride({ userAgent: deviceEmulate.userAgent })
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
module.exports.setViewPort = async (options) => {
    validate();
    await emulationHandler.setViewport(options);
    descEvent.emit('success', 'ViewPort is set to width ' + options.width + ' and height ' + options.height);
};

/**
 * Launches a new tab. If url is provided, the new tab is opened with the url loaded.
 * @example
 * await openTab('https://taiko.gauge.org/')
 * await openTab() # opens a blank tab.
 *
 * @param {string} [targetUrl=''] - Url of page to open in newly created tab.
 * @param {Object} options
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the reload. Default navigation timeout is 5000 milliseconds, to override pass `{ navigationTimeout: 10000 }` in `options` parameter.
 * @param {number} [options.timeout=5000] - DEPRECATED timeout option, use navigationTimeout instead.
 * @param {number} [options.navigationTimeout=5000] - Navigation timeout value in milliseconds for navigation after click. Accepts value in milliseconds.
 * @param {number} [options.waitForStart=100] - time to wait to check for occurance of page load events. Accepts value in milliseconds.
 * @param {string[]} [options.waitForEvents = ['firstMeaningfulPaint']] - Page load events to implicitly wait for. Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']]
 * 
 * @returns {Promise}
 */
module.exports.openTab = async (targetUrl, options = { navigationTimeout: config.navigationTimeout }) => {
    validate();
    if (!targetUrl) {
        _client.removeAllListeners();
        let target = await cri.New({ host: currentHost, port: currentPort });
        await connect_to_cri(target);
        descEvent.emit('success', 'Opened a new tab');
        return;
    }
    if (!/^https?:\/\//i.test(targetUrl) && !/^file/i.test(targetUrl)) targetUrl = 'http://' + targetUrl;
    options = setNavigationOptions(options);
    await doActionAwaitingNavigation(options, async () => {
        await criTarget.createTarget({ url: targetUrl });
    });
    descEvent.emit('success', 'Opened tab with URL ' + targetUrl);
};

/**
 * Closes the given tab with given URL or closes current tab.
 *
 * @example
 * await closeTab() # Closes the current tab.
 * await closeTab('https://gauge.org') # Closes all the tabs with URL 'https://gauge.org'.
 *
 * @param {string} [targetUrl] - URL/Page title of the tab to close.
 */
module.exports.closeTab = async (targetUrl) => {
    validate();
    const { matching, others } = await targetHandler.getCriTargets(targetUrl);
    if (!others.length) {
        await _closeBrowser();
        descEvent.emit('success', 'Closing last target and browser.');
        return;
    }
    _client.removeAllListeners();
    _client = null;
    let closedTabUrl;
    for (let target of matching) {
        closedTabUrl = target.url;
        await cri.Close({ host: currentHost, port: currentPort, id: target.id });
    }
    await connect_to_cri(targetHandler.constructCriTarget(others[0]));
    await dom.getDocument();
    let message = targetUrl ? `Closed all tabs with URL ${targetUrl}` : `Closed current tab with URL ${closedTabUrl}`;
    descEvent.emit('success', message);
};

/**
 * Override browser permissions
 *
 * @example
 * await overridePermissions('http://maps.google.com',['geolocation']);
 *
 * @param {string} origin - url origin to override permissions
 * @param {Array<string>} permissions - See [chrome devtools permission types](https://chromedevtools.github.io/devtools-protocol/tot/Browser/#type-PermissionType) for a list of permission types.
 */
module.exports.overridePermissions = async (origin, permissions) => {
    validate();
    await browserHandler.overridePermissions(origin, permissions);
    descEvent.emit('success', 'Override permissions with ' + permissions);
};

/**
 * clears all the permissions set
 *
 * @example
 * await clearPermissionOverrides()
 *
 */
module.exports.clearPermissionOverrides = async () => {
    validate();
    await browserHandler.clearPermissionOverrides();
    descEvent.emit('success', 'Cleared permission overrides');
};

/**
 * Sets a cookie with the given cookie data; may overwrite equivalent cookie if they exist.
 *
 * @example
 * await setCookie("CSRFToken","csrfToken", {url: "http://the-internet.herokuapp.com"})
 * await setCookie("CSRFToken","csrfToken", {domain: "herokuapp.com"})
 *
 * @param {string} name - Cookie name.
 * @param {string} value - Cookie value.
 * @param {Object} [options]
 * @param {string} [options.url] - sets cookie with the URL.
 * @param {string} [options.domain] - sets cookie with the exact domain.
 * @param {string} [options.path] - sets cookie with the exact path.
 * @param {boolean} [options.secure] - True if cookie to be set is secure.
 * @param {boolean} [options.httpOnly] - True if cookie to be set is http-only.
 * @param {string} [options.sameSite] - Represents the cookie's 'SameSite' status: https://tools.ietf.org/html/draft-west-first-party-cookies.
 * @param {number} [options.expires] - UTC time in seconds, counted from January 1, 1970. eg: 2019-02-16T16:55:45.529Z
 */
module.exports.setCookie = async (name, value, options = {}) => {
    validate();
    if (options.url === undefined && options.domain === undefined) throw new Error('At least URL or domain needs to be specified for setting cookies');
    options.name = name;
    options.value = value;
    let res = await network.setCookie(options);
    if (!res.success) throw new Error('Unable to set ' + name + ' cookie');
    descEvent.emit('success', name + ' cookie set successfully');
};

/**
 * Clears browser cookies.
 *
 * @deprecated use deleteCookies api to clear browser cookies.
 *
 * @example
 * await clearBrowserCookies()
 *
 */
module.exports.clearBrowserCookies = async () => {
    validate();
    console.warn('DEPRECATION WARNING: clearBrowserCookies is deprecated. use deleteCookies instead');
    await network.clearBrowserCookies();
    descEvent.emit('success', 'Browser cookies deleted successfully');
};

/**
 * Deletes browser cookies with matching name and URL or domain/path pair. If cookie name is not given or empty, all browser cookies are deleted.
 *
 * @example
 * deleteCookies()
 * deleteCookies("CSRFToken", {url: "http://the-internet.herokuapp.com"})
 * deleteCookies("CSRFToken", {domain: "herokuapp.com"})
 *
 * @param {string} cookieName - Cookie name.
 * @param {Object} [options]
 * @param {string} [options.url] - deletes all the cookies with the given name where domain and path match provided URL. eg: https://google.com
 * @param {string} [options.domain] - deletes only cookies with the exact domain. eg: google.com
 * @param {string} [options.path] - deletes only cookies with the exact path. eg: Google/Chrome/Default/Cookies/..
 */
module.exports.deleteCookies = async (cookieName, options = {}) => {
    validate();
    if (!cookieName || !cookieName.trim()) {
        await network.clearBrowserCookies();
        descEvent.emit('success', 'Browser cookies deleted successfully');
    } else {
        if (options.url === undefined && options.domain === undefined) throw new Error('At least URL or domain needs to be specified for deleting cookies');
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
 * @param {Array} [options.urls] - The list of URLs for which applicable cookies will be fetched
 * @returns {Promise<Object>} - Array of cookie objects
 */
module.exports.getCookies = async (options = {}) => {
    validate();
    return (await network.getCookies(options)).cookies;
};

/**
 * This function is used to mock geo location
 *
 * @example
 * await setLocation({ latitude: 27.1752868, longitude: 78.040009, accuracy:20 })
 *
 * @param {Object} [options] Latitue, logitude and accuracy to set the location.
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
 * await goto('google.com')
 * await goto({ navigationTimeout:10000, headers:{'Authorization':'Basic cG9zdG1hbjpwYXNzd29y2A=='}})
 *
 * @param {string} url - URL to navigate page to.
 * @param {Object} options
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the goto. Default navigationTimeout is 30 seconds to override pass `{ navigationTimeout: 10000 }` in `options` parameter.
 * @param {string[]} [options.waitForEvents = ['firstMeaningfulPaint']] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']
 * @param {number} [options.timeout=30000] - DEPRECATED timeout option, use navigationTimeout instead.
 * @param {number} [options.navigationTimeout=30000] - Navigation timeout value in milliseconds for navigation after click.
 * @param {Object} options.headers - Map with extra HTTP headers.
 * @param {number} [options.waitForStart = 100] - time to wait for navigation to start. Accepts value in milliseconds.
 * 
 * @returns {Promise}
 */
module.exports.goto = async (url, options = { navigationTimeout: config.navigationTimeout }) => {
    validate();
    if (!/^https?:\/\//i.test(url) && !/^file/i.test(url)) url = 'http://' + url;
    if (options.headers) await network.setExtraHTTPHeaders({ headers: options.headers });
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
 * @param {string} url - URL to reload
 * @param {Object} options
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the reload. Default navigation timeout is 30 seconds, to override pass `{ navigationTimeout: 10000 }` in `options` parameter.
 * @param {string[]} [options.waitForEvents = ['firstMeaningfulPaint']] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']
 * @param {number} [options.timeout=30000] - DEPRECATED timeout option, use navigationTimeout instead.
 * @param {number} [options.navigationTimeout=30000] - Navigation timeout value in milliseconds for navigation after click.
 * @param {number} [options.waitForStart = 100] - time to wait for navigation to start. Accepts value in milliseconds.
 * 
 * @returns {Promise}
 */
module.exports.reload = async (url, options = { navigationTimeout: config.navigationTimeout }) => {
    validate();
    options = setNavigationOptions(options);
    options.isPageNavigationAction = true;
    await doActionAwaitingNavigation(options, async () => {
        await page.reload(url);
    });
    url = url !== undefined && url !== null ? url : (await runtimeHandler.runtimeEvaluate('window.location.toString()')).result.value;
    descEvent.emit('success', url + 'reloaded');
};

/**
 * Mimics browser back button click functionality.
 * @example
 * await goBack()
 *
 * @param {Object} options
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the goBack. Default navigation timeout is 30 seconds, to override pass `{ navigationTimeout: 10000 }` in `options` parameter.
 * @param {string[]} [options.waitForEvents = ['firstMeaningfulPaint']] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']
 * @param {number} [options.timeout=30000] - DEPRECATED timeout option, use navigationTimeout instead.
 * @param {number} [options.navigationTimeout=30000] - Navigation timeout value in milliseconds for navigation after click.
 * @param {number} [options.waitForStart = 100] - time to wait for navigation to start. Accepts value in milliseconds.
 *
 * @returns {Promise}
 */
module.exports.goBack = async (options = { navigationTimeout: config.navigationTimeout }) => {
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
 * @param {number} [options.timeout=30000] - DEPRECATED timeout option, use navigationTimeout instead.
 * @param {number} [options.navigationTimeout=30000] - Navigation timeout value in milliseconds for navigation after click.
 * @param {number} [options.waitForStart = 100] - time to wait for navigation to start. Accepts value in milliseconds.
 * 
 * @returns {Promise}
 */
module.exports.goForward = async (options = { navigationTimeout: config.navigationTimeout }) => {
    validate();
    await _go(+1, options);
    descEvent.emit('success', 'Performed clicking on browser forward button');
};

const _go = async (delta, options) => {
    const history = await page.getNavigationHistory();
    const entry = history.entries[history.currentIndex + delta];
    if (!entry)
        return null;
    options = setNavigationOptions(options);
    options.isPageNavigationAction = true;
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
module.exports.currentURL = async () => {
    validate();
    const locationObj = await runtimeHandler.runtimeEvaluate('window.location.toString()');
    return (locationObj.result.value);
};

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
    const result = await runtimeHandler.runtimeEvaluate('document.querySelector("title").textContent');
    return result.result.value;
};

const setNavigationOptions = (options) => {
    if (options.hasOwnProperty('timeout'))
        console.warn('DEPRECATION WARNING: timeout option is deprecated, use navigationTimeout instead');
    options.waitForNavigation = determineWaitForNavigation(options.waitForNavigation);
    options.navigationTimeout = options.navigationTimeout || options.timeout || config.navigationTimeout;
    options.waitForStart = options.waitForStart || 100;
    return options;
};

const setOptions = (options, x, y) => {
    options = setNavigationOptions(options);
    options.x = x;
    options.y = y;
    options.button = options.button || 'left';
    options.clickCount = options.clickCount || 1;
    options.elementsToMatch = options.elementsToMatch || 10;
    return options;
};

const checkIfElementAtPointOrChild = async (e) => {

    function isElementAtPointOrChild() {
        let value, elem = this;
        if (elem.nodeType === Node.TEXT_NODE) {
            let range = document.createRange();
            range.selectNodeContents(elem);
            value = range.getClientRects()[0];
            elem = elem.parentElement;
        } else value = elem.getBoundingClientRect();
        const y = (value.top + value.bottom) / 2;
        const x = (value.left + value.right) / 2;
        const node = document.elementFromPoint(x, y);
        return elem.contains(node) ||
            (window.getComputedStyle(node).getPropertyValue('opacity') < 0.1) ||
            (window.getComputedStyle(elem).getPropertyValue('opacity') < 0.1);
    }

    const res = await runtimeHandler.runtimeCallFunctionOn(isElementAtPointOrChild, null, { nodeId: e });
    return res.result.value;
};

const getChildNodes = async (element) => {
    function getChild() {
        return this.childNodes;
    }
    const res = await evaluate(element, getChild);
    const childNodes = await runtimeHandler.getNodeIdsFromResult({ result: res });
    return childNodes;
};

const checkIfChildOfOtherMatches = async (elem, elements) => {
    function getElementFromPoint() {
        let value, elem = this;
        if (elem.nodeType === Node.TEXT_NODE) {
            let range = document.createRange();
            range.selectNodeContents(elem);
            value = range.getClientRects()[0];
        } else value = elem.getBoundingClientRect();
        const y = (value.top + value.bottom) / 2;
        const x = (value.left + value.right) / 2;
        return document.elementFromPoint(x, y);
    }
    const result = await runtimeHandler.runtimeCallFunctionOn(getElementFromPoint, null, { nodeId: elem });
    if (result.result.value === null) return false;
    const { nodeId } = await dom.requestNode({ objectId: result.result.objectId });
    if (elements.includes(nodeId)) return true;
    for (const element of elements) {
        const childNodes = await getChildNodes(element);
        if (childNodes.includes(nodeId)) return true;
    }
    const childOfNodeAtPoint = await getChildNodes(nodeId);
    if (childOfNodeAtPoint.some((val) => elements.includes(val))) return true;
    return false;
};

const checkIfElementIsCovered = async (elem, elems, isElemAtPoint) => {
    isElemAtPoint = await checkIfElementAtPointOrChild(elem);
    //If element to be clicked and element at point are different check if it is any other element matching the selector
    if (!isElemAtPoint)
        isElemAtPoint = await checkIfChildOfOtherMatches(elem, elems);
    return isElemAtPoint;
};

async function _click(selector, options, ...args) {
    const elems = Number.isInteger(selector) ? [selector] : (await handleRelativeSearch(await elements(selector), args));
    let elemsLength = elems.length;
    let isElemAtPoint;
    options = setOptions(options);
    if (elemsLength > options.elementsToMatch) {
        elems.splice(options.elementsToMatch, elems.length);
    }
    for (let elem of elems) {
        isElemAtPoint = false;
        await scrollTo(elem);
        const { x, y } = await domHandler.boundingBoxCenter(elem);
        isElemAtPoint = await checkIfElementIsCovered(elem, elems, isElemAtPoint);
        options = setOptions(options, x, y);
        if (isElemAtPoint) {
            const type = (await evaluate(elem, function getType() { return this.type; })).value;
            assertType(elem, () => type !== 'file', 'Unsupported operation, use `attach` on file input field');
            if (headful) await highlightElemOnAction(elem);
            break;
        }
    }
    if (!isElemAtPoint && elemsLength != elems.length)
        throw Error('Please provide a more specific selector, too many matches.');
    if (!isElemAtPoint)
        throw Error(description(selector) + ' is covered by other element');
    await waitForMouseActions(options);
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
 * @param {number} [options.timeout=30000] - DEPRECATED timeout option, use navigationTimeout instead.
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
    if (isSelector(selector) || isString(selector) || Number.isInteger(selector)) {
        await _click(selector, options, ...args);
        descEvent.emit('success', 'Clicked ' + description(selector, true));
    } else {
        options = setOptions(options, selector.x, selector.y);
        await waitForMouseActions(options);
        descEvent.emit('success', 'Clicked on coordinates x : ' + selector.x + ' and y : ' + selector.y);
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
        waitForNavigation: determineWaitForNavigation(options.waitForNavigation),
        clickCount: 2
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
        waitForNavigation: determineWaitForNavigation(options.waitForNavigation),
        button: 'right'
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
    let sourceElem = await element(source);
    let destElem = isSelector(destination) || isString(destination) ? await element(destination) : destination;
    let options = setOptions({});
    await doActionAwaitingNavigation(options, async () => {
        if (headful) {
            await highlightElemOnAction(sourceElem);
            if (!isNaN(destElem)) await highlightElemOnAction(destElem);
        }
        await dragAndDrop(options, sourceElem, destElem);
    });
    const desc = !isNaN(destElem) ? `Dragged and dropped ${description(source, true)} to ${description(destination, true)}}` :
        `Dragged and dropped ${description(source, true)} at ${JSON.stringify(destination)}`;
    descEvent.emit('success', desc);
};

const dragAndDrop = async (options, sourceElem, destElem) => {
    let sourcePosition = await domHandler.boundingBoxCenter(sourceElem);
    await scrollTo(sourceElem);
    options.x = sourcePosition.x;
    options.y = sourcePosition.y;
    options.type = 'mouseMoved';
    await input.dispatchMouseEvent(options);
    options.type = 'mousePressed';
    await input.dispatchMouseEvent(options);
    let destPosition = await calculateDestPosition(sourceElem, destElem);
    await inputHandler.mouse_move(sourcePosition, destPosition);
    options.x = destPosition.x;
    options.y = destPosition.y;
    options.type = 'mouseReleased';
    await input.dispatchMouseEvent(options);
};

const calculateDestPosition = async (sourceElem, destElem) => {
    if (!isNaN(destElem)) {
        await scrollTo(destElem);
        return await domHandler.boundingBoxCenter(destElem);
    }
    const destPosition = await domHandler.calculateNewCenter(sourceElem, destElem);
    const newBoundary = destPosition.newBoundary;
    if (headful) {
        await overlay.highlightQuad({ quad: [newBoundary.right, newBoundary.top, newBoundary.right, newBoundary.bottom, newBoundary.left, newBoundary.bottom, newBoundary.left, newBoundary.top], outlineColor: { r: 255, g: 0, b: 0 } });
        await waitFor(1000);
        await overlay.hideHighlight();
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
    const e = await element(selector);
    await scrollTo(e);
    if (headful) await highlightElemOnAction(e);
    const { x, y } = await domHandler.boundingBoxCenter(e);
    const option = {
        x: x,
        y: y
    };
    await doActionAwaitingNavigation(options, async () => {
        Promise.resolve().then(() => {
            option.type = 'mouseMoved';
            return input.dispatchMouseEvent(option);
        }).catch((err) => {
            throw new Error(err);
        });
    });
    descEvent.emit('success', 'Hovered over the ' + description(selector, true));
};

/**
 * Fetches an element with the given selector and focuses it. If there's no element matching selector, the method throws an error.
 *
 * @example
 * await focus(textField('Username:'))
 *
 * @param {selector|string} selector - A selector of an element to focus. If there are multiple elements satisfying the selector, the first will be focused.
 * @param {Object} options
 * @param {string[]} [options.waitForEvents = ['firstMeaningfulPaint']] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']
 */
module.exports.focus = async (selector, options = {}) => {
    validate();
    options = setNavigationOptions(options);
    await doActionAwaitingNavigation(options, async () => {
        if (headful) await highlightElemOnAction(await element(selector));
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
 * @param {number} [options.timeout=30000] - DEPRECATED timeout option, use navigationTimeout instead.
 * @param {number} [options.navigationTimeout=30000] - Navigation timeout value in milliseconds for navigation after click.
 * @param {string[]} [options.waitForEvents = ['firstMeaningfulPaint']] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']
 * 
 * @returns {Promise}
 */
module.exports.write = async (text, into, options = { delay: 10 }) => {
    validate();
    let desc;
    if (into && !isSelector(into)) {
        if (!into.delay) into.delay = options.delay;
        options = into;
        into = undefined;
    }
    options = setNavigationOptions(options);
    await doActionAwaitingNavigation(options, async () => {
        if (into) {
            const selector = isString(into) ? textField(into) : into;
            await _focus(selector);
            const activeElement = await runtimeHandler.activeElement();
            await _write(text, activeElement, options);
            text = (activeElement.isPassword) ? '*****' : text;
            desc = `Wrote ${text} into the ` + description(selector, true);
            return;
        } else {
            const activeElement = await runtimeHandler.activeElement();
            await _write(text, activeElement, options);
            text = (activeElement.isPassword) ? '*****' : text;
            desc = `Wrote ${text} into the focused element.`;
            return;
        }
    });
    descEvent.emit('success', desc);
};

const _write = async (text, activeElement, options) => {
    if (activeElement.notWritable){
        await waitUntil(async () => !(await runtimeHandler.activeElement()).notWritable,1000,10000).catch(() => {
            throw new Error('Element focused is not writable');
        });
        activeElement = await runtimeHandler.activeElement();
    }
    if (headful) await highlightElemOnAction(activeElement.nodeId);
    for (const char of text) {
        await input.dispatchKeyEvent({ type: 'keyDown', text: char });
        await input.dispatchKeyEvent({ type: 'keyUp', text: char });
        await new Promise(resolve => {
            const timeoutId = setTimeout(resolve, options.delay);
            timeouts.push(timeoutId);
        });
    }
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
 * @param {number} [options.timeout=30000] - DEPRECATED timeout option, use navigationTimeout instead.
 * @param {number} [options.navigationTimeout=30000] - Navigation timeout value in milliseconds for navigation after click.
 * @param {string[]} [options.waitForEvents = ['firstMeaningfulPaint']] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']
 * 
 * @returns {Promise}
 */
module.exports.clear = async (selector, options = {}) => {
    validate();
    if (selector && !isSelector(selector)) {
        options = selector;
        selector = undefined;
    }
    options = setNavigationOptions(options);
    if (selector) await _focus(selector);
    const activeElement = await runtimeHandler.activeElement();
    if (activeElement.notWritable)
        throw new Error('Element cannot be cleared');
    const desc = !selector ? 'Cleared element on focus' :
        'Cleared ' + description(selector, true);
    await doActionAwaitingNavigation(options, async () => {
        await _clear(activeElement.nodeId);
        if (headful) await highlightElemOnAction(activeElement.nodeId);
    });
    descEvent.emit('success', desc);
};

const _clear = async (elem) => {
    await _click(elem, { clickCount: 3, waitForNavigation: false });
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
    fs.open(resolvedPath, 'r', (err) => {
        if (err && err.code === 'ENOENT') {
            throw new Error(`File ${resolvedPath} does not exist.`);
        }
    });
    if (isString(to)) to = fileField(to);
    else if (!isSelector(to)) throw Error('Invalid element passed as parameter');
    const nodeId = await element(to);
    if (headful) await highlightElemOnAction(nodeId);
    await dom.setFileInputFiles({
        nodeId: nodeId,
        files: [resolvedPath]
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
 * @param {string | Array<string> } keys - Name of keys to press. See [USKeyboardLayout](https://github.com/getgauge/taiko/blob/master/lib/USKeyboardLayout.js) for a list of all key names.
 * @param {Object} options
 * @param {string} [options.text = ""] - If specified, generates an input event with this text.
 * @param {number} [options.delay=0] - Time to wait between keydown and keyup in milliseconds.
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the click. Default navigation timeout is 30 seconds, to override pass `{ navigationTimeout: 10000 }` in `options` parameter.
 * @param {number} [options.waitForStart=100] - wait for navigation to start.
 * @param {number} [options.timeout=30000] - DEPRECATED timeout option, use navigationTimeout instead.
 * @param {number} [options.navigationTimeout=30000] - Navigation timeout value in milliseconds for navigation after click.
 * @param {string[]} [options.waitForEvents = ['firstMeaningfulPaint']] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']
 * 
 * @returns {Promise}
 */
module.exports.press = async (keys, options = {}) => {
    validate();
    options = setNavigationOptions(options);
    return await _press(new Array().concat(keys), options);
};

async function _press(keys, options) {
    await doActionAwaitingNavigation(options, async () => {
        for (let i = 0; i < keys.length; i++) await inputHandler.down(keys[i], options);
        if (options && options.delay) await new Promise(f => {
            const timeoutId = setTimeout(f, options.delay);
            timeouts.push(timeoutId);
        });
        keys = keys.reverse();
        for (let i = 0; i < keys.length; i++) await inputHandler.up(keys[i]);
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
    let elems = await handleRelativeSearch(await elements(selector), args);
    await evaluate(elems[0], highlightNode);
    descEvent.emit('success', 'Highlighted the ' + description(selector, true));
}

/**
 * Performs the given mouse action on the given coordinates. This is useful in performing actions on canvas.
 *
 * @example
 * await mouseAction('press', {x:0,y:0})
 * await mouseAction('move', {x:9,y:9})
 * await mouseAction('release', {x:9,y:9})
 *
 * @param {string} action - Action to be performed on the canvas
 * @param {Object} coordinates - Coordinates of a point on canvas to perform the action.
 * @param {Object} options
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the click. Default navigation timeout is 30 seconds, to override pass `{ navigationTimeout: 10000 }` in `options` parameter.
 * @param {number} [options.timeout=30000] - DEPRECATED timeout option, use navigationTimeout instead.
 * @param {number} [options.navigationTimeout=30000] - Navigation timeout value in milliseconds for navigation after click.
 * @param {string[]} [options.waitForEvents = ['firstMeaningfulPaint']] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']
 * @param {number} [options.waitForStart=100] - time to wait for navigation to start. Accepts time in milliseconds.
 */
module.exports.mouseAction = mouseAction;

async function mouseAction(action, coordinates, options = {}) {
    validate();
    options = setNavigationOptions(options);
    if (headful)
        await overlay.highlightRect({ x: coordinates.x, y: coordinates.y, width: 1, height: 1, outlineColor: { r: 255, g: 0, b: 0 } });
    options = setOptions(options, coordinates.x, coordinates.y);
    await doActionAwaitingNavigation(options, async () => {
        if (action === 'press')
            options.type = 'mousePressed';
        else if (action === 'move')
            options.type = 'mouseMoved';
        else if (action === 'release')
            options.type = 'mouseReleased';
        await input.dispatchMouseEvent(options);
    });
    descEvent.emit('success', 'Performed mouse ' + action + 'action at {' + coordinates.x + ', ' + coordinates.y + '}');
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
    if (headful) await highlightElemOnAction(await element(selector));
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
        const res = await runtimeHandler.runtimeEvaluate(`(${scrollPage}).apply(null, ${JSON.stringify([e])})`);
        if (res.result.subtype == 'error') throw new Error(res.result.description);
        return { description: `Scrolled ${direction} the page by ${e} pixels` };
    }

    const nodeId = await element(e);
    if (headful) await highlightElemOnAction(nodeId);
    //TODO: Allow user to set options for scroll
    const options = setNavigationOptions({});
    await doActionAwaitingNavigation(options, async () => {
        const res = await runtimeHandler.runtimeCallFunctionOn(scrollElement, null, { nodeId: nodeId, arg: px });
        if (res.result.subtype == 'error') throw new Error(res.result.description);
    });
    descEvent.emit('success', 'Scrolled ' + direction + description(e, true) + 'by ' + px + ' pixels');
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
    return await scroll(e, px, px => window.scrollBy(px, 0),
        function sr(px) {
            if (this.tagName === 'IFRAME') {
                this.contentWindow.scroll(this.contentWindow.scrollX + px, this.contentWindow.scrollY);
                return true;
            }
            this.scrollLeft += px; return true;
        },
        'right');
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
    return await scroll(e, px, px => window.scrollBy(px * -1, 0),
        function sl(px) {
            if (this.tagName === 'IFRAME') {
                this.contentWindow.scroll(this.contentWindow.scrollX - px, this.contentWindow.scrollY);
                return true;
            }
            this.scrollLeft -= px; return true;
        },
        'left');
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
    return await scroll(e, px, px => window.scrollBy(0, px * -1),
        function su(px) {
            if (this.tagName === 'IFRAME') {
                this.contentWindow.scroll(this.contentWindow.scrollX, this.contentWindow.scrollY - px);
                return true;
            }
            this.scrollTop -= px; return true;
        },
        'up');
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
    return await scroll(e, px, px => window.scrollBy(0, px),
        function sd(px) {
            if (this.tagName === 'IFRAME') {
                this.contentWindow.scroll(this.contentWindow.scrollX, this.contentWindow.scrollY + px);
                return true;
            }
            this.scrollTop += px; return true;
        },
        'down');
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
    if (selector && !isSelector(selector)) options = selector;
    options.path = options.path || `Screenshot-${Date.now()}.png`;
    let screenShot;
    let clip;
    if (isSelector(selector)) {
        if (options.fullPage) console.warn('Ignoring fullPage screenshot as custom selector is found!');
        let padding = options.padding || 0;
        let elems = await elements(selector);
        const { x, y, width, height } = await domHandler.boundBox(elems[0]);
        clip = {
            x: x - padding,
            y: y - padding,
            width: width + padding * 2,
            height: height + padding * 2,
            scale: 1
        };
        screenShot = await page.captureScreenshot({ clip });
    } else if (options.fullPage) {
        const metrics = await page.getLayoutMetrics();
        const width = Math.ceil(metrics.contentSize.width);
        const height = Math.ceil(metrics.contentSize.height);
        clip = { x: 0, y: 0, width, height, scale: 1 };
        screenShot = await page.captureScreenshot({ clip });
    } else {
        screenShot = await page.captureScreenshot();
    }
    if (options.encoding === 'base64') return screenShot.data;
    fs.writeFileSync(options.path, Buffer.from(screenShot.data, 'base64'));
    descEvent.emit('success', 'Screenshot is created at ' + options.path);
};

/**
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
    let elems = await handleRelativeSearch(await elements(selector), args);
    let elemsLength = elems.length;
    let isElemAtPoint;
    for (let elem of elems) {
        isElemAtPoint = false;
        await scrollTo(elem);
        isElemAtPoint = await checkIfElementIsCovered(elem, elems, isElemAtPoint);
        if (isElemAtPoint) {
            const type = (await evaluate(elem, function getType() { return this.type; })).value;
            assertType(elem, () => type !== 'file', 'Unsupported operation, use `attach` on file input field');
            if (headful) await highlightElemOnAction(elem);
            const { x, y } = await domHandler.boundingBoxCenter(elem);
            options = setNavigationOptions(options);
            await doActionAwaitingNavigation(options, async () => {
                await inputHandler.tap(x, y);
            });
            break;
        }
    }
    if (!isElemAtPoint && elemsLength != elems.length)
        throw Error('Please provide a more specific selector, too many matches.');
    if (!isElemAtPoint)
        throw Error(description(selector) + ' is covered by other element');
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
 * @returns {ElementWrapper}
 */
module.exports.$ = (selector, ...args) => {
    validate();
    const get = async () => await handleRelativeSearch(await (selector.startsWith('//') || selector.startsWith('(') ? $$xpath(selector) : $$(selector)), args);
    return {
        get: getIfExists(get),
        exists: exists(getIfExists(get), descEvent),
        description: `Custom selector $(${selector})`,
        text: selectorText(get)
    };
};

const getValues = (attrValuePairs, args) => {

    if (attrValuePairs instanceof RelativeSearchElement) {
        args = [attrValuePairs].concat(args);
        return { args: args };
    }

    if (isString(attrValuePairs) || isSelector(attrValuePairs)) {
        return { label: attrValuePairs, args: args };
    }

    return { attrValuePairs: attrValuePairs, args: args };
};

const getQuery = (attrValuePairs, tag = '') => {
    let path = tag;
    for (const key in attrValuePairs) {
        if (key === 'class') path += `[contains(@${key}, ${xpath(attrValuePairs[key])})]`;
        else path += `[@${key} = ${xpath(attrValuePairs[key])}]`;
    }
    return path;
};


const getElementGetter = (selector, query, tag) => {
    let get;
    if (selector.attrValuePairs) get = async () => await handleRelativeSearch(await $$xpath(getQuery(selector.attrValuePairs, tag)), selector.args);
    else if (selector.label) get = async () => await handleRelativeSearch(await query(), selector.args);
    else get = async () => await handleRelativeSearch(await $$xpath(tag), selector.args);
    return get;
};

const desc = (selector, query, tag) => {
    let description = '';
    if (selector.attrValuePairs) description = getQuery(selector.attrValuePairs, tag);
    else if (selector.label) description = `${tag} with ${query} ${selector.label} `;

    for (const arg of selector.args) {
        description += description === '' ? tag : ' and';
        description += ' ' + arg.toString();
    }

    return description;
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
 * @returns {ElementWrapper}
 */
module.exports.image = (attrValuePairs, ...args) => {
    validate();
    const selector = getValues(attrValuePairs, args);
    const get = getElementGetter(selector, async () => await $$xpath(`//img[contains(@alt, ${xpath(selector.label)})]`), '//img');
    return { get: getIfExists(get), exists: exists(getIfExists(get), descEvent), description: desc(selector, 'alt', 'Image'), text: selectorText(get) };
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
 * @returns {ElementWrapper}
 */
module.exports.link = (attrValuePairs, ...args) => {
    validate();
    const selector = getValues(attrValuePairs, args);
    const get = getElementGetter(selector, async () => await match(selector.label).get('a',0,0), '//a');
    return { get: getIfExists(get), exists: exists(getIfExists(get), descEvent), description: desc(selector, 'text', 'Link'), text: selectorText(get) };
};

/**
 * This {@link selector} lets you identify a list item (HTML <li> element) on a web page with label or attribute and value pairs and proximity selectors.
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
 * @returns {ElementWrapper}
 */
module.exports.listItem = (attrValuePairs, ...args) => {
    validate();
    const selector = getValues(attrValuePairs, args);
    const get = getElementGetter(selector, async () => await match(selector.label).get('li',0,0), '//li');
    return { get: getIfExists(get), exists: exists(getIfExists(get), descEvent), description: desc(selector, 'label', 'List item'), text: selectorText(get) };
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
 * @returns {ElementWrapper}
 */
module.exports.button = (attrValuePairs, ...args) => {
    validate();
    let get;
    const selector = getValues(attrValuePairs, args);
    if (!selector.attrValuePairs && !selector.label) get = async () => await handleRelativeSearch(await $$xpath('//input[@type="submit" or @type="reset" or @type="button"] | //button'), selector.args);
    else {
        const getByButton = getElementGetter(selector, async () => match(selector.label).get('button',0,0), '//button');

        const getByInput = getElementGetter(selector,
            async () => await $$xpath(`//input[@type='submit' or @type='reset' or @type='button'][@id=(//label[contains(string(), ${xpath(selector.label)})]/@for)] | //label[contains(string(), ${xpath(selector.label)})]/input[@type='submit' or @type='reset' or @type='button'] | //input[contains(@value, ${xpath(selector.label)})]`),
            '//input[@type="submit" or @type="reset" or @type="button"]');
        get = async () => {
            const input = await getByInput();
            if (input.length) return input;
            return getByButton();
        };
    }
    return { get: getIfExists(get), exists: exists(getIfExists(get), descEvent), description: desc(selector, 'label', 'Button'), text: selectorText(get) };
};
/**
 * This {@link selector} lets you identify an input field on a web page with label or attribute and value pairs and proximity selectors.
 *
 * @deprecated use textBox for input with type text and password, textarea and contenteditable fields.
 * @example
 * await focus(inputField({'id':'name'})
 * await inputField({'id': 'name'}).exists()
 * await inputField({id:'inputFieldId'},below('text')).exists()
 * await inputField(below('text')).exists()
 *
 * @param {Object} attrValuePairs - Pairs of attribute and value like {"id":"name","class":"class-name"}
 * @param {...relativeSelector} args - Proximity selectors
 * @returns {ElementWrapper}
 */
module.exports.inputField = (attrValuePairs, ...args) => {
    console.warn('DEPRECATION WARNING: inputField is deprecated, use textBox api instead');
    validate();
    const selector = getValues(attrValuePairs, args);
    const getInputField = getElementGetter(selector,
        async () => await $$xpath(`//input[@id=(//label[contains(string(), ${xpath(selector.label)})]/@for)] | //label[contains(string(), ${xpath(selector.label)})]/input`), '//input');
    const getContentEditable = getElementGetter(selector, async () => await $$xpath('//*[@contenteditable]'), '//*[@contenteditable]');
    let get = async () => {
        const elems = await getInputField();
        if (elems.length) return elems;
        return await getContentEditable();
    };

    return {
        get: getIfExists(get),
        exists: exists(getIfExists(get), descEvent),
        description: desc(selector, 'label', 'Input field'),
        value: async () => {
            const nodeId = (await getIfExists(get)())[0];
            if (!nodeId) throw `${desc(selector, 'label', 'Input field')} not found`;
            return (await evaluate(nodeId, function getvalue() { return this.value; })).value;
        },
        text: selectorText(get)
    };
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
 * @returns {ElementWrapper}
 */
module.exports.fileField = fileField;

function fileField(attrValuePairs, ...args) {
    validate();
    const selector = getValues(attrValuePairs, args);
    const get = getElementGetter(selector,
        async () => await $$xpath(`//input[@type='file'][@id=(//label[contains(string(), ${xpath(selector.label)})]/@for)] | //label[contains(string(), ${xpath(selector.label)})]/input[@type='file']`),
        '//input[@type="file"]');
    return {
        get: getIfExists(get),
        exists: exists(getIfExists(get), descEvent),
        value: async () => {
            const nodeId = (await getIfExists(get)())[0];
            if (!nodeId) throw `${desc(selector, 'label', 'File field')} not found`;
            return (await evaluate(nodeId, function getvalue() { return this.value; })).value;
        },
        description: desc(selector, 'label', 'File field'),
        text: selectorText(get)
    };
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
 * @returns {ElementWrapper}
 */
module.exports.textBox = textBox;

function textBox(attrValuePairs, ...args) {
    validate();
    const selector = getValues(attrValuePairs, args);
    let get;
    const inputTypesExp = 'input[@type="text" or @type="password" or @type="search" or @type="number" or @type="email" or @type="tel" or @type="url"]';
    if (!selector.attrValuePairs && !selector.label) get = async () => await handleRelativeSearch(await $$xpath(`//${inputTypesExp} | //textarea | //*[@contenteditable]`), selector.args);
    else {
        const getInputText = getElementGetter(selector,
            async () => await $$xpath(`//${inputTypesExp}[@id=(//label[contains(string(), ${xpath(selector.label)})]/@for)] | \
            //label[contains(string(), ${xpath(selector.label)})]/${inputTypesExp} | \
            //${inputTypesExp}[following-sibling::text()[position() = 1 and contains(., ${xpath(selector.label)})]]`),
            `//${inputTypesExp}`);
        const getTextArea = getElementGetter(selector,
            async () => await $$xpath(`//textarea[@id=(//label[contains(string(), ${xpath(selector.label)})]/@for)] | \
            //label[contains(string(), ${xpath(selector.label)})]/textarea`),
            '//textarea');
        const getContentEditable = getElementGetter(selector,
            async () => await $$xpath(`//*[@contenteditable][@id=(//label[contains(string(), ${xpath(selector.label)})]/@for)] | \
             //label[contains(string(), ${xpath(selector.label)})]/*[@contenteditable]`),
            '//*[@contenteditable]');
        get = async () => {
            let elems = await getInputText();
            elems = elems.concat(await getTextArea());
            elems = elems.concat(await getContentEditable());
            return elems;
        };
    }
    return {
        get: getIfExists(get),
        exists: exists(getIfExists(get), descEvent),
        description: desc(selector, 'label', 'Text field'),
        value: async () => {
            const nodeId = (await getIfExists(get)())[0];
            if (!nodeId) throw `${desc(selector, 'label', 'Text field')} not found`;
            return (await evaluate(nodeId, function getValue() { if (this.value) return this.value; return this.innerText; })).value;
        },
        text: selectorText(get)
    };
}

/**
 * This {@link selector} lets you identify a text field on a web page either with label or with attribute and value pairs and proximity selectors.
 *
 * @deprecated use textBox to select inputField with type text and textarea.
 *
 * @example
 * await focus(textField('Username:'))
 * await textField('Username:').exists()
 * await textField({id:'textFieldId'},below('text')).exists()
 * await textField(below('text')).exists()
 *
 * @param {Object} attrValuePairs - Pairs of attribute and value like {"id":"name","class":"class-name"}
 * @param {string} label - The label (human-visible name) of the text field.
 * @param {...relativeSelector} args - Proximity selectors
 * @returns {ElementWrapper}
 */
module.exports.textField = textField;

function textField(attrValuePairs, ...args) {
    validate();
    console.warn('DEPRECATION WARNING: textField is deprecated. Use textBox to select inputField with type text and textarea instead.');
    const selector = getValues(attrValuePairs, args);
    const get = getElementGetter(selector,
        async () => await $$xpath(`//input[@type='text'][@id=(//label[contains(string(), ${xpath(selector.label)})]/@for)] | //label[contains(string(), ${xpath(selector.label)})]/input[@type='text']`),
        '//input[@type="text"]');
    return {
        get: getIfExists(get),
        exists: exists(getIfExists(get), descEvent),
        description: desc(selector, 'label', 'Text field'),
        value: async () => {
            const nodeId = (await getIfExists(get)())[0];
            if (!nodeId) throw `${desc(selector, 'label', 'Text field')} not found`;
            return (await evaluate(nodeId, function getvalue() { return this.value; })).value;
        },
        text: selectorText(get)
    };
}

/**
 * This {@link selector} lets you identify a comboBox on a web page either with label or with attribute and value pairs and proximity selectors.
 * Any value can be selected using value or text of the options.
 *
 * @deprecated Use dropDown API to identify a dropDown on a web page either with label or with attribute and value pairs.

 * @example
 * await comboBox('Vehicle:').select('Car')
 * await comboBox('Vehicle:').value()
 * await comboBox('Vehicle:').exists()
 * await comboBox({id:'comboBoxId'},below('text')).exists()
 * await comboBox(below('text')).exists()
 *
 * @param {object} attrValuePairs - Pairs of attribute and value like {"id":"name","class":"class-name"}
 * @param {string} label - The label (human-visible name) of the combo box.
 * @param {...relativeSelector} args - Proximity selectors
 * @returns {ElementWrapper}
 */
module.exports.comboBox = (attrValuePairs, ...args) => {
    console.warn('DEPRECATION WARNING: comboBox is deprecated, use dropDown to select from the options using value or text.');
    return dropDown(attrValuePairs, ...args);
};

/**
 * This {@link selector} lets you identify a dropDown on a web page either with label or with attribute and value pairs and proximity selectors.
 * Any value can be selected using value or text of the options.
 *
 * @example
 * await dropDown('Vehicle:').select('Car')
 * await dropDown('Vehicle:').value()
 * await dropDown('Vehicle:').exists()
 * await dropDown({id:'dropDownId'},below('text')).exists()
 * await dropDown(below('text')).exists()
 *
 * @param {object} attrValuePairs - Pairs of attribute and value like {"id":"name","class":"class-name"}
 * @param {string} label - The label (human-visible name) of the drop down.
 * @param {...relativeSelector} args - Proximity selectors
 * @returns {ElementWrapper}
 */
module.exports.dropDown = dropDown;

function dropDown(attrValuePairs, ...args) {
    validate();
    const selector = getValues(attrValuePairs, args);
    const get = getElementGetter(selector,
        async () => await $$xpath(`//select[@id=(//label[contains(string(), ${xpath(selector.label)})]/@for)] | //label[contains(string(), ${xpath(selector.label)})]/select`),
        '//select');
    return {
        get: getIfExists(get),
        exists: exists(getIfExists(get), descEvent),
        description: desc(selector, 'label', 'Dropdown'),
        select: async (value) => {

            const nodeId = (await getIfExists(get)())[0];
            if (!nodeId) throw `${desc(selector, 'label', 'DropDown')} not found`;
            if (headful) await highlightElemOnAction(nodeId);

            function selectBox(value) {
                let found_value = false;
                for (var i = 0; i < this.options.length; i++) {
                    if (this.options[i].text === value || this.options[i].value === value) {
                        this.selectedIndex = i;
                        found_value = true;
                        let event = new Event('change');
                        this.dispatchEvent(event);
                        break;
                    }
                }
                return found_value;
            }
            const options = setNavigationOptions({});
            await doActionAwaitingNavigation(options, async () => {
                const result = await runtimeHandler.runtimeCallFunctionOn(selectBox, null, { nodeId: nodeId, arg: value });
                if (!result.result.value) throw new Error('Option not available in drop down');
            });
            descEvent.emit('success', 'Selected ' + value);
        },
        value: async () => {
            const nodeId = (await getIfExists(get)())[0];
            if (!nodeId) throw `${desc(selector, 'label', 'Dropdown')} not found`;
            return (await evaluate(nodeId, function getvalue() { return this.value; })).value;
        },
        text: selectorText(get)
    };
}

function setChecked(value) {
    this.checked = value;
    let event = new Event('click');
    this.dispatchEvent(event);
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
 * @returns {ElementWrapper}
 */
module.exports.checkBox = (attrValuePairs, ...args) => {
    validate();
    const selector = getValues(attrValuePairs, args);
    const get = getElementGetter(selector,
        async () => await $$xpath(`//input[@type='checkbox'][@id=(//label[contains(string(), ${xpath(selector.label)})]/@for)] | //label[contains(string(), ${xpath(selector.label)})]/input[@type='checkbox'] | //input[@type='checkbox'][following-sibling::text()[position() = 1 and contains(., ${xpath(selector.label)})]]`),
        '//input[@type="checkbox"]');
    return {
        get: getIfExists(get),
        exists: exists(getIfExists(get), descEvent),
        description: desc(selector, 'label', 'Checkbox'),
        isChecked: async () => {
            const nodeId = (await getIfExists(get)())[0];
            if (!nodeId) throw `${desc(selector, 'label', 'Checkbox')} not found`;
            var val = (await evaluate(nodeId, function getvalue() { return this.checked; })).value;
            var description = val ? desc(selector, 'label', 'Checkbox') + 'is checked' : desc(selector, 'label', 'Checkbox') + 'is not checked';
            descEvent.emit('success', description);
            return val;
        },
        check: async () => {
            const options = setNavigationOptions({});
            await doActionAwaitingNavigation(options, async () => {
                const nodeId = (await getIfExists(get)())[0];
                if (!nodeId) throw `${desc(selector, 'label', 'Checkbox')} not found`;
                if (headful) await highlightElemOnAction(nodeId);
                await runtimeHandler.runtimeCallFunctionOn(setChecked, null, { nodeId: nodeId, arg: true });
                descEvent.emit('success', desc(selector, 'label', 'Checkbox') + 'is checked');
            });
        },
        uncheck: async () => {
            const options = setNavigationOptions({});
            await doActionAwaitingNavigation(options, async () => {
                const nodeId = (await getIfExists(get)())[0];
                if (!nodeId) throw `${desc(selector, 'label', 'Checkbox')} not found`;
                if (headful) await highlightElemOnAction(nodeId);
                await runtimeHandler.runtimeCallFunctionOn(setChecked, null, { nodeId: nodeId, arg: false });
                descEvent.emit('success', desc(selector, 'label', 'Checkbox') + 'is unchecked');
            });
        },
        text: selectorText(get)
    };
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
 * @returns {ElementWrapper}
 */
module.exports.radioButton = (attrValuePairs, ...args) => {
    validate();
    const selector = getValues(attrValuePairs, args);
    const get = getElementGetter(selector,
        async () => await $$xpath(`//input[@type='radio'][@id=(//label[contains(string(), ${xpath(selector.label)})]/@for)] | //label[contains(string(), ${xpath(selector.label)})]/input[@type='radio'] | //input[@type='radio'][following-sibling::text()[position() = 1 and contains(., ${xpath(selector.label)})]]`),
        '//input[@type="radio"]');
    return {
        get: getIfExists(get),
        exists: exists(getIfExists(get), descEvent),
        description: desc(selector, 'label', 'Radio button'),
        isSelected: async () => {
            const nodeId = (await getIfExists(get)())[0];
            if (!nodeId) throw `${desc(selector, 'label', 'Radio button')} not found`;
            var val = (await evaluate(nodeId, function getvalue() { return this.checked; })).value;
            var description = val ? desc(selector, 'label', 'Radio button') + 'is selected.' : desc(selector, 'label', 'Radio button') + 'is not selected.';
            descEvent.emit('success', description);
            return val;
        },
        select: async () => {
            const options = setNavigationOptions({});
            await doActionAwaitingNavigation(options, async () => {
                const nodeId = (await getIfExists(get)())[0];
                if (!nodeId) throw `${desc(selector, 'label', 'Radio button')} not found`;
                if (headful) await highlightElemOnAction(nodeId);
                await runtimeHandler.runtimeCallFunctionOn(setChecked, null, { nodeId: nodeId, arg: true });
                descEvent.emit('success', desc(selector, 'label', 'Radio button') + 'is selected');
            });
        },
        deselect: async () => {
            const options = setNavigationOptions({});
            await doActionAwaitingNavigation(options, async () => {
                const nodeId = (await getIfExists(get)())[0];
                if (!nodeId) throw `${desc(selector, 'label', 'Radio button')} not found`;
                if (headful) await highlightElemOnAction(nodeId);
                await runtimeHandler.runtimeCallFunctionOn(setChecked, null, { nodeId: nodeId, arg: false });
                descEvent.emit('success', desc(selector, 'label', 'Radio button') + 'is deselected');
            });
        },
        text: selectorText(get)
    };
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
 * @returns {ElementWrapper}
 */
module.exports.text = text;
function text(text, ...args){
    validate();
    const get = async () => await handleRelativeSearch(await match(text).get('*',0,0), args);
    return { get: getIfExists(get), exists: exists(getIfExists(get), descEvent), description: `Element with text "${text}"`, text: selectorText(get) };
}

/**
 * This {@link selector} lets you identify an element containing the text.
 *
 * @deprecated use text search instead. text search now does contains if exact text is not found.
 *
 * @example
 * await contains('Vehicle').exists()
 *
 * @param {string} text - Text to match.
 * @param {...relativeSelector} args - Proximity selectors
 * @returns {ElementWrapper}
 */
module.exports.contains = contains;

function contains(text, ...args) {
    // TODO This message needs some rewording
    console.warn('DEPRECATION WARNING: contains is deprecated as text search now does contain if exact text is not found.');
    validate();
    assertType(text);
    const get = async (e = '*') => {
        let elements = await $$xpath('//' + e + `[contains(@value, ${xpath(text)})]`);
        if (!elements || !elements.length) elements = await $$xpath('//' + e + `[not(descendant::*[contains(translate(normalize-space(.),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'), ${xpath(text.toLowerCase())})]) and contains(translate(normalize-space(.),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'), ${xpath(text.toLowerCase())})]`);
        return await handleRelativeSearch(elements, args);
    };
    return { get: getIfExists(get), exists: exists(getIfExists(get), descEvent), description: `Element containing text "${text}"`, text: selectorText(get) };
}

function match(text, ...args) {
    validate();
    assertType(text);
    const get = async (e = '*') => {
        let elements;
        let nbspChar = String.fromCharCode(160);
        let textToTranslate = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' + nbspChar;
        let translateTo = 'abcdefghijklmnopqrstuvwxyz' + ' ';
        let xpathText = `translate(normalize-space(${xpath(text)}), "${textToTranslate}", "${translateTo}")`;
        elements = await matchExactElements(e, textToTranslate, translateTo, xpathText);
        if (!elements || !elements.length) elements = await matchContainsElements(e, textToTranslate, translateTo, xpathText);
        return await handleRelativeSearch(elements, args);
    };
    return { get: getIfExists(get), exists: exists(getIfExists(get), descEvent), description: `Element matching text "${text}"`, text: selectorText(get) };
}

async function matchExactElements(e, textToTranslate, translateTo, xpathText) {
    let elements = [];
    if (e === '*') elements = await matchTextNode(textToTranslate, translateTo, xpathText);
    let valueAndTypeElements = await matchValueOrType(e, textToTranslate, translateTo, xpathText);
    if (valueAndTypeElements.length) elements = elements.concat(valueAndTypeElements);
    if (!elements || !elements.length) elements = await matchTextAcrossElements(e, textToTranslate, translateTo, xpathText);
    return elements;
}

async function matchContainsElements(e, textToTranslate, translateTo, xpathText) {
    let elements;
    if (e === '*') elements = await containsTextNode(textToTranslate, translateTo, xpathText);
    let valueAndTypeElements = await containsValueOrType(e, textToTranslate, translateTo, xpathText);
    if (valueAndTypeElements.length) elements = elements.concat(valueAndTypeElements);
    if (!elements || !elements.length) elements = await containsTextAcrossElements(e, textToTranslate, translateTo, xpathText);
    return elements;
}


async function matchTextNode(textToTranslate, translateTo, xpathText) {
    return await $$xpath(`//text()[translate(normalize-space(string()), "${textToTranslate}", "${translateTo}")=${xpathText}]`);
}

async function containsTextNode(textToTranslate, translateTo, xpathText) {
    return await $$xpath(`//text()[contains(translate(normalize-space(string()), "${textToTranslate}", "${translateTo}"), ${xpathText})]`);
}

async function matchValueOrType(e, textToTranslate, translateTo, xpathText) {
    return await $$xpath('//' + e + `[translate(normalize-space(@value), "${textToTranslate}", "${translateTo}")=${xpathText} or translate(normalize-space(@type), "${textToTranslate}", "${translateTo}")=${xpathText}]`);
}

async function containsValueOrType(e, textToTranslate, translateTo, xpathText) {
    return await $$xpath('//' + e + `[contains(translate(normalize-space(@value), "${textToTranslate}", "${translateTo}"), ${xpathText}) or contains(translate(normalize-space(@type), "${textToTranslate}", "${translateTo}"), ${xpathText})]`);
}

async function matchTextAcrossElements(e, textToTranslate, translateTo, xpathText) {
    const xpathToTranslateInnerText = `translate(normalize-space(.), "${textToTranslate}", "${translateTo}")`;
    return await $$xpath('//' + e + `[not(descendant::*[${xpathToTranslateInnerText}=${xpathText}]) and ${xpathToTranslateInnerText}=${xpathText}]`);
}

async function containsTextAcrossElements(e, textToTranslate, translateTo, xpathText) {
    return await $$xpath('//' + e + `[not(descendant::*[contains(translate(normalize-space(.), '${textToTranslate}', '${translateTo}'), ${xpathText})]) and contains(translate(normalize-space(.), '${textToTranslate}', '${translateTo}'), ${xpathText})]`);
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
    return new RelativeSearchElement(async (e, v) => {
        const rect = await domHandler.getBoundingClientRect(e);
        return rect.right <= v;
    }, rectangle(selector, r => r.left), isString(selector) ? `To left of ${selector}` : `To left of ${selector.description}`);
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
    const desc = isString(selector) ? `To right of ${selector}` : `To right of ${selector.description}`;
    return new RelativeSearchElement(async (e, v) => {
        const rect = await domHandler.getBoundingClientRect(e);
        return rect.left >= v;
    }, value, desc);
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
    return new RelativeSearchElement(async (e, v) => {
        const rect = await domHandler.getBoundingClientRect(e);
        return rect.bottom <= v;
    }, value, desc);
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
    return new RelativeSearchElement(async (e, v) => {
        const rect = await domHandler.getBoundingClientRect(e);
        return rect.top >= v;
    }, value, desc);
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
module.exports.near = (selector, opts = {offset:30}) => {
    validate();
    const desc = isString(selector) ? `Near ${selector}` : `Near ${selector.description}`;
    const value = rectangle(selector, r => r);
    const nearOffset = opts.offset;
    return new RelativeSearchElement(async (e, v) => {
        const rect = await domHandler.getBoundingClientRect(e);
        return [rect.bottom, rect.top].some((offSet) => offSet > (v.top - nearOffset) && offSet < (v.bottom + nearOffset)) &&
            [rect.left, rect.right].some((offSet) => offSet > (v.left - nearOffset) && offSet < (v.right + nearOffset));

    }, value, desc);
};

/**
 * Lets you perform an operation when an `alert` with given text is shown.
 * Note : `alert` listener has to be added before it is triggered.
 *
 * @example
 * alert('Message', async () => await accept())
 * alert('Message', async () => await dismiss())
 *
 * @param {string} message - Identify alert based on this message.
 * @param {function} callback - Action to perform. Accept/Dismiss.
 */
module.exports.alert = (message, callback) => dialog('alert', message, callback);

/**
 * Lets you perform an operation when a `prompt` with given text is shown.
 * Note : `prompt` listener has to be added before it is triggered.
 * Write something in `prompt` with `accept('Something')`.
 *
 * @example
 * prompt('Message', async () => await accept('Something'))
 * prompt('Message', async () => await dismiss())
 *
 * @param {string} message - Identify prompt based on this message.
 * @param {function} callback - Action to perform. Accept/Dismiss.
 */
module.exports.prompt = (message, callback) => dialog('prompt', message, callback);

/**
 * Lets you perform an operation when a `confirm` with given text is shown.
 * Note : `confirm` listener has to be added before it is triggered.
 *
 * @example
 * confirm('Message', async () => await accept())
 * confirm('Message', async () => await dismiss())
 *
 * @param {string} message - Identify confirm based on this message.
 * @param {function} callback - Action to perform. Accept/Dismiss.
 */
module.exports.confirm = (message, callback) => dialog('confirm', message, callback);

/**
 * Lets you perform an operation when a `beforeunload` with given text is shown.
 * Note : `beforeunload` listener has to be added before it is triggered.
 *
 * @example
 * beforeunload('Message', async () => await accept())
 * beforeunload('Message', async () => await dismiss())
 *
 * @param {string} message - Identify beforeunload based on this message.
 * @param {function} callback - Action to perform. Accept/Dismiss.
 */
module.exports.beforeunload = (message, callback) => dialog('beforeunload', message, callback);

/**
 * Evaluates script on element matching the given selector.
 *
 * @example
 * await evaluate(link("something"), (element) => element.style.backgroundColor)
 *
 * await evaluate((document)=>{return document.title})
 *
 * await evaluate(link("something"), (element, args) => {
 *      element.style.backgroundColor = args[1].backgroundColor;
 *      element.querySelector(args[0]).innerText = 'Some thing';
 * }, { args: [ '.main-content', {backgroundColor:'red'}]})
 *
 * @param {selector|string} selector - Web element selector.
 * @param {function} callback - callback method to execute on the element or root HTML element when selector is not provided.
 * NOTE : In callback, we can access only inline css not the one which are define in css files.
 * @param {Object} options - options.
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the click. Default navigation timeout is 15 seconds, to override pass `{ navigationTimeout: 10000 }` in `options` parameter.
 * @param {number} [options.waitForStart=100] - wait for navigation to start. Accepts value in milliseconds
 * @param {number} [options.timeout=5000] - DEPRECATED timeout option, use navigationTimeout instead.
 * @param {number} [options.navigationTimeout=5000] - Navigation timeout value in milliseconds for navigation after click.
 * @param {Array} options.args - Arguments to be passed to the provided callback.
 * @param {string[]} [options.waitForEvents = ['firstMeaningfulPaint']] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']]
 * @returns {Promise<Object>} Object with return value of callback given
 */
module.exports.evaluate = async (selector, callback, options = {}) => {
    validate();
    let result;
    if (isFunction(selector)) {
        options = callback || options;
        callback = selector;
        selector = (await $$xpath('//*'))[0];
    }
    const nodeId = isNaN(selector) ? await element(selector) : selector;
    if (headful) await highlightElemOnAction(nodeId);

    async function evalFunc({ callback, args }) {
        let fn;
        eval(`fn = ${callback}`);
        return await fn(this, args);
    }

    options = setNavigationOptions(options);
    await doActionAwaitingNavigation(options, async () => {
        result = await runtimeHandler.runtimeCallFunctionOn(evalFunc, null,
            { nodeId: nodeId, arg: { callback: callback.toString(), args: options.args }, returnByValue: true });
    });
    descEvent.emit('success', 'Evaluated given script. Result:' + result.result.value);
    return { result: result.result.value };
};

/**
 * Converts seconds to milliseconds.
 * @deprecated Use milliSeconds for time..
 *
 * @example
 * link('Plugins').exists(intervalSecs(1))
 *
 * @param {number} secs - Seconds to convert.
 * @return {number} - Milliseconds.
 */
module.exports.intervalSecs = (secs) => {
    console.warn('DEPRECATION WARNING: intervalSecs is deprecated, use milliSeconds for time.');
    return secs * 1000;
};

/**
 * Converts seconds to milliseconds.
 * @deprecated Use milliSeconds for time..
 *
 * @example
 * link('Plugins').exists(timeoutSecs(10))
 *
 * @param {number} secs - Seconds to convert.
 * @return {number} - Milliseconds.
 */
module.exports.timeoutSecs = (secs) => {
    console.warn('DEPRECATION WARNING: timeoutSecs is deprecated, use milliSeconds for time.');
    return secs * 1000;
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
 * This function is used to wait for number of secs given or a given element or a given condition.
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

const waitFor = async(element, time) => {
    validate();
    let timeout =  time || config.retryTimeout;
    if(!element || isFinite(element)) {
        time = element;
        return wait(time);
    } else if (isString(element)){
        let foundElements = await match(element).get(undefined, config.retryInterval, timeout);
        if(!foundElements.length) throw new Error(`Waiting Failed: Element '${element}' not found within ${timeout} ms`);
    } else if(isSelector(element)){
        let foundElements = await element.get(undefined, config.retryInterval, timeout);
        if(!foundElements.length) throw new Error(`Waiting Failed: Element '${element}' not found within ${timeout} ms`);
    } else {
        await waitUntil(element, config.retryInterval, timeout);
    }
};

module.exports.waitFor = waitFor;

/**
 * Action to be perform on dialogs
 *
 * @example
 * prompt('Message', async () => await accept('Something'))
 */
module.exports.accept = async (text = '') => {
    await page.handleJavaScriptDialog({
        accept: true,
        promptText: text
    });
    descEvent.emit('success', 'Accepted dialog');
};

/**
 * Action to be perform on dialogs
 *
 * @example
 * prompt('Message', async () => await dismiss())
 */
module.exports.dismiss = async () => {
    await page.handleJavaScriptDialog({
        accept: false
    });
    descEvent.emit('success', 'Dismissed dialog');
};

/**
 * This function is used by taiko to initiate the plugin.
 *
 * @deprecated Going forward Taiko will be dynamically loading plugins and allow plugins to override Taiko APIs. For more details refer to this <a href="https://github.com/getgauge/taiko/issues/562">issue</a> on GitHub.
 *
 * @example
 * import {loadPlugin} from 'taiko';
 * import {ID, pluginHandler} from 'taiko-plugin';
 * loadPlugin(IDm pluginHandler);
 *
 * @param {string} ID - unique id or name of the plugin
 * @param {Function} clientHandler - DEPRICATED use init method instead
 * @param {Function} init - callback method to set taiko instance for plugin
 */


const loadPlugin = (id, init) => {
    try {
        if (!plugins.has(id)) {
            if(!xhrEventProxy) {
                xhrEventProxy = getEventProxy(xhrEvent);
            }
            init(module.exports, xhrEventProxy, descEvent);
            plugins.set(id, init);
        }
    } catch (error) {
        console.trace(error);
    }
};

module.exports.loadPlugin = loadPlugin;


const overriddenAPIs = {};
getPlugins().forEach((pluginName) => {
    let pluginPath = path.resolve(`node_modules/${pluginName}`);
    const globalPath = childProcess.spawnSync('npm', ['root', '-g'], {shell:true}).stdout.toString().slice(0, -1);
    if (!fs.existsSync(pluginPath)) pluginPath = path.resolve(globalPath, pluginName);
    let plugin = require(pluginPath);
    plugin.ID = pluginName.split('-').slice(1);
    loadPlugin(plugin.ID, plugin.init);
    module.exports[plugin.ID] = plugin;
    for (var api in plugin) {
        const isApiOverridden = overriddenAPIs.hasOwnProperty(api);
        if (!isApiOverridden && module.exports.hasOwnProperty(api)) {
            module.exports[api] = plugin[api];
            overriddenAPIs[api] = pluginName;
        } else if (isApiOverridden) {
            throw new Error(`${pluginName} cannot override ${api} API as it has already been overridden by ${overriddenAPIs[api]}`);
        }
    }
});

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
 * @param {number} [options.retryInterval = 1000 ] Option to modify delay time in milliseconds to retry the search of element existance.
 * @param {number} [options.retryTimeout = 10000 ] Option to modify timeout in milliseconds while retrying the search of element existance.
 * @param {boolean} [options.waitForNavigation = true ] Wait for navigation after performing <a href="#goto">goto</a>, <a href="#click">click</a>,
 * <a href="#doubleclick">doubleClick</a>, <a href="#rightclick">rightClick</a>, <a href="#write">write</a>, <a href="#clear">clear</a>,
 * <a href="#press">press</a> and <a href="#evaluate">evaluate</a>.
 */
module.exports.setConfig = setConfig;

const doActionAwaitingNavigation = async (options, action) => {
    options.waitForNavigation = determineWaitForNavigation(options.waitForNavigation);
    if (!options.waitForNavigation) {
        return action();
    }
    let promises = [];
    let listenerCallbackMap = {};
    options.navigationTimeout = options.navigationTimeout || options.timeout || config.navigationTimeout;
    if (options.waitForEvents) {
        options.waitForEvents.forEach((event) => {
            promises.push(new Promise((resolve) => {
                xhrEvent.addListener(event, resolve);
                listenerCallbackMap[event] = resolve;
            }));
        });
    } else {
        if (options.isPageNavigationAction) {
            promises.push(new Promise((resolve) => {
                xhrEvent.addListener('loadEventFired', resolve);
                listenerCallbackMap['loadEventFired'] = resolve;
            }));
        }
        let func = addPromiseToWait(promises);
        listenerCallbackMap['xhrEvent'] =  func;
        listenerCallbackMap['frameEvent'] = func;
        listenerCallbackMap['frameNavigationEvent'] = func;
        xhrEvent.addListener('xhrEvent', func);
        xhrEvent.addListener('frameEvent', func);
        xhrEvent.addListener('frameNavigationEvent', func);
        const waitForTargetCreated = () => {
            promises = [
                new Promise((resolve) => {
                    xhrEvent.addListener('targetNavigated', resolve);
                    listenerCallbackMap['targetNavigated'] = resolve;
                }),
                new Promise((resolve) => {
                    xhrEvent.addListener('loadEventFired', resolve);
                    listenerCallbackMap['loadEventFired'] = resolve;
                })
            ];
        };
        xhrEvent.once('targetCreated', waitForTargetCreated);
        listenerCallbackMap['targetCreated'] = waitForTargetCreated;
        const waitForReconnection = () => {
            promises = [
                new Promise((resolve) => {
                    xhrEvent.addListener('reconnected', resolve);
                    listenerCallbackMap['reconnected'] = resolve;
                })
            ];
        };
        xhrEvent.once('reconnecting', waitForReconnection);
        listenerCallbackMap['reconnecting'] = waitForReconnection;
    }
    await action();
    await waitForPromises(promises, options.waitForStart);
    await waitForNavigation(options.navigationTimeout, promises).catch(handleTimeout(options.navigationTimeout, listenerCallbackMap));
    for (var listener in listenerCallbackMap) {
        xhrEvent.removeListener(listener, listenerCallbackMap[listener]);
    }
};

const waitForPromises = (promises, waitForStart) => {
    return Promise.race([waitFor(waitForStart), new Promise(function waitForPromise(resolve) {
        if (promises.length) {
            const timeoutId = setTimeout(resolve, 100);
            timeouts.push(timeoutId);
        } else {
            const timeoutId = setTimeout(() => { waitForPromise(resolve); }, waitForStart / 5);
            timeouts.push(timeoutId);
        }
    })]);
};

const addPromiseToWait = (promises) => {
    return (promise) => {
        promises.push(promise);
    };
};

const handleTimeout = (timeout, listenerCallbackMap) => {
    return (e) => {
        for (var listener in listenerCallbackMap) {
            xhrEvent.removeListener(listener, listenerCallbackMap[listener]);
        }
        if (e === 'Timedout')
            throw new Error(`Navigation took more than ${timeout}ms. Please increase the timeout.`);
    };
};

const highlightElemOnAction = async (elem) => {
    if (highlightOnAction.toLowerCase() === 'true') {
        const result = await domHandler.getBoxModel(elem);
        await overlay.highlightQuad({ quad: result.model.border, outlineColor: { r: 255, g: 0, b: 0 } });
        await waitFor(1000);
        await overlay.hideHighlight();
    }
};

const element = async (selector, tag) => (await elements(selector, tag))[0];

const elements = async (selector, tag) => {
    const elements = await (() => {
        if (isString(selector)) {
            return match(selector).get(tag);
        } else if (isSelector(selector)) {
            return selector.get(tag);
        }
        return null;
    })();
    if (!elements || !elements.length) {
        const error = isString(selector) ? `Element with text ${selector} not found` :
            `${selector.description} not found`;
        throw new Error(error);
    }
    return elements;
};

const description = (selector, lowerCase = false) => {
    const d = (() => {
        if (isString(selector)) return match(selector).description;
        else if (isSelector(selector)) return selector.description;
        return '';
    })();
    return lowerCase ? d.charAt(0).toLowerCase() + d.slice(1) : d;
};

const waitForMouseActions = async (options) => {
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
    await scrollTo(selector);

    function focusElement() {
        this.focus();
        return true;
    }
    await evaluate(selector, focusElement);
};

const dialog = (dialogType, dialogMessage, callback) => {
    validate();
    xhrEvent.once(createJsDialogEventName(dialogMessage, dialogType), async ({ message }) => {
        if (dialogMessage === message)
            await callback();
    });
};

const isSelector = obj => obj && obj['get'] && obj['exists'];

const filter_visible_nodes = async (nodeIds) => {
    let visible_nodes = [];

    function isHidden() {
        if (this.nodeType === Node.TEXT_NODE) return this.parentElement.offsetHeight <= 0 && this.parentElement.offsetWidth <= 0;
        return this.offsetHeight <= 0 && this.offsetWidth <= 0;
    }

    for (const nodeId of nodeIds) {
        const result = await evaluate(nodeId, isHidden);
        if (!result.value) visible_nodes.push(nodeId);
    }

    return visible_nodes;
};

const $$ = async (selector) => {
    return (await filter_visible_nodes(await runtimeHandler.findElements(`document.querySelectorAll('${selector}')`)));
};

const $$xpath = async (selector) => {
    var xpathFunc = function (selector) {
        var result = [];
        var nodesSnapshot = document.evaluate(selector, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        for (var i = 0; i < nodesSnapshot.snapshotLength; i++) {
            result.push(nodesSnapshot.snapshotItem(i));
        }
        return result;
    };
    return (await filter_visible_nodes(await runtimeHandler.findElements(xpathFunc, selector)));
};

const evaluate = async (selector, func) => {
    let nodeId = selector;
    if (isNaN(selector)) nodeId = await element(selector);
    const { result } = await runtimeHandler.runtimeCallFunctionOn(func, null, { nodeId: nodeId });
    return result;
};

const validate = () => {
    if (!dom || !page) throw new Error('Browser or page not initialized. Call `openBrowser()` before using this API');
};

const assertType = (obj, condition = isString, message = 'String parameter expected') => {
    if (!condition(obj)) throw new Error(message);
};


const selectorText = get => {
    return async () => {
        const texts = [];
        const elems = await getIfExists(get)();
        for (const elem of elems) {
            texts.push((await evaluate(elem, function getText() { return this.innerText; })).value);
        }
        return texts;
    };
};

const rectangle = async (selector, callback) => {
    const elems = await elements(selector);
    let results = [];
    for (const e of elems) {
        const r = await domHandler.getBoundingClientRect(e);
        results.push({ elem: e, result: callback(r) });
    }
    return results;
};

/**
* Starts a REPL when taiko is invoked as a runner with `--load` option.
* @callback repl
*
* @example
* import { repl } from 'taiko/recorder';
* await repl();
*
* @example
* taiko --load script.js
*/


/**
 * Identifies an element on the page.
 * @callback selector
 * @function
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
 * @function
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
 * Wrapper object for the element present on the web page. Extra methods are avaliable based on the element type.
 *
 * * `get()`, `exists()`, `description`, `text()` for all the elements.
 * (NOTE: `exists()` returns boolean form version `0.4.0`)
 * * `value()` for input field, fileField and text field.
 * * `value()`, `select()` for combo box.
 * * `check()`, `uncheck()`, `isChecked()` for checkbox.
 * * `select()`, `deselect()`, `isSelected()` for radio button.
 *
 * @typedef {Object} ElementWrapper
 * @property @private {function} get - DOM element getter. Implicitly wait for the element to appears with timeout of 10 seconds.
 * @property {function(number, number)} exists - Checks existence for element.
 * @property {string} description - Describing the operation performed.
 * @property {Array} text - Gives innerText of all matching elements.
 *
 * @example
 * link('google').exists()
 * link('google').exists(1000)
 * link('google').description
 * textField('username').value()
 * $('.class').text()
 */
const realFuncs = {};
for (const func in module.exports) {
    realFuncs[func] = module.exports[func];
    if (realFuncs[func].constructor.name === 'AsyncFunction')

        module.exports[func] = async function () {
            if (observe) { await waitFor(config.observeTime); }
            return await realFuncs[func].apply(this, arguments);
        };
}

module.exports.metadata = {
    'Browser actions': ['openBrowser', 'closeBrowser', 'client', 'switchTo', 'intercept', 'emulateNetwork', 'emulateDevice', 'setViewPort', 'openTab', 'closeTab', 'overridePermissions', 'clearPermissionOverrides', 'setCookie', 'clearBrowserCookies', 'deleteCookies', 'getCookies', 'setLocation'],
    'Page actions': ['goto', 'reload', 'goBack', 'goForward', 'currentURL', 'title', 'click', 'doubleClick', 'rightClick', 'dragAndDrop', 'hover', 'focus', 'write', 'clear', 'attach', 'press', 'highlight', 'mouseAction', 'scrollTo', 'scrollRight', 'scrollLeft', 'scrollUp', 'scrollDown', 'screenshot', 'tap'],
    'Selectors': ['$', 'image', 'link', 'listItem', 'button', 'inputField', 'fileField', 'textBox', 'textField', 'comboBox', 'dropDown', 'checkBox', 'radioButton', 'text', 'contains'],
    'Proximity selectors': ['toLeftOf', 'toRightOf', 'above', 'below', 'near'],
    'Events': ['alert', 'prompt', 'confirm', 'beforeunload'],
    'Helpers': ['evaluate', 'intervalSecs', 'timeoutSecs', 'to', 'into', 'waitFor', 'accept', 'dismiss', 'setConfig', 'emitter'],
    'Extensions': ['loadPlugin']
};
