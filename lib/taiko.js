const cri = require('chrome-remote-interface');
const debug = require('debug');
const logEvent = debug('taiko:event');
const childProcess = require('child_process');
const BrowserFetcher = require('./browserFetcher');
const removeFolder = require('rimraf');
const { helper, waitFor, isString, isFunction, getIfExists,
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
const EventEmiter = require('events').EventEmitter;
const xhrEvent = new EventEmiter();
const descEvent = new EventEmiter();
let chromeProcess, temporaryUserDataDir, page, network, runtime, input, client, dom, emulation, overlay, criTarget, currentPort, currentHost,
    headful, security, ignoreSSLErrors, observe, browser, device;
let localProcotol = false;

let plugins = new Map();

module.exports.emitter = descEvent;

const connect_to_cri = async (target) => {
    if (process.env.LOCAL_PROTOCOL) {
        localProcotol = true;
    }
    if (client) {
        await network.setRequestInterception({ patterns: [] });
        client.removeAllListeners();
    }
    return new Promise(async function connect(resolve) {
        try {
            if (!target) {
                const browserTargets = await cri.List({host:currentHost,port:currentPort});
                if(!browserTargets.length) throw new Error('No targets created yet!!');
                target =  browserTargets.filter((target) => target.type === 'page')[0];
            }
            await cri({ target, local: localProcotol }, async (c) => {
                client = c;
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
                    if (!client) return;
                    logEvent('DOMContentLoaded');
                    await dom.getDocument();
                });
                await Promise.all([runtime.enable(), network.enable(), page.enable(), dom.enable(), overlay.enable(), security.enable()]);
                await setDOM(domHandler);
                if (ignoreSSLErrors) security.setIgnoreCertificateErrors({ ignore: true });
                client.on('disconnect',reconnect);
                device = process.env.TAIKO_EMULATE_DEVICE;
                if (device) emulateDevice(device);
                xhrEvent.emit('createdSession',client);
                resolve();
            });
        } catch (e) {
            const timeoutId = setTimeout(() => { connect(resolve); }, 1000);
            timeouts.push(timeoutId);
        }
    });
};

async function reconnect(){
    try{
        client.removeAllListeners();
        client = null;
        const browserTargets = await cri.List({host:currentHost,port:currentPort});
        const pages = browserTargets.filter((target)=>{
            return target.type === 'page';
        });
        await connect_to_cri(pages[0]);
        await dom.getDocument();
    }catch(e){
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
    setConfig({observeTime: calcObserveDelay(observe, options.observeTime) });
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
 *       '--no-zygote']}) - These are recommended args that has to be passed when running in docker
 *
 * @param {Object} options {headless: true|false, args:['--window-size=1440,900']}
 * @param {boolean} [options.headless=true] - Option to open browser in headless/headful mode.
 * @param {Array} [options.args] - Args to open chromium https://peter.sh/experiments/chromium-command-line-switches/.
 * @param {number} [options.port=0] - Remote debugging port if not given connects to any open port.
 * @param {boolean} [options.ignoreCertificateErrors=false] - Option to ignore certificate errors.
 * @param {boolean} [options.observe=false] - Option to run commands with delay to observe what's happening.
 * @param {number} [options.observeTime=3000] - Option to modify delay time for observe mode.
 * @param {dumpio} [options.dumpio=true] - Option to dump IO from browser
 */
module.exports.openBrowser = async (options = { headless: true }) => {
    const browserFetcher = new BrowserFetcher();
    const chromeExecutable = browserFetcher.getExecutablePath();
    if (options.host && options.port) {
        currentHost = options.host;
        currentPort = options.port;
        await connect_to_cri();
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
            '--use-mock-keychain'
        ];
        if (options.args) args = args.concat(options.args);
        if (!args.some(arg => arg.startsWith('--user-data-dir'))) {
            temporaryUserDataDir = await mkdtempAsync(CHROME_PROFILE_PATH);
            args.push(`--user-data-dir=${temporaryUserDataDir}`);
        }
        if (options.headless) args = args.concat(['--headless', '--window-size=1440,900']);
        chromeProcess = childProcess.spawn(chromeExecutable, args);
        if (options.dumpio) {
            chromeProcess.stderr.pipe(process.stderr);
            chromeProcess.stdout.pipe(process.stdout);
        }
        const endpoint = await browserFetcher.waitForWSEndpoint(chromeProcess, config.navigationTimeout);
        currentHost = endpoint.host;
        currentPort = endpoint.port;
        await connect_to_cri();
    }
    plugins.forEach((handler) => handler(module.exports,xhrEvent));
    var description = device ? `Browser opened with viewport ${device}` : 'Browser opened';
    descEvent.emit('success', description);
};

/**
 * Closes the browser and all of its tabs (if any were opened).
 *
 * @example
 * await closeBrowser()
 *
 */
module.exports.closeBrowser = async () => {
    validate();
    xhrEvent.removeAllListeners();
    timeouts.forEach(timeout => { if (timeout) clearTimeout(timeout); });
    await _closeBrowser();
    networkHandler.resetInterceptors();
    descEvent.emit('success', 'Browser closed');
};

