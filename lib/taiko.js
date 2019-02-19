const cri = require('chrome-remote-interface');
const childProcess = require('child_process');
const BrowserFetcher = require('./browserFetcher');
const removeFolder = require('rimraf');
const { helper, waitFor, isString, isFunction } = require('./helper');
const removeFolderAsync = helper.promisify(removeFolder);
const inputHandler = require('./inputHandler');
const domHandler = require('./domHandler');
const networkHandler = require('./networkHandler');
const pageHandler = require('./pageHandler');
const targetHandler = require('./targetHandler');
const runtimeHandler = require('./runtimeHandler');
const browserHandler = require('./browserHandler');
const emulationHandler = require('./emulationHandler');
const devices = require('./device').default;
const fs = require('fs');
const os = require('os');
const mkdtempAsync = helper.promisify(fs.mkdtemp);
const path = require('path');
const CHROME_PROFILE_PATH = path.join(os.tmpdir(), 'taiko_dev_profile-');
const EventEmiter = require('events').EventEmitter;
const xhrEvent = new EventEmiter();
const timeouts = [];
const default_timeout = 30000;
let chromeProcess, temporaryUserDataDir, page, network, runtime, input, client, dom, emulation, overlay, criTarget, currentPort, currentHost,
    headful, security, ignoreSSLErrors, observe, observeTime, browser, device;

const connect_to_cri = async (target) => {
    if(client){
        client.removeAllListeners();
    }
    return new Promise(async function connect(resolve) {
        try {
            if (!target) target = await cri.New({ host: currentHost, port: currentPort });
            await cri({ target }, async (c) => {
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
                await Promise.all([runtime.enable(), network.enable(), page.enable(), dom.enable(), overlay.enable(), security.enable()]);
                await networkHandler.setNetwork(network, xhrEvent);
                await inputHandler.setInput(input);
                await domHandler.setDOM(dom);
                await targetHandler.setTarget(criTarget, xhrEvent, connect_to_cri, currentHost, currentPort);
                await runtimeHandler.setRuntime(runtime, dom);
                await browserHandler.setBrowser(browser);
                await emulationHandler.setEmulation(emulation);
                await pageHandler.setPage(page, xhrEvent, async function () {
                    if (!client) return;
                    await dom.getDocument();
                });
                if (ignoreSSLErrors) security.setIgnoreCertificateErrors({ ignore: true });
                device = process.env.TAIKO_EMULATE_DEVICE;
                if (device) emulateDevice(device);
                resolve();
            });
        } catch (e) { 
            const timeoutId = setTimeout(() => { connect(resolve); }, 1000);
            timeouts.push(timeoutId); 
        }
    });
};

const setBrowserOptions = (options) => {
    options.port = options.port || 0;
    options.host = options.host || '127.0.0.1';
    options.headless = options.headless === undefined || options.headless === null ? true : options.headless;
    headful = !options.headless;
    ignoreSSLErrors = options.ignoreCertificateErrors;
    observe = options.observe || false;
    observeTime = options.observeTime || 3000;
    return options;
};

/**
 * Launches a browser with a tab. The browser will be closed when the parent node.js process is closed.
 *
 * @example
 * openBrowser()
 * openBrowser({ headless: false })
 * openBrowser({args:['--window-size=1440,900']})
 * openBrowser({args: [
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
 * @param {number} [option.observeTime=3000] - Option to modify delay time for observe mode.
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
module.exports.openBrowser = async (options = { headless: true }) => {
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
    ];
    if (options.args) args = args.concat(options.args);
    if (!args.some(arg => arg.startsWith('--user-data-dir'))) {
        temporaryUserDataDir = await mkdtempAsync(CHROME_PROFILE_PATH);
        args.push(`--user-data-dir=${temporaryUserDataDir}`);
    }
    if (options.headless) args = args.concat(['--headless', '--window-size=1440,900']);
    chromeProcess = childProcess.spawn(chromeExecutable, args);
    const endpoint = await browserFetcher.waitForWSEndpoint(chromeProcess, default_timeout);
    currentHost = endpoint.host;
    currentPort = endpoint.port;
    await connect_to_cri();
    return { description: device ? `Browser opened with viewport ${device}`: 'Browser opened' };
};

/**
 * Closes the browser and all of its tabs (if any were opened).
 *
 * @example
 * closeBrowser()
 *
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
module.exports.closeBrowser = async () => {
    validate();
    xhrEvent.removeAllListeners();
    timeouts.forEach(timeout => {if(timeout) clearTimeout(timeout);});
    await _closeBrowser();
    networkHandler.resetInterceptors();
    return { description: 'Browser closed' };
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
                    .catch(() => {});
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
 * switchTo('https://taiko.gauge.org/') - switch using URL
 * switchTo('Taiko') - switch using Title
 *
 * @param {string} targetUrl - URL/Page title of the tab to switch.
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
module.exports.switchTo = async (targetUrl) => {
    const target = await targetHandler.getCriTarget(targetUrl);
    await connect_to_cri(target);
    await dom.getDocument();
    return { description: `Switched to tab with url "${targetUrl}"` };
};

/**
 * Add interceptor for the network call to override request or mock response.
 *
 * @example
 * case 1: block url => intercept(url)
 * case 2: mockResponse => intercept(url,{mockObject})
 * case 3: override request => intercept(url,(request) => {request.continue({overrideObject})})
 * case 4: redirect => intercept(url,redirectUrl)
 * case 5: mockResponse based on request => intercept(url,(request) => { request.respond({mockResponseObject})} )
 *
 * @param {string} requestUrl request URL to intercept
 * @param {function|object}option action to be done after interception. For more examples refer to https://github.com/getgauge/taiko/issues/98#issuecomment-42024186
 * @returns {object} Object with the description of the action performed.
 */
module.exports.intercept = async (requestUrl, option) => {
    await networkHandler.addInterceptor({ requestUrl: requestUrl, action: option });
    return { description: `Interceptor added for ${requestUrl}` };
};

/**
 * Set network emulation
 *
 * @example
 * emulateNetwork("offline")
 * emulateNetwork("Good2G")
 *
 * @param {String} networkType - 'GPRS','Regular2G','Good2G','Good3G','Regular3G','Regular4G','DSL','WiFi'
 * @returns {Promise<Object>} - Object with the description of the action performed
 */

module.exports.emulateNetwork = async (networkType) => {
    await networkHandler.setNetworkEmulation(networkType);
    return { description: `Set network emulation with values ${JSON.stringify(networkType)}` };
};

/**
 * Allows to simulate device viewport
 * 
 * @example
 * emulateDevice('iPhone 6')
 * 
 * @param {string} deviceModel
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */

module.exports.emulateDevice = emulateDevice;
async function emulateDevice(deviceModel) {
    const deviceEmulate = devices[deviceModel];
    let deviceNames = Object.keys(devices);
    if (deviceEmulate == undefined) 
        throw new Error(`Please set one of the given device model ${deviceNames.join('\n')}`);
    await Promise.all([
        emulationHandler.setViewport(deviceEmulate.viewport),
        network.setUserAgentOverride({userAgent:deviceEmulate.userAgent})
    ]);
    return {description: `Device emulation set to ${deviceModel}`};
}