const _closeBrowser = async () => {
    if (client) {
        await client.removeAllListeners();
        await page.close();
        await client.close();
        client = null;
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

/**
 * Gives CRI client object.
 *
 * @returns {Object}
 */
module.exports.client = () => client;

/**
 * Allows to switch between tabs using URL or page title.
 *
 * @example
 * await switchTo('https://taiko.gauge.org/') - switch using URL
 * await switchTo('Taiko') - switch using Title
 *
 * @param {string} targetUrl - URL/Page title of the tab to switch.
 */
module.exports.switchTo = async (targetUrl) => {
    const target = await targetHandler.getCriTarget(targetUrl);
    await connect_to_cri(target);
    await dom.getDocument();
    descEvent.emit('success', 'Switched to tab with url ' + targetUrl);
};

/**
 * Add interceptor for the network call to override request or mock response.
 *
 * @example
 * case 1: block url => await intercept(url)
 * case 2: mockResponse => await intercept(url,{mockObject})
 * case 3: override request => await intercept(url,(request) => {request.continue({overrideObject})})
 * case 4: redirect => await intercept(url,redirectUrl)
 * case 5: mockResponse based on request => await intercept(url,(request) => { request.respond({mockResponseObject})} )
 *
 * @param {string} requestUrl request URL to intercept
 * @param {function|object}option action to be done after interception. For more examples refer to https://github.com/getgauge/taiko/issues/98#issuecomment-42024186
 */
module.exports.intercept = async (requestUrl, option) => {
    await networkHandler.addInterceptor({ requestUrl: requestUrl, action: option });
    descEvent.emit('success', 'Interceptor added for ' + requestUrl);
};

/**
 * Set network emulation
 *
 * @example
 * await emulateNetwork("Offline")
 * await emulateNetwork("Good2G")
 *
 * @param {String} networkType - 'GPRS','Regular2G','Good2G','Good3G','Regular3G','Regular4G','DSL','WiFi, Offline'
 */

module.exports.emulateNetwork = async (networkType) => {
    await networkHandler.setNetworkEmulation(networkType);
    descEvent.emit('success', 'Set network emulation with values ' + JSON.stringify(networkType));
};

/**
 * Allows to simulate device viewport
 * 
 * @example
 * await emulateDevice('iPhone 6')
 * 
 * @param {string} deviceModel
 */

module.exports.emulateDevice = emulateDevice;
async function emulateDevice(deviceModel) {
    const deviceEmulate = devices[deviceModel];
    let deviceNames = Object.keys(devices);
    if (deviceEmulate == undefined)
        throw new Error(`Please set one of the given device model ${deviceNames.join('\n')}`);
    await Promise.all([
        emulationHandler.setViewport(deviceEmulate.viewport),
        network.setUserAgentOverride({ userAgent: deviceEmulate.userAgent })
    ]);
    descEvent.emit('success', 'Device emulation set to ' + deviceModel);
}

/**
 * Sets page viewport
 *
 * @example
 * await setViewPort({width:600,height:800})
 *
 * @param {Object} options - https://chromedevtools.github.io/devtools-protocol/tot/Emulation#method-setDeviceMetricsOverride
 */
module.exports.setViewPort = async (options) => {
    await emulationHandler.setViewport(options);
    descEvent.emit('success', 'ViewPort is set to width ' + options.width + 'and height ' + options.height);
};

/**
 * Launches a new tab with given url.
 * @example
 * await openTab('https://taiko.gauge.org/')
 *
 * @param {string} targetUrl - URL/Page title of the tab to switch.
 * @param {Object} options - Click options.
 * @param {number} [options.timeout=5000] - DEPRECATED timeout option, use navigationTimeout instead.
 * @param {number} [options.navigationTimeout=5000] - Navigation timeout value in milliseconds for navigation after click.
 * @param {string} [options.waitForEvents = ['firstMeaningfulPaint']] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']]
 */
module.exports.openTab = async (targetUrl, options = { navigationTimeout: config.navigationTimeout, waitForEvents: ['firstMeaningfulPaint'] }) => {
    if (!/^https?:\/\//i.test(targetUrl) && !/^file/i.test(targetUrl)) targetUrl = 'http://' + targetUrl;
    options = setNavigationOptions(options);
    await doActionAwaitingNavigation(options, async () => {
        await criTarget.createTarget({ url: targetUrl });
    });
    descEvent.emit('success', 'Opened tab with url ' + targetUrl);
};

/**
 * Closes the given tab with given url or closes current tab.
 *
 * @example
 * await closeTab() - Closes the current tab.
 * await closeTab('https://gauge.org') - Closes the tab with url 'https://gauge.org'.
 *
 * @param {string} targetUrl - URL/Page title of the tab to switch.
 */
module.exports.closeTab = async (targetUrl) => {
    if (!targetUrl) {
        const result = await runtimeHandler.runtimeEvaluate('window.location.toString()');
        targetUrl = result.result.value;
    }
    let target = await targetHandler.getCriTarget(targetUrl);
    let targetToConnect = await targetHandler.getTargetToConnect(targetUrl);
    if (!targetToConnect) {
        await _closeBrowser();
        descEvent.emit('success', 'Closing last target and browser.');
    }
    client.removeAllListeners();
    client = null;
    await cri.Close({ host: currentHost, port: currentPort, id: target.id });
    await connect_to_cri(targetHandler.constructCriTarget(targetToConnect));
    await dom.getDocument();
    descEvent.emit('success', 'Closed tab with url ' + targetUrl);
};

/**
 * Override browser permissions
 *
 * @example
 * await overridePermissions('http://maps.google.com',['geolocation']);
 *
 * @param {string} origin
 * @param {!Array<string>} permissions https://chromedevtools.github.io/devtools-protocol/tot/Browser/#type-PermissionType
 */
module.exports.overridePermissions = async (origin, permissions) => {
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
 * @param {Object} options.
 * @param {string} [options.url='http://www.google.com'] - deletes all the cookies with the given name where domain and path match provided URL.
 * @param {string} [options.domain='herokuapp.com'] - deletes only cookies with the exact domain.
 * @param {string} [options.path='Google/Chrome/Default/Cookies/..'] - deletes only cookies with the exact path.
 * @param {boolean} [options.secure=true] - True if cookie is secure.
 * @param {boolean} [options.httpOnly=true] - True if cookie is http-only.
 * @param {string} [options.sameSite=Strict] - Represents the cookie's 'SameSite' status: https://tools.ietf.org/html/draft-west-first-party-cookies.
 * @param {number} [options.expires=2019-02-16T16:55:45.529Z] - UTC time in seconds, counted from January 1, 1970.
 */
module.exports.setCookie = async (name, value, options = {}) => {
    validate();
    if (options.url === undefined && options.domain === undefined) throw new Error('Atleast URL or Domain needs to be specified for setting cookies');
    options.name = name;
    options.value = value;
    await network.setCookie(options);
    descEvent.emit('success', name + ' cookie set successfully');
};

/**
 * Clears browser cookies.
 *
 * @example
 * await clearBrowserCookies()
 *
 */
module.exports.clearBrowserCookies = async () => {
    validate();
    await network.clearBrowserCookies();
    descEvent.emit('success', 'Browser cookies deleted successfully');
};

/**
 * Deletes browser cookies with matching name and url or domain/path pair.
 *
 * @example
 * await deleteCookies("CSRFToken", {url: "http://the-internet.herokuapp.com"})
 * await deleteCookies("CSRFToken", {domain: "herokuapp.com"})
 *
 * @param {string} cookieName - Cookie name.
 * @param {Object} options
 * @param {string} [options.url='http://www.google.com'] - deletes all the cookies with the given name where domain and path match provided URL.
 * @param {string} [options.domain='herokuapp.com'] - deletes only cookies with the exact domain.
 * @param {string} [options.path='Google/Chrome/Default/Cookies/..'] - deletes only cookies with the exact path.
 */
module.exports.deleteCookies = async (cookieName, options = {}) => {
    validate();
    if (options.url === undefined && options.domain === undefined) throw new Error('Atleast URL or Domain needs to be specified for deleting cookies');
    options.name = cookieName;
    await network.deleteCookies(options);
    descEvent.emit('success', cookieName + ' cookie deleted successfully');
};

/**
 * Get browser cookies
 * 
 * @example 
 * await getCookies()
 * await getCookies({urls:['https://the-internet.herokuapp.com']})
 * 
 * @param {Array} [options.urls = ['https://the-internet.herokuapp.com', 'https://google.com']] - The list of URLs for which applicable cookies will be fetched
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
 * await overridePermissions("https://the-internet.herokuapp.com/geolocation",['geolocation'])
 * await setLocation({ latitude: 27.1752868, longitude: 78.040009, accuracy:20 })
 * 
 * @param {object} - { latitude: 27.1752868, longitude: 78.040009, accuracy:20 }
 */
module.exports.setLocation = async (options) => {
    await emulationHandler.setLocation(options);
    descEvent.emit('success', 'Geolocation set');
};

/**
 * Opens the specified URL in the browser's tab. Adds `http` protocol to the URL if not present.
 * @example
 * await goto('https://google.com')
 * await goto('google.com')
 *
 * @param {string} url - URL to navigate page to.
 * @param {boolean} [options.waitForNavigation=false] - Skip to navigation - default is true
 * @param {Object} options - { navigationTimeout:5000, headers:{'Authorization':'Basic cG9zdG1hbjpwYXNzd29y2A=='}} Default navigationTimeout is 30 seconds to override set options = {navigationTimeout:10000}, headers to override defaults.
 * @param {string} [options.waitForEvents = ['firstMeaningfulPaint']] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']]
 * @param {number} [options.timeout=5000] - DEPRECATED timeout option, use navigationTimeout instead.
 * @param {number} [options.navigationTimeout=5000] - Navigation timeout value in milliseconds for navigation after click.
 */
module.exports.goto = async (url, options = { navigationTimeout: config.navigationTimeout, waitForEvents: ['firstMeaningfulPaint'] }) => {
    validate();
    if (!/^https?:\/\//i.test(url) && !/^file/i.test(url)) url = 'http://' + url;
    if (options.headers) await network.setExtraHTTPHeaders({ headers: options.headers });
    options = setNavigationOptions(options);
    await doActionAwaitingNavigation(options, async () => {
        await pageHandler.handleNavigation(url);
    });
    descEvent.emit('success', 'Navigated to url ' + url);
};

/**
 * Reloads the page.
 * @example
 * await reload('https://google.com')
 * await reload('https://google.com', { timeout: 30000 })
 *
 * @param {string} url - URL to reload
 * @param {Object} options
 * @param {string} [options.waitForEvents = ['firstMeaningfulPaint']] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']]
 * @param {number} [options.timeout=5000] - DEPRECATED timeout option, use navigationTimeout instead.
 * @param {number} [options.navigationTimeout=5000] - Navigation timeout value in milliseconds for navigation after click.
 */
module.exports.reload = async (url, options = { navigationTimeout: config.navigationTimeout, waitForEvents: ['firstMeaningfulPaint'] }) => {
    validate();
    // const promises = setNavigationPromises(options);
    options = setNavigationOptions(options);
    await doActionAwaitingNavigation(options, async () => {
        await page.reload(url);
        url = url !== undefined && url !== null ? url : (await runtimeHandler.runtimeEvaluate('window.location.toString()')).result.value;
    });
    descEvent.emit('success', url + 'reloaded');
};

/**
 * Mimics browser back button click functionality.
 * @example
 * await goBack()
 *
 * @param {Object} options
 * @param {string} [options.waitForEvents = ['firstMeaningfulPaint']] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']]
 * @param {number} [options.timeout=5000] - DEPRECATED timeout option, use navigationTimeout instead.
 * @param {number} [options.navigationTimeout=5000] - Navigation timeout value in milliseconds for navigation after click.
 */
module.exports.goBack = async (options = { navigationTimeout: config.navigationTimeout, waitForEvents: ['firstMeaningfulPaint'] }) => {
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
 * @param {string} [options.waitForEvents = ['firstMeaningfulPaint']] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']]
 * @param {number} [options.timeout=5000] - DEPRECATED timeout option, use navigationTimeout instead.
 * @param {number} [options.navigationTimeout=5000] - Navigation timeout value in milliseconds for navigation after click.
 */
module.exports.goForward = async (options = { navigationTimeout: config.navigationTimeout, waitForEvents: ['firstMeaningfulPaint'] }) => {
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
    await doActionAwaitingNavigation(options, async () => {
        await page.navigateToHistoryEntry({ entryId: entry.id });
    });
};

/**
 * Returns window's current URL.
 * @example
 * await openBrowser();
 * await goto("www.google.com");
 * await currentURL();
 * returns "https://www.google.com/?gws_rd=ssl"
 *
 * @returns {Promise<String>} - The URL of the current window.
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
 * await title();
 * returns "Google"
 * 
 * @returns {Promise<String>} - The title of the current page.
 */
module.exports.title = async () => {
    validate();
    const result = await runtimeHandler.runtimeEvaluate('document.querySelector("title").textContent');
    return result.result.value;
};

const setNavigationOptions = (options) => {
    options.waitForNavigation = determineWaitForNavigation(options.waitForNavigation);
    options.navigationTimeout = options.navigationTimeout ||  options.timeout || config.navigationTimeout;
    options.waitForStart = options.waitForStart || 500;
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
        if(elem.nodeType === Node.TEXT_NODE){
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
        if(elem.nodeType === Node.TEXT_NODE){
            let range = document.createRange();
            range.selectNodeContents(elem);
            value = range.getClientRects();
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

/**
 * Fetches an element with the given selector, scrolls it into view if needed, and then clicks in the center of the element. If there's no element matching selector, the method throws an error.
 * @example
 * await click('Get Started')
 * await click(link('Get Started'))
 * await click({x : 170, y : 567})
 *
 * @param {selector|string|object} selector - A selector to search for element to click / coordinates of the elemets to click on. If there are multiple elements satisfying the selector, the first will be clicked.
 * @param {Object} options - Click options.
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the click. Default navigation timeout is 15 seconds, to override pass `{ navigationTimeout: 10000 }` in `options` parameter.
 * @param {number} [options.waitForStart=500] - wait for navigation to start. Default to 500ms
 * @param {number} [options.timeout=5000] - DEPRECATED timeout option, use navigationTimeout instead.
 * @param {number} [options.navigationTimeout=5000] - Navigation timeout value in milliseconds for navigation after click.
 * @param {string} [options.button='left'] - `left`, `right`, or `middle`.
 * @param {number} [options.clickCount=1] - Number of times to click on the element.
 * @param {number} [options.elementsToMatch=10] - Number of elements to loop through to match the element with given selector.
 * @param {string} [options.waitForEvents = ['firstMeaningfulPaint']] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']]
 */
module.exports.click = click;

async function click(selector, options = {}, ...args) {
    validate();
    if (options instanceof RelativeSearchElement) {
        args = [options].concat(args);
        options = {};
    }
    if (isSelector(selector) || isString(selector) || Number.isInteger(selector)){
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
            throw Error('Please provide a better selector, Too many matches.');
        if (!isElemAtPoint)
            throw Error(description(selector) + ' is covered by other element');
        await waitForMouseActions(options);
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
 * @param {Object} options - Click options.
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the click. Default navigation timout is 15 seconds, to override pass `{ timeout: 10000 }` in `options` parameter.
 */
module.exports.doubleClick = async (selector, options = {}, ...args) => {
    if (options instanceof RelativeSearchElement) {
        args = [options].concat(args);
        options = {};
    }
    options = {
        waitForNavigation: determineWaitForNavigation(options.waitForNavigation),
        clickCount: 2
    };
    await click(selector, options, ...args);
    descEvent.emit('success', 'Double clicked ' + description(selector, true));
};

/**
 * Fetches an element with the given selector, scrolls it into view if needed, and then right clicks the element. If there's no element matching selector, the method throws an error.
 *
 * @example
 * await rightClick('Get Started')
 * await rightClick(text('Get Started'))
 *
 * @param {selector|string} selector - A selector to search for element to right click. If there are multiple elements satisfying the selector, the first will be double clicked.
 * @param {Object} options - Click options.
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the click. Default navigation timout is 15 seconds, to override pass `{ timeout: 10000 }` in `options` parameter.
 */
module.exports.rightClick = async (selector, options = {}, ...args) => {
    if (options instanceof RelativeSearchElement) {
        args = [options].concat(args);
        options = {};
    }
    options = {
        waitForNavigation: determineWaitForNavigation(options.waitForNavigation),
        button: 'right'
    };
    await click(selector, options, ...args);
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
 * @param {object} distance - Distance to be moved from position of source element
 * @param {string} [options.waitForEvents = ['firstMeaningfulPaint']] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']]
 */
module.exports.dragAndDrop = async (source, destination) => {
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
 * @param {string} [options.waitForEvents = ['firstMeaningfulPaint']] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']]
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
 * @param {object} options - {waitForNavigation:true,waitForStart:500,timeout:10000}
 * @param {string} [options.waitForEvents = ['firstMeaningfulPaint']] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']]
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
 * @param {selector|string} [into] - A selector of an element to write into.
 * @param {Object} [options]
 * @param {number} options.delay - Time to wait between key presses in milliseconds.
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the click. Default navigation timeout is 15 seconds, to override pass `{ navigationTimeout: 10000 }` in `options` parameter.
 * @param {number} [options.waitForStart=500] - wait for navigation to start. Default to 500ms
 * @param {number} [options.timeout=5000] - DEPRECATED timeout option, use navigationTimeout instead.
 * @param {number} [options.navigationTimeout=5000] - Navigation timeout value in milliseconds for navigation after click.
 * @param {string} [options.waitForEvents = ['firstMeaningfulPaint']] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']]
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
    if (activeElement.notWritable)
        throw new Error('Element focused is not writable');
    if (headful) await highlightElemOnAction(activeElement.nodeId);
    for (const char of text) {
        await new Promise(resolve => {
            const timeoutId = setTimeout(resolve, options.delay);
            timeouts.push(timeoutId);
        });
        await input.dispatchKeyEvent({ type: 'char', text: char });
    }
};

/**
 * Clears the value of given selector. If no selector is given clears the current active element.
 *
 * @example
 * await clear()
 * await clear(inputField({placeholder:'Email'}))
 *
 * @param {selector} selector - A selector to search for element to clear. If there are multiple elements satisfying the selector, the first will be cleared.
 * @param {Object} options - Click options.
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after clear. Default navigation timeout is 15 seconds, to override pass `{ navigationTimeout: 10000 }` in `options` parameter.
 * @param {number} [options.waitForStart=500] - wait for navigation to start. Default to 500ms
 * @param {number} [options.timeout=5000] - DEPRECATED timeout option, use navigationTimeout instead.
 * @param {number} [options.navigationTimeout=5000] - Navigation timeout value in milliseconds for navigation after click.
 * @param {string} [options.waitForEvents = ['firstMeaningfulPaint']] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']]
 */
module.exports.clear = async (selector, options = {}) => {
    options = setNavigationOptions(options);
    if (selector) await _focus(selector);
    const activeElement = await runtimeHandler.activeElement();
    if (activeElement.notWritable)
        throw new Error('Element cannot be cleared');
    const desc = !selector ? { description: 'Cleared element on focus' } :
        { description: 'Cleared ' + description(selector, true) };
    await doActionAwaitingNavigation(options, async () => {
        await _clear(activeElement.nodeId);
        if (headful) await highlightElemOnAction(activeElement.nodeId);
    });
    descEvent.emit('success', desc);
};

const _clear = async (elem) => {
    await click(elem, { clickCount: 3, waitForNavigation: false });
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
            throw new Error(`File ${resolvedPath} doesnot exists.`);
        }
    });
    if (isString(to)) to = fileField(to);
    else if (!isSelector(to)) throw Error('Invalid element passed as paramenter');
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
 * @param {string | Array<string> } keys - Name of keys to press, such as ArrowLeft. See [USKeyboardLayout](https://github.com/getgauge/taiko/blob/master/lib/USKeyboardLayout.js) for a list of all key names.
 * @param {Object} options
 * @param {string} [options.text] - If specified, generates an input event with this text.
 * @param {number} [options.delay=0] - Time to wait between keydown and keyup in milliseconds.
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the click. Default navigation timeout is 15 seconds, to override pass `{ navigationTimeout: 10000 }` in `options` parameter.
 * @param {number} [options.waitForStart=500] - wait for navigation to start. Default to 500ms
 * @param {number} [options.timeout=5000] - DEPRECATED timeout option, use navigationTimeout instead.
 * @param {number} [options.navigationTimeout=5000] - Navigation timeout value in milliseconds for navigation after click.
 * @param {string} [options.waitForEvents = ['firstMeaningfulPaint']] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']]
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
  * @param {...relativeSelector} args - Proximity selectors
 */
module.exports.highlight = highlight;

async function highlight(selector, ...args) {
    validate();

    function highlightNode() {
        this.style.outline = '0.5em solid red';
        return true;
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
 * @param {object} coordinates - Coordinates of a point on canvas to perform the action.
 */
module.exports.mouseAction = mouseAction;

async function mouseAction(action, coordinates, options = {}) {
    validate();
    options = setNavigationOptions(options);
    if (headful)
        await overlay.highlightRect({ x: coordinates.x, y: coordinates.y, width : 1, height : 1, outlineColor: { r: 255, g: 0, b: 0 }});
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
 * @param {string} [options.waitForEvents = ['firstMeaningfulPaint']] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']]
 */
module.exports.scrollTo = async (selector, options = {}) => {
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
 * @param {number} [px=100]
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
 * @param {number} [px=100]
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
 * @param {number} [px=100]
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
 * @param {number} [px=100]
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
 * @param {object} options - {path:'screenshot.png', fullPage:true, padding:16} or {encoding:'base64'}
 * @returns {Promise<Buffer>} - Promise which resolves to buffer with captured screenshot if {encoding:'base64} given.
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
 * This {@link selector} lets you identify elements on the web page via XPath or CSS selector.
 * @example
 * highlight($(`//*[text()='text']`))
 * $(`//*[text()='text']`).exists()
 * $(`#id`)
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
 * This {@link selector} lets you identify an image on a web page. Typically, this is done via the image's alt text or attribute and value pairs.
 *
 * @example
 * await click(image('alt'))
 * image('alt').exists()
 *
 * @param {string} alt - The image's alt text.
 * @param {object} attrValuePairs - Pairs of attribute and value like {"id":"name","class":"class-name"}
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
 * This {@link selector} lets you identify a link on a web page with text or attribute and value pairs.
 *
 * @example
 * await click(link('Get Started'))
 * link('Get Started').exists()
 *
 * @param {string} text - The link text.
 * @param {object} attrValuePairs - Pairs of attribute and value like {"id":"name","class":"class-name"}
 * @param {...relativeSelector} args - Proximity selectors
 * @returns {ElementWrapper}
 */
module.exports.link = (attrValuePairs, ...args) => {
    validate();
    const selector = getValues(attrValuePairs, args);
    const get = getElementGetter(selector, async () => await elements(selector.label, 'a'), '//a');
    return { get: getIfExists(get), exists: exists(getIfExists(get), descEvent), description: desc(selector, 'text', 'Link'), text: selectorText(get) };
};

/**
 * This {@link selector} lets you identify a list item (HTML <li> element) on a web page with label or attribute and value pairs.
 *
 * @example
 * await highlight(listItem('Get Started'))
 * listItem('Get Started').exists()
 *
 * @param {string} label - The label of the list item.
 * @param {object} attrValuePairs - Pairs of attribute and value like {"id":"name","class":"class-name"}
 * @param {...relativeSelector} args - Proximity selectors
 * @returns {ElementWrapper}
 */
module.exports.listItem = (attrValuePairs, ...args) => {
    validate();
    const selector = getValues(attrValuePairs, args);
    const get = getElementGetter(selector, async () => await elements(selector.label, 'li'), '//li');
    return { get: getIfExists(get), exists: exists(getIfExists(get), descEvent), description: desc(selector, 'label', 'List item'), text: selectorText(get) };
};

/**
 * This {@link selector} lets you identify a button on a web page with label or attribute and value pairs.
 *
 * @example
 * await highlight(button('Get Started'))
 * button('Get Started').exists()
 *
 * @param {string} label - The button label.
 * @param {object} attrValuePairs - Pairs of attribute and value like {"id":"name","class":"class-name"}
 * @param {...relativeSelector} args - Proximity selectors
 * @returns {ElementWrapper}
 */
module.exports.button = (attrValuePairs, ...args) => {
    validate();
    let get;
    const selector = getValues(attrValuePairs, args);
    if(!selector.attrValuePairs && !selector.label)  get = async () => await handleRelativeSearch(await $$xpath('//input[@type="submit" or @type="reset" or @type="button"] | //button'), selector.args);
    else{
        const getByButton = getElementGetter(selector, async () => await elements(selector.label, 'button'), '//button');

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
 * This {@link selector} lets you identify an input field on a web page with label or attribute and value pairs.
 *
 * @example
 * await focus(inputField({'id':'name'})
 * inputField({'id': 'name'}).exists()
 *
 * @param {object} attrValuePairs - Pairs of attribute and value like {"id":"name","class":"class-name"}
 * @param {...relativeSelector} args - Proximity selectors
 * @returns {ElementWrapper}
 */
module.exports.inputField = (attrValuePairs, ...args) => {
    validate();
    const selector = getValues(attrValuePairs, args);
    const get = getElementGetter(selector,
        async () => await $$xpath(`//input[@id=(//label[contains(string(), ${xpath(selector.label)})]/@for)] | //label[contains(string(), ${xpath(selector.label)})]/input | //*[@contenteditable]`),
        '//input | //*[@contenteditable]');

    return {
        get: getIfExists(get),
        exists: exists(getIfExists(get), descEvent),
        description: desc(selector, 'label', 'Input Field'),
        value: async () => {
            const nodeId = (await getIfExists(get)())[0];
            if (!nodeId) throw `${desc(selector, 'label', 'Input Field')} not found`;
            return (await evaluate(nodeId, function getvalue() { return this.value; })).value;
        },
        text: selectorText(get)
    };
};

/**
 * This {@link selector} lets you identify a file input field on a web page either with label or with attribute and value pairs.
 *
 * @example
 * fileField('Please select a file:').value()
 * fileField('Please select a file:').exists()
 * fileField({'id':'file'}).exists()
 *
 * @param {string} label - The label (human-visible name) of the file input field.
 * @param {object} attrValuePairs - Pairs of attribute and value like {"id":"name","class":"class-name"}
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
 * This {@link selector} lets you identify a text field(input with type text and textarea) on a web page either with label or with attribute and value pairs.
 *
 * @example
 * await focus(textBox('Username:'))
 * textBox('Username:').exists()
 *
 * @param {object} attrValuePairs - Pairs of attribute and value like {"id":"name","class":"class-name"}
 * @param {string} label - The label (human-visible name) of the text field.
 * @param {...relativeSelector} args - Proximity selectors
 * @returns {ElementWrapper}
 */
module.exports.textBox = textBox;

function textBox(attrValuePairs, ...args) {
    validate();
    const selector = getValues(attrValuePairs, args);
    let get;
    if(!selector.attrValuePairs && !selector.label)  get = async () => await handleRelativeSearch(await $$xpath('//input[@type="text"] | //textarea'), selector.args);
    else{
        const getInputText = getElementGetter(selector,
            async () => await $$xpath(`//input[@type='text'][@id=(//label[contains(string(), ${xpath(selector.label)})]/@for)] | //label[contains(string(), ${xpath(selector.label)})]/input[@type='text']`),
            '//input[@type="text"]');
        const getTextArea = getElementGetter(selector,
            async () => await $$xpath(`//textarea[@id=(//label[contains(string(), ${xpath(selector.label)})]/@for)] | //label[contains(string(), ${xpath(selector.label)})]/textarea`),
            '//textarea');
        get = async () => {
            const elems = await getInputText();
            if (elems.length) return elems;
            return await getTextArea();
        };
    }
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
 * This {@link selector} lets you identify a text field on a web page either with label or with attribute and value pairs.
 * DEPRECATED use textBox to select inputField with type text and textarea.
 * @example
 * await focus(textField('Username:'))
 * textField('Username:').exists()
 *
 * @param {object} attrValuePairs - Pairs of attribute and value like {"id":"name","class":"class-name"}
 * @param {string} label - The label (human-visible name) of the text field.
 * @param {...relativeSelector} args - Proximity selectors
 * @returns {ElementWrapper}
 */
module.exports.textField = textField;

function textField(attrValuePairs, ...args) {
    validate();
    console.warn('DEPRECATION WARNING: textField is deprecated use textBox to select inputField with type text and textarea.');
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
 * @example
 * await tap('Gmail')
 * await tap(link('Gmail'))
 * 
 * @param {...relativeSelector} args - Proximity selectors
 * @param {options.waitForNavigation} false - Default to true
 * @param {string} [options.waitForEvents = ['firstMeaningfulPaint']] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']]
 */
module.exports.tap = async (selector, options = {}, ...args) => {
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
        throw Error('Please provide a better selector, Too many matches.');
    if (!isElemAtPoint)
        throw Error(description(selector) + ' is covered by other element');
    descEvent.emit('success', 'Tap has been performed');
};

/**
 * This {@link selector} lets you identify a combo box on a web page either with label or with attribute and value pairs.
 * Any value can be selected using value or text of the options.
 *
 * @example
 * comboBox('Vehicle:').select('Car')
 * comboBox('Vehicle:').value()
 * comboBox('Vehicle:').exists()
 *
 * @param {object} attrValuePairs - Pairs of attribute and value like {"id":"name","class":"class-name"}
 * @param {string} label - The label (human-visible name) of the combo box.
 * @param {...relativeSelector} args - Proximity selectors
 * @param {string} [options.waitForEvents = ['firstMeaningfulPaint']] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']]
 * @returns {ElementWrapper}
 */
module.exports.comboBox = (attrValuePairs, ...args) => {
    validate();
    const selector = getValues(attrValuePairs, args);
    const get = getElementGetter(selector,
        async () => await $$xpath(`//select[@id=(//label[contains(string(), ${xpath(selector.label)})]/@for)] | //label[contains(string(), ${xpath(selector.label)})]/select`),
        '//select');
    return {
        get: getIfExists(get),
        exists: exists(getIfExists(get), descEvent),
        description: desc(selector, 'label', 'Combobox'),
        select: async (value) => {

            const nodeId = (await getIfExists(get)())[0];
            if (!nodeId) throw `${desc(selector, 'label', 'Combobox')} not found`;
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
                if (!result.result.value) throw new Error('Option not available in combo box');
            });
            descEvent.emit('success', 'Selected ' + value);
        },
        value: async () => {
            const nodeId = (await getIfExists(get)())[0];
            if (!nodeId) throw `${desc(selector, 'label', 'Combobox')} not found`;
            return (await evaluate(nodeId, function getvalue() { return this.value; })).value;
        },
        text: selectorText(get)
    };
};

function setChecked(value) { 
    this.checked = value;
    let event = new Event('click');
    this.dispatchEvent(event);
}

/**
 * This {@link selector} lets you identify a checkbox on a web page either with label or with attribute and value pairs.
 *
 * @example
 * checkBox('Vehicle').check()
 * checkBox('Vehicle').uncheck()
 * checkBox('Vehicle').isChecked()
 * checkBox('Vehicle').exists()
 *
 * @param {object} attributeValuePairs - Pairs of attribute and value like {"id":"name","class":"class-name"}
 * @param {string} label - The label (human-visible name) of the check box.
 * @param {...relativeSelector} args Proximity selectors
 * @param {string} [options.waitForEvents = ['firstMeaningfulPaint']] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']]
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
 * This {@link selector} lets you identify a radio button on a web page either with label or with attribute and value pairs.
 *
 * @example
 * radioButton('Vehicle').select()
 * radioButton('Vehicle').deselect()
 * radioButton('Vehicle').isSelected()
 * radioButton('Vehicle').exists()
 *
 * @param {object} attributeValuePairs - Pairs of attribute and value like {"id":"name","class":"class-name"}
 * @param {string} label - The label (human-visible name) of the radio button.
 * @param {...relativeSelector} args
 * @param {string} [options.waitForEvents = ['firstMeaningfulPaint']] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']]
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
        description: desc(selector, 'label', 'Radio Button'),
        isSelected: async () => {
            const nodeId = (await getIfExists(get)())[0];
            if (!nodeId) throw `${desc(selector, 'label', 'Radio Button')} not found`;
            var val = (await evaluate(nodeId, function getvalue() { return this.checked; })).value;
            var description = val ? desc(selector, 'label', 'Radio Button') + 'is selected.' : desc(selector, 'label', 'Radio Button') + 'is not selected.';
            descEvent.emit('success', description);
            return val;
        },
        select: async () => {
            const options = setNavigationOptions({});
            await doActionAwaitingNavigation(options, async () => {
                const nodeId = (await getIfExists(get)())[0];
                if (!nodeId) throw `${desc(selector, 'label', 'Radio Button')} not found`;
                if (headful) await highlightElemOnAction(nodeId);
                await runtimeHandler.runtimeCallFunctionOn(setChecked, null, { nodeId: nodeId, arg: true });
                descEvent.emit('success', desc(selector, 'label', 'Radio Button') + 'is selected');
            });
        },
        deselect: async () => {
            const options = setNavigationOptions({});
            await doActionAwaitingNavigation(options, async () => {
                const nodeId = (await getIfExists(get)())[0];
                if (!nodeId) throw `${desc(selector, 'label', 'Radio Button')} not found`;
                if (headful) await highlightElemOnAction(nodeId);
                await runtimeHandler.runtimeCallFunctionOn(setChecked, null, { nodeId: nodeId, arg: false });
                descEvent.emit('success', desc(selector, 'label', 'Radio Button') + 'is deselected');
            });
        },
        text: selectorText(get)
    };
};

/**
 * This {@link selector} lets you identify an element with text. Looks for exact match if not found does contains.
 *
 * @example
 * await highlight(text('Vehicle'))
 * text('Vehicle').exists()
 *
 * @param {string} text - Text to match.
 * @param {...relativeSelector} args - Proximity selectors
 * @returns {ElementWrapper}
 */
module.exports.text = (text, ...args) => {
    validate();
    const get = async () => await handleRelativeSearch(await elements(text), args);
    return { get: getIfExists(get), exists: exists(getIfExists(get), descEvent), description: `Element with text "${text}"`, text: selectorText(get) };
};

/**
 * This {@link selector} lets you identify an element containing the text. DEPRECATED since text will do contains if exact match not found
 *
 * @example
 * contains('Vehicle').exists()
 *
 * @param {string} text - Text to match.
 * @param {...relativeSelector} args - Proximity selectors
 * @returns {ElementWrapper}
 */
module.exports.contains = contains;

function contains(text, ...args) {
    console.warn('DEPRECATION WARNING: Contains is deprecated as text search now does contains if exact text is not found.');
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
        if( e === '*') elements = await matchTextNode( textToTranslate, translateTo, xpathText);
        if (!elements || !elements.length) elements = await matchValueOrType( e, textToTranslate, translateTo, xpathText);
        if (!elements || !elements.length) elements = await matchTextAcrossElements(e, textToTranslate, translateTo, xpathText);
        return await handleRelativeSearch(elements, args);
    };
    return { get: getIfExists(get), exists: exists(getIfExists(get), descEvent), description: `Element matching text "${text}"`, text: selectorText(get) };
}

async function  matchTextNode(textToTranslate,translateTo,xpathText){
    const elements = await $$xpath(`//text()[translate(normalize-space(string()), "${textToTranslate}", "${translateTo}")=${xpathText}]`);
    if((!elements || !elements.length)) return await $$xpath(`//text()[contains(translate(normalize-space(string()), "${textToTranslate}", "${translateTo}")=${xpathText})]`);
    return elements;
}

async function matchValueOrType(e, textToTranslate, translateTo, xpathText){
    return (await $$xpath('//' + e + `[translate(normalize-space(@value), "${textToTranslate}", "${translateTo}")=${xpathText} or translate(normalize-space(@type), "${textToTranslate}", "${translateTo}")=${xpathText}]`));
}

async function matchTextAcrossElements(e, textToTranslate, translateTo, xpathText){
    const xpathToTranslateInnerText = `translate(normalize-space(.), "${textToTranslate}", "${translateTo}")`;
    const elements = await $$xpath('//' + e + `[not(descendant::*[${xpathToTranslateInnerText}=${xpathText}]) and ${xpathToTranslateInnerText}=${xpathText}]`);
    if (!elements || !elements.length) 
        return await $$xpath('//' + e + `[not(descendant::*[contains(translate(normalize-space(.), '${textToTranslate}', '${translateTo}'), ${xpathText})]) and contains(translate(normalize-space(.), '${textToTranslate}', '${translateTo}'), ${xpathText})]`);
    return elements;
}

/**
 * This {@link relativeSelector} lets you perform relative HTML element searches.
 *
 * @example
 * await click(link("Block", toLeftOf("name"))
 *
 * @param {selector|string} selector - Web element selector.
 * @returns {RelativeSearchElement}
 */
module.exports.toLeftOf = selector => {
    validate();
    return new RelativeSearchElement(async (e, v) => {
        const rect = await domHandler.getBoundingClientRect(e);
        return rect.right <= v;
    }, rectangle(selector, r => r.left), isString(selector) ? `To Left of ${selector}` : `To Left of ${selector.description}`);
};

/**
 * This {@link relativeSelector} lets you perform relative HTML element searches.
 *
 * @example
 * await click(link("Block", toRightOf("name"))
 *
 * @param {selector|string} selector - Web element selector.
 * @returns {RelativeSearchElement}
 */
module.exports.toRightOf = selector => {
    validate();
    const value = rectangle(selector, r => r.right);
    const desc = isString(selector) ? `To Right of ${selector}` : `To Right of ${selector.description}`;
    return new RelativeSearchElement(async (e, v) => {
        const rect = await domHandler.getBoundingClientRect(e);
        return rect.left >= v;
    }, value, desc);
};

/**
 * This {@link relativeSelector} lets you perform relative HTML element searches.
 *
 * @example
 * await click(link("Block", above("name"))
 *
 * @param {selector|string} selector - Web element selector.
 * @returns {RelativeSearchElement}
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
 * This {@link relativeSelector} lets you perform relative HTML element searches.
 *
 * @example
 * await click(link("Block", below("name"))
 *
 * @param {selector|string} selector - Web element selector.
 * @returns {RelativeSearchElement}
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
 * This {@link relativeSelector} lets you perform relative HTML element searches.
 * An element is considered nearer to a reference element,
 * only if the element offset is lesser than the 30px of the reference element in any direction.
 * Default offset is 30 px to override set options = {offset:50}
 *
 * @example
 * await click(link("Block", near("name"))
 * await click(link("Block", near("name", {offset: 50}))
 *
 * @param {selector|string} selector - Web element selector.
 * @returns {RelativeSearchElement}
 *
 */
module.exports.near = (selector, opts = {}) => {
    validate();
    const desc = isString(selector) ? `Near ${selector}` : `Near ${selector.description}`;
    const value = rectangle(selector, r => r);
    const nearOffset = opts.offset || 30;
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
 * alert('Message', async () => await dismiss())
 * alert('Message', async () => await accept('Something'))
 *
 * @param {string} message - Identify alert based on this message.
 * @param {function} callback - Operation to perform. Accept/Dismiss
 */
module.exports.alert = (message, callback) => dialog('alert', message, callback);

/**
 * Lets you perform an operation when a `prompt` with given text is shown.
 *
 * @example
 * prompt('Message', async () => await dismiss())
 * prompt('Message', async () => await accept('Something'))
 *
 * @param {string} message - Identify prompt based on this message.
 * @param {function} callback - Operation to perform.Accept/Dismiss
 */
module.exports.prompt = (message, callback) => dialog('prompt', message, callback);

/**
 * Lets you perform an operation when a `confirm` with given text is shown.
 *
 * @example
 * confirm('Message', async () => await dismiss())
 *
 * @param {string} message - Identify confirm based on this message.
 * @param {function} callback - Operation to perform.Accept/Dismiss
 */
module.exports.confirm = (message, callback) => dialog('confirm', message, callback);

/**
 * Lets you perform an operation when a `beforeunload` with given text is shown.
 *
 * @example
 * beforeunload('Message', async () => await dismiss())
 *
 * @param {string} message - Identify beforeunload based on this message.
 * @param {function} callback - Operation to perform.Accept/Dismiss
 */
module.exports.beforeunload = (message, callback) => dialog('beforeunload', message, callback);

/**
 * Evaluates script on element matching the given selector.
 *
 * @example
 * await evaluate(link("something"), (element) => element.style.backgroundColor)
 * await evaluate(()=>{return document.title})
 *
 * @param {selector|string} selector - Web element selector.
 * @param {function} callback - callback method to execute on the element.
 * NOTE : In callback, we can access only inline css not the one which are define in css files.
 * @param {Object} options - Click options.
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the click. Default navigation timeout is 15 seconds, to override pass `{ navigationTimeout: 10000 }` in `options` parameter.
 * @param {number} [options.waitForStart=500] - wait for navigation to start. Default to 500ms
 * @param {number} [options.timeout=5000] - DEPRECATED timeout option, use navigationTimeout instead.
 * @param {number} [options.navigationTimeout=5000] - Navigation timeout value in milliseconds for navigation after click.
 * @param {number} [options.args] - Arguments to be passed to the provided callback.
 * @param {string} [options.waitForEvents = ['firstMeaningfulPaint']] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']]
 * @returns {Promise<Object>} Object with return value of callback given
 */
module.exports.evaluate = async (selector, callback, options = {}) => {
    let result;
    if (isFunction(selector)) {
        options = callback || options;
        callback = selector;
        selector = (await $$xpath('//*'))[0];
    }
    const nodeId = isNaN(selector) ? await element(selector) : selector;
    if (headful) await highlightElemOnAction(nodeId);

    async function evalFunc({callback, args }) {
        let fn;
        eval(`fn = ${callback}`);
        return await fn(this, args);
    }

    options = setNavigationOptions(options);
    await doActionAwaitingNavigation(options, async () => {
        result = await runtimeHandler.runtimeCallFunctionOn(evalFunc, null,
            { nodeId: nodeId, arg: {callback: callback.toString(), args: options.args}, returnByValue: true });
    });
    descEvent.emit('success', 'Evaluated given script. Result:' + result.result.value);
    return {result : result.result.value};
};

/**
 * Converts seconds to milliseconds.
 *
 * @example
 * link('Plugins').exists(intervalSecs(1))
 *
 * @param {number} secs - Seconds to convert.
 * @return {number} - Milliseconds.
 */
module.exports.intervalSecs = secs => secs * 1000;

/**
 * Converts seconds to milliseconds.
 *
 * @example
 * link('Plugins').exists(intervalSecs(1), timeoutSecs(10))
 *
 * @param {number} secs - Seconds to convert.
 * @return {number} - Milliseconds.
 */
module.exports.timeoutSecs = secs => secs * 1000;

/**
 * This function is used to improve the readability. It simply returns the parameter passed into it.
 *
 * @example
 * await attach('c:/abc.txt', to('Please select a file:'))
 *
 * @param {string|selector}
 * @return {string|selector}
 */
module.exports.to = e => e;

/**
 * This function is used to improve the readability. It simply returns the parameter passed into it.
 *
 * @example
 * await write("user", into('Username:'))
 *
 * @param {string|selector}
 * @return {string|selector}
 */
module.exports.into = e => e;

/**
 * This function is used to wait for number of secs given.
 *
 * @example
 * waitFor(intervalSecs(5))
 *
 * @param {number|time}
 * @return {promise}
 */
module.exports.waitFor = waitFor;

/**
 * Accept callback for dialogs
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
 * Dismiss callback for dialogs
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
 * This function is used by taiko to initiate the plugin
 *
 * @example
 * import {loadPlugin} from 'taiko';
 * import {ID, pluginHandler} from 'taiko-plugin';
 * loadPlugin(IDm pluginHandler);
 *
 * @param {string} ID - unique id or name of the plugin
 * @param {Function} clientHandler - callback method to set taiko instance for plugin
 */

module.exports.loadPlugin = (id, clientHandler) => {
    try {
        if (!plugins.has(id)) {
            if (client !== undefined) clientHandler(module.exports);
            plugins.set(id, clientHandler);
        }
    } catch (error) {
        console.trace(error);
    }
};

/**
 * Lets you configure global configurations.
 *
 * @example
 * setConfig( { observeTime: 3000});
 *
 * @param {object} options
 * @param {number} [options.observeTime = 3000 ] - Option to modify delay time in milliseconds for observe mode.
 * @param {number} [options.navigationTimeout = 30000 ] Navigation timeout value in milliseconds for navigation after performing {@link openTab}, {@link goto}, {@link reload}, {@link goBack}, {@link goForward}, {@link click}, {@link write}, {@link clear}, {@link press} and {@link evaluate}.
 * @param {number} [options.retryInterval = 1000 ] Option to modify delay time in milliseconds to retry the search of element existance.
 * @param {number} [options.retryTimeout = 10000 ] Option to modify timeout in milliseconds while retrying the search of element existance.
 * @param {boolean} [options.waitForNavigation = true ] Wait for navigation after performing {@link goto}, {@link click}, {@link doubleClick}, {@link rightClick}, {@link write}, {@link clear}, {@link press} and {@link evaluate}.
 */
module.exports.setConfig = setConfig;

const doActionAwaitingNavigation = async (options, action) => {
    var promises = [];
    let listenerCallbackMap = {};
    options.waitForNavigation = determineWaitForNavigation(options.waitForNavigation);
    options.navigationTimeout = options.navigationTimeout || options.timeout || config.navigationTimeout;
    if (options.waitForEvents) {
        options.waitForEvents.forEach((event) => {
            promises.push(new Promise((resolve) => {
                xhrEvent.addListener(event, resolve);
                listenerCallbackMap[event] = resolve;
            }));
        });
    } else {
        let func = addPromiseToWait(promises);
        listenerCallbackMap = {'xhrEvent':func,'frameEvent':func,'frameNavigationEvent':func};
        xhrEvent.addListener('xhrEvent', func);
        xhrEvent.addListener('frameEvent', func);
        xhrEvent.addListener('frameNavigationEvent', func);
        xhrEvent.once('targetCreated', () => {
            promises = [
                new Promise((resolve) => {
                    xhrEvent.addListener('targetNavigated', resolve);
                    listenerCallbackMap['targetNavigated'] = resolve;
                }),
                new Promise((resolve) => {
                    xhrEvent.addListener('firstMeaningfulPaint', resolve);
                    listenerCallbackMap['firstMeaningfulPaint'] = resolve;
                })
            ];
        });
    }
    await action();
    await waitForPromises(promises, options.waitForStart);
    if (options.waitForNavigation) {
        await waitForNavigation(options.navigationTimeout, promises).catch(handleTimeout(options.navigationTimeout,listenerCallbackMap));
    }
    for(var listener in listenerCallbackMap){
        xhrEvent.removeListener(listener,listenerCallbackMap[listener]);
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

const handleTimeout = (timeout,listenerCallbackMap) => {
    return (e) => {
        for(var listener in listenerCallbackMap){
            xhrEvent.removeListener(listener,listenerCallbackMap[listener]);
        }
        if (e === 'Timedout')
            throw new Error(`Navigation took more than ${timeout}ms. Please increase the timeout.`);
    };
};

const highlightElemOnAction = async (elem) => {
    const result = await domHandler.getBoxModel(elem);
    await overlay.highlightQuad({ quad: result.model.border, outlineColor: { r: 255, g: 0, b: 0 } });
    await waitFor(1000);
    await overlay.hideHighlight();
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
        if(this.nodeType === Node.TEXT_NODE) return this.parentElement.offsetHeight <= 0 && this.parentElement.offsetWidth <= 0; 
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
 * @param {...string} args
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
 * @returns {RelativeSearchElement}
 */

/**
 * Represents a relative HTML element search. This is returned by {@link relativeSelector}
 *
 * @example
 * // returns RelativeSearchElement
 * above('username')
 *
 * @typedef {Object} RelativeSearchElement
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
 * link('google').exists(intervalSecs(1), timeoutSecs(10))
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
    'Page actions': ['goto', 'reload', 'goBack', 'goForward', 'currentURL', 'title', 'click', 'doubleClick', 'rightClick', 'dragAndDrop', 'hover', 'focus', 'write', 'clear', 'attach', 'press', 'highlight', 'scrollTo', 'scrollRight', 'scrollLeft', 'scrollUp', 'scrollDown', 'screenshot', 'tap', 'mouseAction'],
    'Selectors': ['$', 'image', 'link', 'listItem', 'button', 'inputField', 'fileField', 'textBox', 'textField', 'comboBox', 'checkBox', 'radioButton', 'text', 'contains'],
    'Proximity selectors': ['toLeftOf', 'toRightOf', 'above', 'below', 'near'],
    'Events': ['alert', 'prompt', 'confirm', 'beforeunload'],
    'Helpers': ['evaluate', 'intervalSecs', 'timeoutSecs', 'to', 'into', 'waitFor', 'accept', 'dismiss', 'setConfig', 'emitter' ],
    'Extensions': ['loadPlugin']
};