/**
 * Sets page viewport
 *
 * @example
 * setViewPort({width:600,height:800})
 *
 * @param {Object} options - https://chromedevtools.github.io/devtools-protocol/tot/Emulation#method-setDeviceMetricsOverride
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
module.exports.setViewPort = async (options) => {
    await emulationHandler.setViewport(options);
    return { description: `ViewPort is set to width ${options.width} and height ${options.height}` };
};

/**
 * Launches a new tab with given url.
 *
 * @example
 * openTab('https://taiko.gauge.org/')
 *
 * @param {string} targetUrl - URL/Page title of the tab to switch.
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
module.exports.openTab = async (targetUrl, options = { timeout: 30000 }) => {
    if (!/^https?:\/\//i.test(targetUrl) && !/^file/i.test(targetUrl)) targetUrl = 'http://' + targetUrl;
    const promises = [
        new Promise((resolve) => {
            xhrEvent.addListener('targetNavigated', resolve);
        }),
        new Promise((resolve) => {
            xhrEvent.addListener('networkIdle', resolve);
        }),
        new Promise((resolve) => {
            xhrEvent.addListener('loadEventFired', resolve);
        }),
        new Promise((resolve) => {
            xhrEvent.addListener('firstMeaningfulPaint', resolve);
        })
    ];
    await criTarget.createTarget({ url: targetUrl });
    await waitForNavigation(options.timeout, promises).catch(handleTimeout(options.timeout));
    xhrEvent.removeAllListeners();
    return { description: `Opened tab with url "${targetUrl}"` };
};

/**
 * Closes the given tab with given url or closes current tab.
 *
 * @example
 * closeTab() - Closes the current tab.
 * closeTab('https://gauge.org') - Closes the tab with url 'https://gauge.org'.
 *
 * @param {string} targetUrl - URL/Page title of the tab to switch.
 * @returns {Promise<Object>} - Object with the description of the action performed.
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
        return { description: 'Closing last target and browser.' };
    }
    await cri.Close({ host: currentHost, port: currentPort, id: target.id });
    await connect_to_cri(targetHandler.constructCriTarget(targetToConnect));
    await dom.getDocument();
    return { description: `Closed tab with url "${targetUrl}"` };
};

/**
 * Override browser permissions
 *
 * @example
 * overridePermissions('http://maps.google.com',['geolocation']);
 *
 * @param {string} origin
 * @param {!Array<string>} permissions https://chromedevtools.github.io/devtools-protocol/tot/Browser/#type-PermissionType
 */
module.exports.overridePermissions = async (origin, permissions) => {
    await browserHandler.overridePermissions(origin, permissions);
    return { description: `Override permissions with ${permissions}`};
};

/**
 * clears all the permissions set
 *
 * @example
 * clearPermissionOverrides()
 *
 */
module.exports.clearPermissionOverrides = async () => {
    await browserHandler.clearPermissionOverrides();
    return { description: 'Cleared permission overrides'};
};

/**
 * Sets a cookie with the given cookie data; may overwrite equivalent cookie if they exist.
 *
 * @example
 * setCookie("CSRFToken","csrfToken", {url: "http://the-internet.herokuapp.com"})
 * setCookie("CSRFToken","csrfToken", {domain: "herokuapp.com"})
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
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
module.exports.setCookie = async (name, value, options = {}) => {
    validate();
    if (options.url === undefined && options.domain === undefined) throw new Error('Atleast URL or Domain needs to be specified for setting cookies');
    options.name = name;
    options.value = value;
    await network.setCookie(options);
    return { description: `"${name}" cookie set successfully` };
};

/**
 * Clears browser cookies.
 *
 * @example
 * clearBrowserCookies()
 *
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
module.exports.clearBrowserCookies = async () => {
    validate();
    await network.clearBrowserCookies();
    return { description: 'Browser cookies deleted successfully' };
};

/**
 * Deletes browser cookies with matching name and url or domain/path pair.
 *
 * @example
 * deleteCookies("CSRFToken", {url: "http://the-internet.herokuapp.com"})
 * deleteCookies("CSRFToken", {domain: "herokuapp.com"})
 *
 * @param {string} cookieName - Cookie name.
 * @param {Object} options
 * @param {string} [options.url='http://www.google.com'] - deletes all the cookies with the given name where domain and path match provided URL.
 * @param {string} [options.domain='herokuapp.com'] - deletes only cookies with the exact domain.
 * @param {string} [options.path='Google/Chrome/Default/Cookies/..'] - deletes only cookies with the exact path.
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
module.exports.deleteCookies = async (cookieName, options = {}) => {
    validate();
    if (options.url === undefined && options.domain === undefined) throw new Error('Atleast URL or Domain needs to be specified for deleting cookies');
    options.name = cookieName;
    await network.deleteCookies(options);
    return { description: `"${cookieName}" cookie deleted successfully` };
};

/**
 * Get browser cookies
 * 
 * @example 
 * getCookies() 
 * getCookies({urls:['https://the-internet.herokuapp.com']})
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
 * overridePermissions("https://the-internet.herokuapp.com/geolocation",['geolocation'])
 * setLocation({ latitude: 27.1752868, longitude: 78.040009, accuracy:20 })
 * 
 * @param {object} - { latitude: 27.1752868, longitude: 78.040009, accuracy:20 }
 * @returns {Promise<Object>} - Object with the description of the action performed
 */
module.exports.setLocation = async(options) => {
    await emulationHandler.setLocation(options);
    return { description: 'Geolocation set' };
};

/**
 * Opens the specified URL in the browser's tab. Adds `http` protocol to the URL if not present.
 *
 * @example
 * goto('https://google.com')
 * goto('google.com')
 *
 * @param {string} url - URL to navigate page to.
 * @param {boolean} [options.waitForNavigation=false] - Skip to navigation - default is true
 * @param {Object} options - {timeout:5000, headers:{'Authorization':'Basic cG9zdG1hbjpwYXNzd29y2A=='}} Default timeout is 30 seconds to override set options = {timeout:10000}, headers to override defaults.
 * @returns {Promise<Object>} - Object with the description of the action performed and the final URL.
 */
module.exports.goto = async (url, options = { timeout: 30000 }) => {
    validate();
    options.waitForNavigation = options.waitForNavigation === undefined || options.waitForNavigation === null ?
        true : options.waitForNavigation;
    options.timeout = options.timeout || default_timeout;
    if (!/^https?:\/\//i.test(url) && !/^file/i.test(url)) url = 'http://' + url;
    const promises = [
        new Promise((resolve) => {
            xhrEvent.addListener('loadEventFired', resolve);
        }),
        new Promise((resolve) => {
            xhrEvent.addListener('networkIdle', resolve);
        }),
        new Promise((resolve) => {
            xhrEvent.addListener('firstMeaningfulPaint', resolve);
        })
    ];
    let func = addPromiseToWait(promises);
    xhrEvent.addListener('xhrEvent', func);
    xhrEvent.addListener('frameEvent', func);
    xhrEvent.addListener('frameNavigationEvent', func);
    if (options.headers) await network.setExtraHTTPHeaders({ headers: options.headers });
    const res = await page.navigate({ url: url });
    if (res.errorText) throw new Error(`Navigation to url ${url} failed.\n REASON: ${res.errorText}`);
    if (options.waitForNavigation) await waitForNavigation(options.timeout, promises).catch(handleTimeout(options.timeout));
    xhrEvent.removeAllListeners();
    return { description: `Navigated to url "${url}"`, url: url };
};

/**
 * Reloads the page.
 *
 * @example
 * reload('https://google.com')
 * reload('https://google.com', { timeout: 30000 })
 *
 * @param {string} url - URL to reload
 *  @param {Object} options
 * @returns {Promise<Object>} - Object with the description of the action performed and the final URL.
 */
module.exports.reload = async (url, options = { timeout: 30000 } ) => {
    validate();
    const promises = [
        new Promise((resolve) => {
            xhrEvent.addListener('loadEventFired', resolve);
        }),
        new Promise((resolve) => {
            xhrEvent.addListener('networkIdle', resolve);
        }),
        new Promise((resolve) => {
            xhrEvent.addListener('firstMeaningfulPaint', resolve);
        })
    ];
    let func = addPromiseToWait(promises);
    xhrEvent.addListener('xhrEvent', func);
    xhrEvent.addListener('frameEvent', func);
    xhrEvent.addListener('frameNavigationEvent', func);
    await page.reload(url);
    await waitForNavigation(options.timeout, promises).catch(handleTimeout(options.timeout));
    xhrEvent.removeAllListeners();
    url = url !== undefined && url !== null ? url : (await runtimeHandler.runtimeEvaluate('window.location.toString()')).result.value;
    return { description: `"${url}" reloaded`, url: url};
};

/**
 * Mimics browser back button click functionality.
 *
 * @example
 * goBack()
 *
 * @param {Object} options
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */

module.exports.goBack = async (options = {timeout: 30000}) =>{
    validate();
    await _go(-1, options);
    return { description: 'Performed clicking on browser back button' };
};

/**
 * Mimics browser forward button click functionality.
 *
 * @example
 * goForward()
 *
 * @param {Object} options
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */

module.exports.goForward = async (options = {timeout: 30000}) =>{
    validate();
    await _go(+1, options);
    return { description: 'Performed clicking on browser forward button' };
};

const _go = async (delta, options = {timeout: 30000}) =>{
    const history = await page.getNavigationHistory();
    const entry = history.entries[history.currentIndex + delta];

    const promises = [
        new Promise((resolve) => {
            xhrEvent.addListener('loadEventFired', resolve);
        }),
        new Promise((resolve) => {
            xhrEvent.addListener('networkIdle', resolve);
        }),
        new Promise((resolve) => {
            xhrEvent.addListener('firstMeaningfulPaint', resolve);
        })
    ];

    if (!entry)
        return null;

    await page.navigateToHistoryEntry({entryId: entry.id});
    const currentIndex = (await page.getNavigationHistory()).currentIndex;
    if(currentIndex != 0) await waitForNavigation(options.timeout, promises).catch(handleTimeout(options.timeout));
};

/**
 * Returns window's current URL.
 * @example
 * openBrowser();
 * goto("www.google.com");
 * currentURL();
 * returns "https://www.google.com/?gws_rd=ssl"
 *
 * @returns {Promise<String>}
 */
module.exports.currentURL = async () => {
    validate();
    const locationObj = await runtimeHandler.runtimeEvaluate('window.location.toString()');
    return(locationObj.result.value);
};

/**
 * Returns page's title.
 *
 * @returns {Promise<String>}
 */
module.exports.title = async () => {
    validate();
    const result = await runtimeHandler.runtimeEvaluate('document.querySelector("title").textContent');
    return result.result.value;
};

const setNavigationOptions = (options) => {
    options.awaitNavigation = options.waitForNavigation === undefined || options.waitForNavigation === null ?
        true : options.waitForNavigation;
    options.timeout = options.timeout || default_timeout;
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
        const value = this.getBoundingClientRect();
        const y = (value.top + value.bottom)/2;
        const x = (value.left + value.right)/2;
        const node = document.elementFromPoint(x, y);
        return this.contains(node) ||
            (window.getComputedStyle(node).getPropertyValue('opacity') < 0.1) ||
            (window.getComputedStyle(this).getPropertyValue('opacity') < 0.1);
    }

    const res = await runtimeHandler.runtimeCallFunctionOn(isElementAtPointOrChild,null,{nodeId:e});
    return res.result.value;
};

const getChildNodes = async (element) => {
    function getChild() {
        return this.childNodes;
    }
    const res = await evaluate(element, getChild);
    const childNodes = await runtimeHandler.getNodeIdsFromResult({result:res});
    return childNodes;
};

const checkIfChildOfOtherMatches = async (elem, elements) => {
    function getElementFromPoint(){
        let value = this.getBoundingClientRect();
        const y = (value.top + value.bottom)/2;
        const x = (value.left + value.right)/2;
        return document.elementFromPoint(x,y);
    }
    const result = await runtimeHandler.runtimeCallFunctionOn(getElementFromPoint,null,{nodeId:elem});
    if(result.result.value === null) return false;
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
 *
 * @example
 * click('Get Started')
 * click(link('Get Started'))
 *
 * @param {selector|string} selector - A selector to search for element to click. If there are multiple elements satisfying the selector, the first will be clicked.
 * @param {Object} options - Click options.
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the click. Default navigation timeout is 15 seconds, to override pass `{ timeout: 10000 }` in `options` parameter.
 * @param {number} [options.waitForStart=500] - wait for navigation to start. Default to 500ms
 * @param {number} [options.timeout=5000] - Timeout value in milliseconds for navigation after click.
 * @param {string} [options.button='left'] - `left`, `right`, or `middle`.
 * @param {number} [options.clickCount=1] - Number of times to click on the element.
 * @param {number} [options.elementsToMatch=10] - Number of elements to loop through to match the element with given selector.
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
module.exports.click = click;

async function click(selector, options = {}, ...args) {
    validate();
    if (options instanceof RelativeSearchElement) {
        args = [options].concat(args);
        options = {};
    }
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
        throw Error(description(selector) + ' is coverred by other element');
    await doActionAwaitingNavigation(options, async () => {
        options.type = 'mouseMoved';
        await input.dispatchMouseEvent(options);
        options.type = 'mousePressed';
        await input.dispatchMouseEvent(options);
        options.type = 'mouseReleased';
        await input.dispatchMouseEvent(options);
    });
    return { description: 'Clicked ' + description(selector, true) };
}

/**
 * Fetches an element with the given selector, scrolls it into view if needed, and then double clicks the element. If there's no element matching selector, the method throws an error.
 *
 * @example
 * doubleClick('Get Started')
 * doubleClick(button('Get Started'))
 *
 * @param {selector|string} selector - A selector to search for element to click. If there are multiple elements satisfying the selector, the first will be double clicked.
 * @param {Object} options - Click options.
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the click. Default navigation timout is 15 seconds, to override pass `{ timeout: 10000 }` in `options` parameter.
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
module.exports.doubleClick = async (selector, options = {}, ...args) => {
    if (options instanceof RelativeSearchElement) {
        args = [options].concat(args);
        options = {};
    }
    options = {
        waitForNavigation: options.waitForNavigation !== undefined ? options.waitForNavigation : false,
        clickCount: 2
    };
    await click(selector, options, ...args);
    return { description: 'Double clicked ' + description(selector, true) };
};

/**
 * Fetches an element with the given selector, scrolls it into view if needed, and then right clicks the element. If there's no element matching selector, the method throws an error.
 *
 * @example
 * rightClick('Get Started')
 * rightClick(text('Get Started'))
 *
 * @param {selector|string} selector - A selector to search for element to right click. If there are multiple elements satisfying the selector, the first will be double clicked.
 * @param {Object} options - Click options.
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the click. Default navigation timout is 15 seconds, to override pass `{ timeout: 10000 }` in `options` parameter.
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
module.exports.rightClick = async (selector, options = {}, ...args) => {
    if (options instanceof RelativeSearchElement) {
        args = [options].concat(args);
        options = {};
    }
    options = {
        waitForNavigation: options.waitForNavigation !== undefined ? options.waitForNavigation : false,
        button: 'right'
    };
    await click(selector, options, ...args);
    return { description: 'Right clicked ' + description(selector, true) };
};

/**
 * Fetches the source element with given selector and moves it to given destination selector or moves for given distance. If there's no element matching selector, the method throws an error.
 *Drag and drop of HTML5 draggable does not work as expected. Issue tracked here https://github.com/getgauge/taiko/issues/279
 *
 * @example
 * dragAndDrop($("work"),into($('work done')))
 * dragAndDrop($("work"),{up:10,down:10,left:10,right:10})
 *
 * @param {selector|string} source - Element to be Dragged
 * @param {selector|string} destination - Element for dropping the dragged element
 * @param {object} distance - Distance to be moved from position of source element
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
module.exports.dragAndDrop = async (source,destination) =>{
    let sourceElem = await element(source);
    let destElem = isSelector(destination) || isString(destination) ? await element(destination) : destination;
    let options = setOptions({});
    await doActionAwaitingNavigation(options, async () => {
        if (headful) {
            await highlightElemOnAction(sourceElem);
            if(!isNaN(destElem))await highlightElemOnAction(destElem);
        }
        await dragAndDrop(options, sourceElem, destElem);
    });
    const desc = !isNaN(destElem) ? `Dragged and dropped ${description(source,true)} to ${description(destination,true)}}`:
        `Dragged and dropped ${description(source,true)} at ${JSON.stringify(destination)}`;
    return {description: desc};
};

const dragAndDrop = async (options, sourceElem, destElem) =>{
    let sourcePosition = await domHandler.boundingBoxCenter(sourceElem);
    await scrollTo(sourceElem);
    options.x = sourcePosition.x;
    options.y = sourcePosition.y;
    options.type = 'mouseMoved';
    await input.dispatchMouseEvent(options);
    options.type = 'mousePressed';
    await input.dispatchMouseEvent(options);
    let destPosition = await calculateDestPosition(sourceElem, destElem);
    await inputHandler.mouse_move(sourcePosition,destPosition);
    options.x = destPosition.x;
    options.y = destPosition.y;
    options.type = 'mouseReleased';
    await input.dispatchMouseEvent(options);
};

const calculateDestPosition = async (sourceElem, destElem) => {
    if(!isNaN(destElem)){
        await scrollTo(destElem);
        return await domHandler.boundingBoxCenter(destElem);
    }
    const destPosition = await domHandler.calculateNewCenter(sourceElem,destElem);
    const newBoundary = destPosition.newBoundary;
    if(headful) {
        await overlay.highlightQuad({ quad: [newBoundary.right,newBoundary.top,newBoundary.right,newBoundary.bottom,newBoundary.left,newBoundary.bottom,newBoundary.left,newBoundary.top], outlineColor: { r: 255, g: 0, b: 0 } });
        await waitFor(1000);
        await overlay.hideHighlight();
    }
    return destPosition;
};

/**
 * Fetches an element with the given selector, scrolls it into view if needed, and then hovers over the center of the element. If there's no element matching selector, the method throws an error.
 *
 * @example
 * hover('Get Started')
 * hover(link('Get Started'))
 *
 * @param {selector|string} selector - A selector to search for element to right click. If there are multiple elements satisfying the selector, the first will be hovered.
 * @returns {Promise<Object>} - Object with the description of the action performed.
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
    return { description: 'Hovered over the ' + description(selector, true) };
};

/**
 * Fetches an element with the given selector and focuses it. If there's no element matching selector, the method throws an error.
 *
 * @example
 * focus(textField('Username:'))
 *
 * @param {selector|string} selector - A selector of an element to focus. If there are multiple elements satisfying the selector, the first will be focused.
 * @param {object} options - {waitForNavigation:true,waitForStart:500,timeout:10000}
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
module.exports.focus = async (selector, options = {}) => {
    validate();
    options = setNavigationOptions(options);
    await doActionAwaitingNavigation(options, async () => {
        if (headful) await highlightElemOnAction(await element(selector));
        await _focus(selector);
    });
    return { description: 'Focussed on the ' + description(selector, true) };
};

/**
 * Types the given text into the focused or given element.
 *
 * @example
 * write('admin', into('Username:'))
 * write('admin', 'Username:')
 * write('admin')
 *
 * @param {string} text - Text to type into the element.
 * @param {selector|string} [into] - A selector of an element to write into.
 * @param {Object} [options]
 * @param {number} options.delay - Time to wait between key presses in milliseconds.
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the click. Default navigation timeout is 15 seconds, to override pass `{ timeout: 10000 }` in `options` parameter.
 * @param {number} [options.waitForStart=500] - wait for navigation to start. Default to 500ms
 * @param {number} [options.timeout=5000] - Timeout value in milliseconds for navigation after click
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
module.exports.write = async (text, into, options = { delay: 10 }) => {
    validate();
    let desc;
    if (into && !isSelector(into)) {
        if(!into.delay) into.delay = options.delay;
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
    return { description: desc };
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
 * clear()
 * clear(inputField({placeholder:'Email'}))
 *
 * @param {selector} selector - A selector to search for element to clear. If there are multiple elements satisfying the selector, the first will be cleared.
 * @param {Object} options - Click options.
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after clear. Default navigation timeout is 15 seconds, to override pass `{ timeout: 10000 }` in `options` parameter.
 * @param {number} [options.waitForStart=500] - wait for navigation to start. Default to 500ms
 * @param {number} [options.timeout=5000] - Timeout value in milliseconds for navigation after click.
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
module.exports.clear = async (selector, options = {}) => {
    options = setNavigationOptions(options);
    if(selector)await _focus(selector);
    const activeElement = await runtimeHandler.activeElement();
    if (activeElement.notWritable)
        throw new Error('Element cannot be cleared');
    const desc = !selector ? { description: 'Cleared element on focus' } :
        { description: 'Cleared ' + description(selector, true) };
    await doActionAwaitingNavigation(options, async () => {
        await _clear(activeElement.nodeId);
        if (headful) await highlightElemOnAction(activeElement.nodeId);
    });
    return desc;
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
 * attach('c:/abc.txt', to('Please select a file:'))
 * attach('c:/abc.txt', 'Please select a file:')
 *
 * @param {string} filepath - The path of the file to be attached.
 * @param {selector|string} to - The file input element to which to attach the file.
 * @returns {Promise<Object>} - Object with the description of the action performed.
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
    return { description: `Attached ${resolvedPath} to the ` + description(to, true) };
};

/**
 * Presses the given keys.
 *
 * @example
 * press('Enter')
 * press('a')
 * press(['Shift', 'ArrowLeft', 'ArrowLeft'])
 *
 * @param {string | Array<string> } keys - Name of keys to press, such as ArrowLeft. See [USKeyboardLayout](https://github.com/getgauge/taiko/blob/master/lib/USKeyboardLayout.js) for a list of all key names.
 * @param {Object} options
 * @param {string} [options.text] - If specified, generates an input event with this text.
 * @param {number} [options.delay=0] - Time to wait between keydown and keyup in milliseconds.
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the click. Default navigation timeout is 15 seconds, to override pass `{ timeout: 10000 }` in `options` parameter.
 * @param {number} [options.waitForStart=500] - wait for navigation to start. Default to 500ms
 * @param {number} [options.timeout=5000] - Timeout value in milliseconds for navigation after click.
 * @returns {Promise<Object>} - Object with the description of the action performed.
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
    return { description: `Pressed the ${keys.reverse().join(' + ')} key` };
}


/**
 * Highlights the given element on the page by drawing a red rectangle around it. This is useful for debugging purposes.
 *
 * @example
 * highlight('Get Started')
 * highlight(link('Get Started'))
 *
 * @param {selector|string} selector - A selector of an element to highlight. If there are multiple elements satisfying the selector, the first will be highlighted.
  * @param {...relativeSelector} args - Proximity selectors
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
module.exports.highlight = highlight;

async function highlight(selector, ...args) {
    validate();

    function highlightNode() {
        this.style.border = '0.5em solid red';
        return true;
    }
    let elems = await handleRelativeSearch(await elements(selector), args);
    await evaluate(elems[0], highlightNode);
    return { description: 'Highlighted the ' + description(selector, true) };
}

/**
 * Scrolls the page to the given element.
 *
 * @example
 * scrollTo('Get Started')
 * scrollTo(link('Get Started'))
 *
 * @param {selector|string} selector - A selector of an element to scroll to.
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
module.exports.scrollTo = async (selector, options = {}) => {
    options = setNavigationOptions(options);
    await doActionAwaitingNavigation(options, async () => {
        await scrollTo(selector);
    });
    if (headful) await highlightElemOnAction(await element(selector));
    return { description: 'Scrolled to the ' + description(selector, true) };
};

async function scrollTo(selector) {
    validate();

    function scrollToNode() {
        this.scrollIntoViewIfNeeded();
        return 'result';
    }
    await evaluate(selector, scrollToNode);
}

const scroll = async (e, px, scrollPage, scrollElement, direction) => {
    e = e || 100;
    if (Number.isInteger(e)) {
        const res = await runtimeHandler.runtimeEvaluate(`(${scrollPage}).apply(null, ${JSON.stringify([e])})`);
        if(res.result.subtype == 'error') throw new Error(res.result.description);
        return { description: `Scrolled ${direction} the page by ${e} pixels` };
    }

    const nodeId = await element(e);
    if (headful) await highlightElemOnAction(nodeId);
    //TODO: Allow user to set options for scroll
    const options = setNavigationOptions({});
    await doActionAwaitingNavigation(options, async () => {
        const res = await runtimeHandler.runtimeCallFunctionOn(scrollElement,null,{nodeId:nodeId,arg:px});
        if(res.result.subtype == 'error') throw new Error(res.result.description);
    });
    return { description: `Scrolled ${direction} ` + description(e, true) + ` by ${px} pixels` };
};

/**
 * Scrolls the page/element to the right.
 *
 * @example
 * scrollRight()
 * scrollRight(1000)
 * scrollRight('Element containing text')
 * scrollRight('Element containing text', 1000)
 *
 * @param {selector|string|number} [e='Window']
 * @param {number} [px=100]
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
module.exports.scrollRight = async (e, px = 100) => {
    validate();
    return await scroll(e, px, px => window.scrollBy(px, 0),
        function sr(px) {
            if(this.tagName === 'IFRAME') {
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
 * scrollLeft()
 * scrollLeft(1000)
 * scrollLeft('Element containing text')
 * scrollLeft('Element containing text', 1000)
 *
 * @param {selector|string|number} [e='Window']
 * @param {number} [px=100]
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
module.exports.scrollLeft = async (e, px = 100) => {
    validate();
    return await scroll(e, px, px => window.scrollBy(px * -1, 0),
        function sl(px) {
            if(this.tagName === 'IFRAME') {
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
 * scrollUp()
 * scrollUp(1000)
 * scrollUp('Element containing text')
 * scrollUp('Element containing text', 1000)
 *
 * @param {selector|string|number} [e='Window']
 * @param {number} [px=100]
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
module.exports.scrollUp = async (e, px = 100) => {
    validate();
    return await scroll(e, px, px => window.scrollBy(0, px * -1),
        function su(px) {
            if(this.tagName === 'IFRAME') {
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
 * scrollDown()
 * scrollDown(1000)
 * scrollDown('Element containing text')
 * scrollDown('Element containing text', 1000)
 *
 * @param {selector|string|number} [e='Window']
 * @param {number} [px=100]
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
module.exports.scrollDown = async (e, px = 100) => {
    validate();
    return await scroll(e, px, px => window.scrollBy(0, px),
        function sd(px) {
            if(this.tagName === 'IFRAME') {
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
 * screenshot()
 * screenshot({path : 'screenshot.png'})
 * screenshot({fullPage:true})
 * screenshot(text('Images', toRightOf('gmail')))
 *
 * @param {object} options - {path:'screenshot.png', fullPage:true, padding:16} or {encoding:'base64'}
 * @returns {Promise<Buffer>} - Promise which resolves to buffer with captured screenshot if {encoding:'base64} given.
 * @returns {Promise<object>} - Object with the description of the action performed
 */
module.exports.screenshot = async ( options = {}, selector, ...args) => {
    validate();
    options.path = options.path || `Screenshot-${Date.now()}.png`;
    let screenShot;
    let clip;
    if (isSelector(selector)) {
        if (options.fullPage) console.warn('Ignoring fullPage screenshot as custom selector is found!');
        let padding = options.padding || 0;
        let elems = await handleRelativeSearch(await elements(selector), args);
        const { x , y, width, height } = await domHandler.boundBox(elems[0]);
        clip = { 
            x: x - padding, 
            y: y - padding, 
            width: width + padding * 2, 
            height: height + padding * 2, 
            scale: 1 };
        screenShot = await page.captureScreenshot({ clip });
    } else if (options.fullPage) {
        const  metrics  = await page.getLayoutMetrics();
        const width = Math.ceil(metrics.contentSize.width);
        const height = Math.ceil(metrics.contentSize.height);
        clip = { x: 0, y: 0, width, height, scale: 1 };
        screenShot = await page.captureScreenshot({ clip });
    } else {
        screenShot = await page.captureScreenshot();
    }
    if (options.encoding === 'base64') return screenShot.data;
    fs.writeFileSync(options.path, Buffer.from(screenShot.data, 'base64'));
    return { description: `Screenshot is created at "${options.path}"` };
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
        exists: exists(getIfExists(get)),
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
    let xpath = tag;
    for (const key in attrValuePairs) {
        if (key === 'class') xpath += `[${key}*="${attrValuePairs[key]}"]`;
        else xpath += `[${key}="${attrValuePairs[key]}"]`;
    }
    return xpath;
};


const getElementGetter = (selector, query, tag) => {
    let get;
    if (selector.attrValuePairs) get = async () => await handleRelativeSearch(await $$(getQuery(selector.attrValuePairs, tag)), selector.args);
    else if (selector.label) get = async () => await handleRelativeSearch(await query(), selector.args);
    else get = async () => await handleRelativeSearch(await $$(tag), selector.args);
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
 * click(image('alt'))
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
    const get = getElementGetter(selector, async () => await $$xpath(`//img[contains(@alt, ${xpath(selector.label)})]`), 'img');
    return { get: getIfExists(get), exists: exists(getIfExists(get)), description: desc(selector, 'alt', 'Image'), text: selectorText(get) };
};

/**
 * This {@link selector} lets you identify a link on a web page with text or attribute and value pairs.
 *
 * @example
 * click(link('Get Started'))
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
    const get = getElementGetter(selector, async () => await elements(selector.label, 'a'), 'a');
    return { get: getIfExists(get), exists: exists(getIfExists(get)), description: desc(selector, 'text', 'Link'), text: selectorText(get) };
};

/**
 * This {@link selector} lets you identify a list item (HTML <li> element) on a web page with label or attribute and value pairs.
 *
 * @example
 * highlight(listItem('Get Started'))
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
    const get = getElementGetter(selector, async () => await elements(selector.label, 'li'), 'li');
    return { get: getIfExists(get), exists: exists(getIfExists(get)), description: desc(selector, 'label', 'List item'), text: selectorText(get) };
};

/**
 * This {@link selector} lets you identify a button on a web page with label or attribute and value pairs.
 *
 * @example
 * highlight(button('Get Started'))
 * button('Get Started').exists()
 *
 * @param {string} label - The button label.
 * @param {object} attrValuePairs - Pairs of attribute and value like {"id":"name","class":"class-name"}
 * @param {...relativeSelector} args - Proximity selectors
 * @returns {ElementWrapper}
 */
module.exports.button = (attrValuePairs, ...args) => {
    validate();
    const selector = getValues(attrValuePairs, args);
    const get = getElementGetter(selector, async () => await elements(selector.label, 'button'), 'button');
    return { get: getIfExists(get), exists: exists(getIfExists(get)), description: desc(selector, 'label', 'Button'), text: selectorText(get) };
};

/**
 * This {@link selector} lets you identify an input field on a web page with label or attribute and value pairs.
 *
 * @example
 * focus(inputField({'id':'name'})
 * inputField({'id': 'name'}).exists()
 *
 * @param {object} attrValuePairs - Pairs of attribute and value like {"id":"name","class":"class-name"}
 * @param {...relativeSelector} args - Proximity selectors
 * @returns {ElementWrapper}
 */
module.exports.inputField = (attrValuePairs, ...args) => {
    validate();
    const selector = getValues(attrValuePairs, args);
    const get = getElementGetter(selector, async () =>
        await $$xpath(`//input[@id=(//label[contains(text(), ${xpath(selector.label)})]/@for)]`), 'input');
    return {
        get: getIfExists(get),
        exists: exists(getIfExists(get)),
        description: desc(selector, 'label', 'Input Field'),
        value: async () => {
            const nodeId = (await getIfExists(get)())[0];
            if(!nodeId) throw `${desc(selector, 'label', 'Input Field')} not found`;
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
        async () => await $$xpath(`//input[@type='file'][@id=(//label[contains(text(), ${xpath(selector.label)})]/@for)]`),
        'input[type="file"]');
    return {
        get: getIfExists(get),
        exists: exists(getIfExists(get)),
        value: async () => {
            const nodeId = (await getIfExists(get)())[0];
            if(!nodeId) throw `${desc(selector, 'label', 'File field')} not found`;
            return (await evaluate(nodeId, function getvalue() { return this.value; })).value;
        },
        description: desc(selector, 'label', 'File field'),
        text: selectorText(get)
    };
}

/**
 * This {@link selector} lets you identify a text field on a web page either with label or with attribute and value pairs.
 *
 * @example
 * focus(textField('Username:'))
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
    const selector = getValues(attrValuePairs, args);
    const get = getElementGetter(selector,
        async () => await $$xpath(`//input[@type='text'][@id=(//label[contains(text(), ${xpath(selector.label)})]/@for)]`),
        'input[type="text"]');
    return {
        get: getIfExists(get),
        exists: exists(getIfExists(get)),
        description: desc(selector, 'label', 'Text field'),
        value: async () => {
            const nodeId = (await getIfExists(get)())[0];
            if(!nodeId) throw `${desc(selector, 'label', 'Text field')} not found`;
            return (await evaluate(nodeId, function getvalue() { return this.value; })).value;
        },
        text: selectorText(get)
    };
}

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
 * @returns {ElementWrapper}
 */
module.exports.comboBox = (attrValuePairs, ...args) => {
    validate();
    const selector = getValues(attrValuePairs, args);
    const get = getElementGetter(selector,
        async () => await $$xpath(`//select[@id=(//label[contains(text(), ${xpath(selector.label)})]/@for)]`),
        'select');
    return {
        get: getIfExists(get),
        exists: exists(getIfExists(get)),
        description: desc(selector, 'label', 'Combobox'),
        select: async (value) => {

            const nodeId = (await getIfExists(get)())[0];
            if(!nodeId) throw `${desc(selector, 'label', 'Combobox')} not found`;
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
                const result = await runtimeHandler.runtimeCallFunctionOn(selectBox,null,{nodeId:nodeId,arg:value});
                if (!result.result.value) throw new Error('Option not available in combo box');
            });
        },
        value: async () => {
            const nodeId = (await getIfExists(get)())[0];
            if(!nodeId) throw `${desc(selector, 'label', 'Combobox')} not found`;
            return (await evaluate(nodeId, function getvalue() { return this.value; })).value;
        },
        text: selectorText(get)
    };
};

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
 * @returns {ElementWrapper}
 */
module.exports.checkBox = (attrValuePairs, ...args) => {
    validate();
    const selector = getValues(attrValuePairs, args);
    const get = getElementGetter(selector,
        async () => await $$xpath(`//input[@type='checkbox'][@id=(//label[contains(text(), ${xpath(selector.label)})]/@for)]`),
        'input[type="checkbox"]');
    return {
        get: getIfExists(get),
        exists: exists(getIfExists(get)),
        description: desc(selector, 'label', 'Checkbox'),
        isChecked: async () => {
            const nodeId = (await getIfExists(get)())[0];
            if(!nodeId) throw `${desc(selector, 'label', 'Checkbox')} not found`;
            return (await evaluate(nodeId, function getvalue() { return this.checked; })).value;
        },
        check: async () => {
            const options = setNavigationOptions({});
            await doActionAwaitingNavigation(options, async () => {
                const nodeId = (await getIfExists(get)())[0];
                if(!nodeId) throw `${desc(selector, 'label', 'Checkbox')} not found`;
                if (headful) await highlightElemOnAction(nodeId);
                await evaluate(nodeId, function getvalue() { this.checked = true; return true; });
            });
        },
        uncheck: async () => {
            const options = setNavigationOptions({});
            await doActionAwaitingNavigation(options, async () => {
                const nodeId = (await getIfExists(get)())[0];
                if(!nodeId) throw `${desc(selector, 'label', 'Checkbox')} not found`;
                if (headful) await highlightElemOnAction(nodeId);
                await evaluate(nodeId, function getvalue() { this.checked = false; return true; });
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
 * @returns {ElementWrapper}
 */
module.exports.radioButton = (attrValuePairs, ...args) => {
    validate();
    const selector = getValues(attrValuePairs, args);
    const get = getElementGetter(
        selector,
        async () => await $$xpath(`//input[@type='radio'][@id=(//label[contains(text(), ${xpath(selector.label)})]/@for)]`),
        'input[type="radio"]');
    return {
        get: getIfExists(get),
        exists: exists(getIfExists(get)),
        description: desc(selector, 'label', 'Radio Button'),
        isSelected: async () => {
            const nodeId = (await getIfExists(get)())[0];
            if(!nodeId) throw `${desc(selector, 'label', 'Radio Button')} not found`;
            return (await evaluate(nodeId, function getvalue() { return this.checked; })).value;
        },
        select: async () => {
            const options = setNavigationOptions({});
            await doActionAwaitingNavigation(options, async () => {
                const nodeId = (await getIfExists(get)())[0];
                if(!nodeId) throw `${desc(selector, 'label', 'Radio Button')} not found`;
                if (headful) await highlightElemOnAction(nodeId);
                await evaluate(nodeId, function getvalue() { this.checked = true; return true; });
            });
        },
        deselect: async () => {
            const options = setNavigationOptions({});
            await doActionAwaitingNavigation(options, async () => {
                const nodeId = (await getIfExists(get)())[0];
                if(!nodeId) throw `${desc(selector, 'label', 'Radio Button')} not found`;
                if (headful) await highlightElemOnAction(nodeId);
                await evaluate(nodeId, function getvalue() { this.checked = false; return true; });
            });
        },
        text: selectorText(get)
    };
};

/**
 * This {@link selector} lets you identify an element with text. Looks for exact match if not found does contains.
 *
 * @example
 * highlight(text('Vehicle'))
 * text('Vehicle').exists()
 *
 * @param {string} text - Text to match.
 * @param {...relativeSelector} args - Proximity selectors
 * @returns {ElementWrapper}
 */
module.exports.text = (text, ...args) => {
    validate();
    const get = async () => await handleRelativeSearch(await elements(text), args);
    return { get: getIfExists(get), exists: exists(getIfExists(get)), description: `Element with text "${text}"`, text: selectorText(get) };
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
    return { get: getIfExists(get), exists: exists(getIfExists(get)), description: `Element containing text "${text}"`, text: selectorText(get) };
}

function match(text, ...args) {
    validate();
    assertType(text);
    const get = async (e = '*') => {
        let xpathText = `translate(normalize-space(${xpath(text)}),"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz")`;
        let elements = await $$xpath('//' + e + `[translate(normalize-space(@value),"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz")=${xpathText} or translate(normalize-space(@type),"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz")=${xpathText}]`);
        if (!elements || !elements.length) {
            const xpathToText = xpath(text.toLowerCase());
            const xpathToTranslateInnerText = 'translate(normalize-space(.),"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz")';
            elements = await $$xpath('//' + e + `[not(descendant::*[${xpathToTranslateInnerText}=${xpathToText}]) and ${xpathToTranslateInnerText}=${xpathToText}]`);
        }
        if (!elements || !elements.length) elements = await $$xpath('//' + e + `[not(descendant::*[contains(translate(normalize-space(.),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'), ${xpath(text.toLowerCase())})]) and contains(translate(normalize-space(.),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'), ${xpath(text.toLowerCase())})]`);
        return await handleRelativeSearch(elements, args);
    };
    return { get: getIfExists(get), exists: exists(getIfExists(get)), description: `Element matching text "${text}"`, text: selectorText(get) };
}

/**
 * This {@link relativeSelector} lets you perform relative HTML element searches.
 *
 * @example
 * click(link("Block", toLeftOf("name"))
 *
 * @param {selector|string} selector - Web element selector.
 * @returns {RelativeSearchElement}
 */
module.exports.toLeftOf = selector => {
    validate();
    return new RelativeSearchElement(async (e, v) => {
        const rect = await domHandler.getBoundingClientRect(e);
        return rect.left < v;
    }, rectangle(selector, r => r.left), isString(selector) ? `To Left of ${selector}` : `To Left of ${selector.description}`);
};

/**
 * This {@link relativeSelector} lets you perform relative HTML element searches.
 *
 * @example
 * click(link("Block", toRightOf("name"))
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
        return rect.right > v;
    }, value, desc);
};

/**
 * This {@link relativeSelector} lets you perform relative HTML element searches.
 *
 * @example
 * click(link("Block", above("name"))
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
        return rect.top < v;
    }, value, desc);
};

/**
 * This {@link relativeSelector} lets you perform relative HTML element searches.
 *
 * @example
 * click(link("Block", below("name"))
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
        return rect.bottom > v;
    }, value, desc);
};

/**
 * This {@link relativeSelector} lets you perform relative HTML element searches.
 * An element is considered nearer to a reference element,
 * only if the element offset is lesser than the 30px of the reference element in any direction.
 * Default offset is 30 px to override set options = {offset:50}
 *
 * @example
 * click(link("Block", near("name"))
 * click(link("Block", near("name", {offset: 50}))
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
        return [rect.bottom, rect.top].some( ( offSet)=> offSet > (v.top - nearOffset) && offSet < (v.bottom + nearOffset)) &&
        [rect.left, rect.right].some( ( offSet)=> offSet > (v.left - nearOffset) && offSet < (v.right + nearOffset));

    }, value, desc);
};

/**
 * Lets you perform an operation when an `alert` with given text is shown.
 *
 * @example
 * alert('Message', async () => await dismiss())
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
 * evaluate(link("something"), (element) => element.style.backgroundColor)
 * evaluate(()=>{return document.title})
 *
 * @param {selector|string} selector - Web element selector.
 * @param {function} callback - callback method to execute on the element.
 * @param {Object} options - Click options.
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the click. Default navigation timeout is 15 seconds, to override pass `{ timeout: 10000 }` in `options` parameter.
 * @param {number} [options.waitForStart=500] - wait for navigation to start. Default to 500ms
 * @param {number} [options.timeout=5000] - Timeout value in milliseconds for navigation after click.
 * @returns {Promise<Object>} Object with description of action performed and return value of callback given
 */
module.exports.evaluate = async (selector, callback, options = {}) => {
    let result;
    if (isFunction(selector)) {
        callback = selector;
        selector = (await $$xpath('//*'))[0];
    }
    const nodeId = isNaN(selector) ? await element(selector) : selector;
    if (headful) await highlightElemOnAction(nodeId);

    async function evalFunc(callback) {
        let fn;
        eval(`fn = ${callback}`);
        return await fn(this);
    }

    options = setNavigationOptions(options);
    await doActionAwaitingNavigation(options, async () => {
        result = await runtimeHandler.runtimeCallFunctionOn(evalFunc,null,
            {nodeId:nodeId,arg:callback.toString(),returnByValue:true});
    });
    return { description: 'Evaluated given script. Result: ' + result.result.value, result: result.result.value };
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
 * attach('c:/abc.txt', to('Please select a file:'))
 *
 * @param {string|selector}
 * @return {string|selector}
 */
module.exports.to = e => e;

/**
 * This function is used to improve the readability. It simply returns the parameter passed into it.
 *
 * @example
 * write("user", into('Username:'))
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
 */
module.exports.accept = async () => {
    await page.handleJavaScriptDialog({
        accept: true,
    });
    return { description: 'Accepted dialog' };
};

/**
 * Dismiss callback for dialogs
 */
module.exports.dismiss = async () => {
    await page.handleJavaScriptDialog({
        accept: false
    });
    return { description: 'Dismissed dialog' };
};

const doActionAwaitingNavigation = async (options, action) => {
    let promises = [];
    const paintPromise = new Promise((resolve) => {
        xhrEvent.addListener('firstMeaningfulPaint', resolve);
    });
    let func = addPromiseToWait(promises);

    xhrEvent.addListener('xhrEvent', func);
    xhrEvent.addListener('frameEvent', func);
    xhrEvent.addListener('frameNavigationEvent', func);
    xhrEvent.addListener('firstPaint', () => promises.push(paintPromise));
    xhrEvent.once('targetCreated', () => {
        promises = [
            new Promise((resolve) => {
                xhrEvent.addListener('targetNavigated', resolve);
            }),
            new Promise((resolve) => {
                xhrEvent.addListener('firstMeaningfulPaint', resolve);
            })
        ];
    });

    await action();
    await waitForPromises(promises, options.waitForStart);
    if (options.awaitNavigation) {
        await waitForNavigation(options.timeout, promises).catch(handleTimeout(options.timeout));
    }
    xhrEvent.removeAllListeners();
};

const waitForPromises = (promises, waitForStart) => {
    return Promise.race([waitFor(waitForStart), new Promise(function waitForPromise(resolve) {
        if (promises.length) {
            const timeoutId = setTimeout(resolve,100);
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

const waitForNavigation = (timeout, promises = []) => {
    return new Promise((resolve, reject) => {
        Promise.all(promises).then(resolve);
        const timeoutId = setTimeout(() => reject('Timedout'), timeout);
        timeouts.push(timeoutId);
    });
};

const handleTimeout = (timeout) => {
    return (e) => {
        xhrEvent.removeAllListeners();
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
    page.javascriptDialogOpening(async ({ message, type }) => {
        if (dialogType === type && dialogMessage === message)
            await callback();
    });
};

const isSelector = obj => obj && obj['get'] && obj['exists'];

const filter_visible_nodes = async (nodeIds) => {
    let visible_nodes = [];

    function isHidden() {
        return this.offsetParent === null || this.offsetParent === undefined;
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
    var xpathFunc = function(selector){
        var result = [];
        var nodesSnapshot = document.evaluate(selector, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null );
        for ( var i=0 ; i < nodesSnapshot.snapshotLength; i++ ){
            result.push( nodesSnapshot.snapshotItem(i) );
        }
        return result;
    };
    return (await filter_visible_nodes(await runtimeHandler.findElements(xpathFunc,selector)));
};

const evaluate = async (selector, func) => {
    let nodeId = selector;
    if (isNaN(selector)) nodeId = await element(selector);
    const  { result } = await runtimeHandler.runtimeCallFunctionOn(func,null,{nodeId:nodeId});
    return result;
};

const validate = () => {
    if (!dom || !page) throw new Error('Browser or page not initialized. Call `openBrowser()` before using this API');
};

const assertType = (obj, condition = isString, message = 'String parameter expected') => {
    if (!condition(obj)) throw new Error(message);
};

const sleep = milliseconds => {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++)
        if ((new Date().getTime() - start) > milliseconds) break;
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

const exists = get => {
    return async () => {
        if ((await get()).length) return true;
        return false;
    };
};

const getIfExists = get => {
    return async (tag, intervalTime = 1000, timeout = 10000) => {
        try {
            await waitUntil(async () => (await get(tag)).length > 0, intervalTime, timeout);
            return await get(tag);
        } catch (e) {
            return [];
        }
    };
};

const waitUntil = async (condition, intervalTime, timeout) => {
    var start = new Date().getTime();
    while (true) {
        try {
            if (await condition()) break;
        } catch (e) { }
        if ((new Date().getTime() - start) > timeout)
            throw new Error(`waiting failed: timeout ${timeout}ms exceeded`);
        sleep(intervalTime);
    }
};

const xpath = s => `concat(${s.match(/[^'"]+|['"]/g).map(part => {
    if (part === '\'') return '"\'"';
    if (part === '"') return '\'"\'';
    return '\'' + part + '\'';
}).join(',') + ', ""'})`;

const rectangle = async (selector, callback) => {
    const elems = await elements(selector);
    let results = [];
    for (const e of elems) {
        const r = await domHandler.getBoundingClientRect(e);
        results.push({ elem: e, result: callback(r) });
    }
    return results;
};

const isRelativeSearch = args => args.every(a => a instanceof RelativeSearchElement);

const getMatchingNode = async (elements, args) => {
    const matchingNodes = [];
    for (const element of elements) {
        let valid = true;
        let dist = 0;
        for (const arg of args) {
            const relativeNode = await arg.validNodes(element);
            if (relativeNode === undefined) {
                valid = false;
                break;
            }
            dist += relativeNode.dist;
        }
        if (valid) matchingNodes.push({ element: element, dist: dist });
    }
    matchingNodes.sort(function (a, b) {
        return a.dist - b.dist;
    });
    return matchingNodes;
};

const handleRelativeSearch = async (elements, args) => {
    if (!args.length) return elements;
    if (!isRelativeSearch(args)) throw new Error('Invalid arguments passed, only relativeSelectors are accepted');
    const matchingNodes = await getMatchingNode(elements, args);
    return Array.from(matchingNodes, node => node.element);
};

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
class RelativeSearchElement {
    /**
     * @class
     * @ignore
     */
    constructor(condition, value, desc) {
        this.condition = condition;
        this.value = value;
        this.desc = desc;
    }

    async validNodes(nodeId) {
        let matchingNode, minDiff = Infinity;
        const results = await this.value;
        for (const result of results) {
            if (await this.condition(nodeId, result.result)) {
                const diff = await domHandler.getPositionalDifference(nodeId, result.elem);
                if (diff < minDiff) {
                    minDiff = diff;
                    matchingNode = { elem: result.elem, dist: diff };
                }
            }
        }
        return matchingNode;
    }

    toString() {
        return this.desc;
    }
}

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
for(const func in module.exports){
    realFuncs[func] = module.exports[func];
    if (realFuncs[func].constructor.name === 'AsyncFunction')
        module.exports[func] = async function(){
            if(observe){await waitFor(observeTime);}
            return await realFuncs[func].apply(this, arguments);
        };
}

module.exports.metadata = {
    'Browser actions': ['openBrowser', 'closeBrowser', 'client', 'switchTo', 'intercept', 'emulateNetwork', 'emulateDevice', 'setViewPort', 'openTab', 'closeTab', 'overridePermissions', 'clearPermissionOverrides', 'setCookie', 'clearBrowserCookies', 'deleteCookies', 'getCookies', 'setLocation'],
    'Page actions': ['goto', 'reload', 'goBack', 'goForward', 'currentURL', 'title', 'click', 'doubleClick', 'rightClick', 'dragAndDrop', 'hover', 'focus', 'write', 'clear', 'attach', 'press', 'highlight', 'scrollTo', 'scrollRight', 'scrollLeft', 'scrollUp', 'scrollDown', 'screenshot'],
    'Selectors': ['$', 'image', 'link', 'listItem', 'button', 'inputField', 'fileField', 'textField', 'comboBox', 'checkBox', 'radioButton', 'text', 'contains'],
    'Proximity selectors': ['toLeftOf', 'toRightOf', 'above', 'below', 'near'],
    'Events': ['alert', 'prompt', 'confirm', 'beforeunload'],
    'Helpers': ['evaluate', 'intervalSecs', 'timeoutSecs', 'to', 'into', 'waitFor', 'accept', 'dismiss']
};
