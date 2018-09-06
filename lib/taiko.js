const cri = require('chrome-remote-interface');
const childProcess = require('child_process');
const BrowserFetcher = require('./browserFetcher');
const { helper, assert } = require('./helper');
const boundingBox = require('./boundingBox');
const keyPress = require('./keyPress');
const networkHandler = require('./networkHandler');
const pageHandler = require('./pageHandler');
const targetHandler = require('./targetHandler');
const fs = require('fs');
const path = require('path');
const ChromiumRevision = require(path.join(helper.projectRoot(), 'package.json')).taiko.chromium_revision;
const EventEmiter = require('events').EventEmitter;
const xhrEvent = new EventEmiter();
const default_timeout = 5000;
let chromeProcess, page, network, runtime, input, client, dom, criTarget, rootId = null;

const connect_to_cri = async (target) => {
    return new Promise(async function connect(resolve) {
        try {
            if (!target) target = await cri.New({ host: '127.0.0.1', port: '9222' });
            await cri({ target }, async (c) => {
                client = c;
                page = c.Page;
                network = c.Network;
                runtime = c.Runtime;
                input = c.Input;
                dom = c.DOM;
                criTarget = c.Target;
                await Promise.all([network.enable(), page.enable(), dom.enable()]);
                await networkHandler.setNetwork(network, xhrEvent);
                await targetHandler.setTarget(criTarget, connect_to_cri);
                await pageHandler.setPage(page, xhrEvent, async function () {
                    rootId = null;
                    const { root: { nodeId } } = await dom.getDocument();
                    rootId = nodeId;
                });
                resolve();
            });
        } catch (e) { setTimeout(() => { connect(resolve); }, 1000); }
    });
};

/**
 * Launches a browser with a tab. The browser will be closed when the parent node.js process is closed.
 *
 * @example
 * openBrowser()
 * openBrowser({ headless: false })
 *
 * @param {Object} options {headless: true|false}.
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
module.exports.openBrowser = async (options = { headless: true }) => {
    const browserFetcher = new BrowserFetcher();
    const revisionInfo = browserFetcher.revisionInfo(ChromiumRevision);
    options.headless = options.headless === undefined || options.headless === null ? true : options.headless;
    let args = ['--remote-debugging-port=9222'];
    if (options.headless) args.push('--headless');
    if (options.args) args = args.concat(options.args);
    assert(revisionInfo.local, 'Chromium revision is not downloaded. Run "npm install"');
    const chromeExecutable = revisionInfo.executablePath;
    chromeProcess = childProcess.spawn(chromeExecutable, args);
    await connect_to_cri();
    return { description: 'Browser opened' };
};

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
    const { root: { nodeId } } = await dom.getDocument();
    rootId = nodeId;
    return { description: `Switched to tab with url "${targetUrl}"` };
};

/**
 * Gives CRI client object.
 *
 * @returns {Promise<string>}
 */
module.exports.client = () => client;

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
    if (client) {
        await client.close();
        client = null;
    }
    chromeProcess.kill('SIGTERM');
    return { description: 'Browser closed' };
};

/**
 * Opens the specified URL in the browser's tab. Adds `http` protocol to the URL if not present.
 *
 * @example
 * goto('https://google.com')
 * goto('google.com')
 *
 * @param {string} url - URL to navigate page to.
 * @param {Object} options - {timeout:5000} Default timeout is 5 seconds to override set options = {timeout:10000}
 * @returns {Promise<Object>} - Object with the description of the action performed and the final URL.
 */
module.exports.goto = async (url, options = { timeout: 5000 }) => {
    validate();
    if (!/^https?:\/\//i.test(url)) url = 'http://' + url;
    var promises = [page.loadEventFired(),page.frameStoppedLoading(),page.domContentEventFired()];
    let func = addPromiseToWait(promises);
    xhrEvent.addListener('xhrEvent', func);
    if (options.headers) await network.setExtraHTTPHeaders({ headers: options.headers });
    await page.navigate({ url: url });
    await waitForNavigation(options.timeout, promises).catch(handleTimeout(func, options.timeout));
    xhrEvent.removeListener('xhrEvent', func);
    return { description: `Navigated to url "${url}"`, url: url };
};

/**
 * Reloads the page.
 *
 * @example
 * reload('https://google.com')
 * reload('https://google.com', { timeout: 10000 })
 *
 * @returns {Promise<Object>} - Object with the description of the action performed and the final URL.
 */
module.exports.reload = async (url) => {
    validate();
    await page.reload(url);
    return { description: `"${url}" reloaded`, url: url };
};

/**
 * Returns page's title.
 *
 * @returns {Promise<String>}
 */
module.exports.title = async () => {
    validate();
    const result = await runtime.evaluate({
        expression: 'document.querySelector("title").textContent'
    });

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

const checkIfElementAtPointOrChild = async (e, x, y) => {

    function isElementAtPointOrChild(value) {
        const node = document.elementFromPoint(value.x, value.y);
        return this.contains(node) || 
            (window.getComputedStyle(node).getPropertyValue('opacity') < 0.1) || 
            (window.getComputedStyle(this).getPropertyValue('opacity') < 0.1) ;
    }

    const { object: { objectId } } = await dom.resolveNode({ nodeId: e });
    const res = await runtime.callFunctionOn({
        functionDeclaration: isElementAtPointOrChild.toString(),
        'arguments': [{ value: { x: x, y: y } }],
        objectId
    });
    return res.result.value;
};

const getChildNodes = async (element) => {
    function getChild() {
        return this.childNodes;
    }
    const childNodes = [];
    const res = await evaluate(element, getChild);
    const { result } = await runtime.getProperties(res);
    for (const r of result) {
        if (isNaN(r.name)) break;
        childNodes.push((await dom.requestNode({ objectId: r.value.objectId })).nodeId);
    }
    return childNodes;
};

const checkIfChildOfOtherMatches = async (elements, x, y) => {
    const result = await runtime.evaluate({ expression: `document.elementFromPoint(${x},${y})` });
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

const checkIfElementIsCovered = async (elem, x, y, elems, isElemAtPoint) => {
    isElemAtPoint = await checkIfElementAtPointOrChild(elem, parseInt(x), parseInt(y));
    //If element to be clicked and element at point are different check if it is any other element matching the selector
    if (!isElemAtPoint)
        isElemAtPoint = await checkIfChildOfOtherMatches(elems, parseInt(x), parseInt(y));
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
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the click. Default navigation timout is 2 seconds, to override pass `{ timeout: 10000 }` in `options` parameter.
 * @param {string} [options.button='left'] - `left`, `right`, or `middle`.
 * @param {number} [options.clickCount=1] - Number of times to click on the element.
 * @param {number} [options.timeout=5000] -TODO: Timeout value in milliseconds for navigation after click.
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
    const elems = (await handleRelativeSearch(await elements(selector), args)); 
    let elemsLength = elems.length;
    let isElemAtPoint;
    options = setOptions(options);
    if (elemsLength > options.elementsToMatch){
        elems.splice(options.elementsToMatch, elems.length);
    }
    for (let elem of  elems){
        const type = (await evaluate(elem, function getType() { return this.type; })).value;
        assertType(elem, () => type !== 'file', 'Unsupported operation, use `attach` on file input field');
        isElemAtPoint = false;
        await scrollTo(elem);
        const { x, y } = await boundingBox.boundingBoxCenter(dom, elem);
        isElemAtPoint = await checkIfElementIsCovered(elem, x, y, elems, isElemAtPoint);
        options = setOptions(options, x, y);
        if (isElemAtPoint) break;
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
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the click. Default navigation timout is 5 seconds, to override pass `{ timeout: 10000 }` in `options` parameter.
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
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the click. Default navigation timout is 5 seconds, to override pass `{ timeout: 10000 }` in `options` parameter.
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
 * Fetches an element with the given selector, scrolls it into view if needed, and then hovers over the center of the element. If there's no element matching selector, the method throws an error.
 *
 * @example
 * hover('Get Started')
 * hover(link('Get Started'))
 *
 * @param {selector|string} selector - A selector to search for element to right click. If there are multiple elements satisfying the selector, the first will be hovered.
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
module.exports.hover = async (selector,options = {}) => {
    validate();
    options = setNavigationOptions(options);
    const e = await element(selector);
    await scrollTo(e);
    const { x, y } = await boundingBox.boundingBoxCenter(dom, e);
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
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
module.exports.focus = async (selector,options = {}) => {
    validate();
    options = setNavigationOptions(options);
    await doActionAwaitingNavigation(options, async () => {
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
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
module.exports.write = async (text, into, options = { delay: 10 }) => {
    validate();
    let desc;
    if (into && into.delay) {
        options.delay = into.delay;
        into = undefined;
    }
    options = setNavigationOptions(options);
    await doActionAwaitingNavigation(options, async () => {
        if (into) {
            const selector = isString(into) ? textField(into) : into;
            await _focus(selector);
            await _write(text, options);
            desc = `Wrote ${text} into the ` + description(selector, true);
            return;
        } else {
            await _waitForFocus(options.timeout || default_timeout);
            await _write(text, options);
            desc = `Wrote ${text} into the focused element.`;
            return;
        }
    });
    return { description: desc };
};

const _waitForFocus = (timeout) => {
    return Promise.race([
        new Promise(resolve => { setTimeout(() => resolve(), timeout); }),
        new Promise(resolve => {
            setTimeout(() => {
                runtime.evaluate({ expression: 'document.hasFocus()' }).then((result) => {
                    if (result) resolve();
                });
            }, 500);
        })
    ]);
};

const _getActiveElementTagName = async () => {
    const result = await runtime.evaluate({
        expression: 'document.activeElement.tagName'
    });
    return result.result.value;
};

const _getActiveElementIsContentEditable = async () => {
    const result = await runtime.evaluate({
        expression: 'document.activeElement.isContentEditable'
    });
    return result.result.value;
};

const _getActiveElementDisabled = async () => {
    const result = await runtime.evaluate({
        expression: 'document.activeElement.disabled'
    });
    return result.result.value;
};

const _isActiveFieldNotWritable = async () => {
    return (['INPUT', 'TEXTAREA', 'SELECT'].indexOf((await _getActiveElementTagName())) <= -1
        || await _getActiveElementIsContentEditable())
        && await _getActiveElementDisabled();
};

const _write = async (text, options) => {
    if (await _isActiveFieldNotWritable())
        throw new Error('Element focused is not writable');
    for (const char of text) {
        await new Promise(resolve => setTimeout(resolve, options.delay));
        await input.dispatchKeyEvent({ type: 'char', text: char });
    }
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
    await dom.setFileInputFiles({
        nodeId: nodeId,
        files: [resolvedPath]
    });
    return { description: `Attached ${resolvedPath} to the ` + description(to, true) };
};

/**
 * Presses the given key.
 *
 * @example
 * press('Enter')
 * press('a')
 *
 * @param {string} key - Name of key to press, such as ArrowLeft. See [USKeyboardLayout](https://github.com/GoogleChrome/puppeteer/blob/master/lib/USKeyboardLayout.js) for a list of all key names.
 * @param {Object} options
 * @param {string} options.text - If specified, generates an input event with this text.
 * @param {number} [options.delay=0] - Time to wait between keydown and keyup in milliseconds.
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
module.exports.press = async (key, options = {}) => {
    validate();
    options = setNavigationOptions(options);
    await doActionAwaitingNavigation(options, async () => {
        await keyPress.down(key, input, options);
        if (options && options.delay) await new Promise(f => setTimeout(f, options.delay));
        await keyPress.up(key, input);
    });
    return { description: `Pressed the ${key} key` };
};

/**
 * Highlights the given element on the page by drawing a red rectangle around it. This is useful for debugging purposes.
 *
 * @example
 * highlight('Get Started')
 * highlight(link('Get Started'))
 *
 * @param {selector|string} selector - A selector of an element to highlight. If there are multiple elements satisfying the selector, the first will be highlighted.
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
module.exports.highlight = async selector => {
    validate();
    await scrollTo(selector);
    function highlightNode() {
        this.style.border = '0.5em solid red';
        return true;
    }
    await evaluate(selector, highlightNode);
    return { description: 'Highlighted the ' + description(selector, true) };
};

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
module.exports.scrollTo = scrollTo;

async function scrollTo(selector,options={}) {
    validate();
    function scrollToNode() {
        this.scrollIntoViewIfNeeded();
        return 'result';
    }
    options = setNavigationOptions(options);
    await doActionAwaitingNavigation(options, async () => {
        await evaluate(selector, scrollToNode);
    });
    return { description: 'Scrolled to the ' + description(selector, true) };
}

const scroll = async (e, px, scrollPage, scrollElement, direction) => {
    e = e || 100;
    if (Number.isInteger(e)) {
        await runtime.evaluate({ expression: `(${scrollPage}).apply(null, ${JSON.stringify([e])})` });
        return { description: `Scrolled ${direction} the page by ${e} pixels` };
    }

    const nodeId = await element(e);
    const { object: { objectId } } = await dom.resolveNode({ nodeId });
    //TODO: Allow user to set options for scroll
    const options = setNavigationOptions({});
    await doActionAwaitingNavigation(options, async () => {
        await runtime.callFunctionOn({
            functionDeclaration: scrollElement.toString(),
            'arguments': [{ value: px }],
            objectId
        });
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
    return await scroll(e, px, px => window.scrollBy(px, 0), function sr(px) { this.scrollLeft += px; return true; }, 'right');
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
    return await scroll(e, px, px => window.scrollBy(px * -1, 0), function sl(px) { this.scrollLeft -= px; return true; }, 'left');
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
    return await scroll(e, px, px => window.scrollBy(0, px * -1), function su(px) { this.scrollTop -= px; return true; }, 'up');
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
    return await scroll(e, px, px => window.scrollBy(0, px), function sd(px) { this.scrollTop += px; return true; }, 'down');
};

/**
 * Captures a screenshot of the page.
 *
 * @example
 * screenshot({path : 'screenshot.png'})
 *
 * @param {object} {path:'screenshot.png'} or {encoding:'base64'}
 * @returns {Promise<Buffer>} - Promise which resolves to buffer with captured screenshot.
 */
module.exports.screenshot = async (options = {}) => {
    validate();
    options.path = options.path || `Screenshot-${Date.now()}.png`;
    const { data } = await page.captureScreenshot();
    if (options.encoding === 'base64') return data;
    fs.writeFileSync(options.path, Buffer.from(data, 'base64'));
    return { description: `Screenshot is created at "${options.path}"` };
};

/**
 * This {@link selector} lets you identify elements on the web page via XPath or CSS selector.
 * @example
 * highlight($(`//*[text()='text']`))
 * $(`//*[text()='text']`).exists()
 *
 * @param {string} selector - XPath or CSS selector.
 * @param {...relativeSelector} args
 * @returns {ElementWrapper}
 */
module.exports.$ = (selector, ...args) => {
    validate();
    const get = async () => await handleRelativeSearch(await (selector.startsWith('//') || selector.startsWith('(') ? $$xpath(selector) : $$(selector)), args);
    return { get: getIfExists(get), exists: exists(getIfExists(get)), description: `Custom selector $(${selector})` };
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
 * @param {...relativeSelector} args
 * @returns {ElementWrapper}
 */
module.exports.image = (attrValuePairs, ...args) => {
    validate();
    const selector = getValues(attrValuePairs, args);
    const get = getElementGetter(selector, async () => await $$xpath(`//img[contains(@alt, ${xpath(selector.label)})]`), 'img');
    return { get: getIfExists(get), exists: exists(getIfExists(get)), description: desc(selector, 'alt', 'Image') };
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
 * @param {...relativeSelector} args
 * @returns {ElementWrapper}
 */
module.exports.link = (attrValuePairs, ...args) => {
    validate();
    const selector = getValues(attrValuePairs, args);
    const get = getElementGetter(selector, async () => await elements(selector.label, 'a'), 'a');
    return { get: getIfExists(get), exists: exists(getIfExists(get)), description: desc(selector, 'text', 'Link') };
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
 * @param {...relativeSelector} args
 * @returns {ElementWrapper}
 */
module.exports.listItem = (attrValuePairs, ...args) => {
    validate();
    const selector = getValues(attrValuePairs, args);
    const get = getElementGetter(selector, async () => await elements(selector.label, 'li'), 'li');
    return { get: getIfExists(get), exists: exists(getIfExists(get)), description: desc(selector, 'label', 'List item') };
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
 * @param {...relativeSelector} args
 * @returns {ElementWrapper}
 */
module.exports.button = (attrValuePairs, ...args) => {
    validate();
    const selector = getValues(attrValuePairs, args);
    const get = getElementGetter(selector, async () => await elements(selector.label, 'button'), 'button');
    return { get: getIfExists(get), exists: exists(getIfExists(get)), description: desc(selector, 'label', 'Button') };
};

/**
 * This {@link selector} lets you identify an input field on a web page with label or attribute and value pairs.
 *
 * @example
 * focus(inputField('id', 'name'))
 * inputField('id', 'name').exists()
 *
 * @param {object} attrValuePairs - Pairs of attribute and value like {"id":"name","class":"class-name"}
 * @param {...relativeSelector} args
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
        value: async () => (await evaluate((await get())[0], function getvalue() { return this.value; })).value,
    };
};

/**
 * This {@link selector} lets you identify a file input field on a web page either with label or with attribute and value pairs.
 *
 * @example
 * fileField('Please select a file:').value()
 * fileField('Please select a file:').exists()
 * fileField('id','file').exists()
 *
 * @param {string} label - The label (human-visible name) of the file input field.
 * @param {object} attrValuePairs - Pairs of attribute and value like {"id":"name","class":"class-name"}
 * @param {...relativeSelector} args
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
        value: async () => (await evaluate((await get())[0], function getvalue() { return this.value; })).value,
        description: desc(selector, 'label', 'File field')
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
 * @param {...relativeSelector} args
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
        value: async () => (await evaluate((await get())[0], function getvalue() { return this.value; })).value,
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
 * @param {...relativeSelector} args
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

            const nodeId = (await get())[0];
            if (!nodeId) throw new Error('Combo Box not found');

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
            const { object: { objectId } } = await dom.resolveNode({ nodeId });
            const options = setNavigationOptions({});
            await doActionAwaitingNavigation(options, async () => {
                const result = await runtime.callFunctionOn({
                    functionDeclaration: selectBox.toString(),
                    'arguments': [{ value: value }],
                    objectId
                });
                if (!result.result.value) throw new Error('Option not available in combo box');
            });
        },
        value: async () => (await evaluate((await get())[0], function getvalue() { return this.value; })).value,
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
 * @param {...relativeSelector} args
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
        isChecked: async () => (await evaluate((await get())[0], function getvalue() { return this.checked; })).value,
        check: async () => {
            const options = setNavigationOptions({});
            await doActionAwaitingNavigation(options, async () => {
                await evaluate((await get())[0], function getvalue() { this.checked = true; return true; });
            });    
        },
        uncheck: async () => {
            const options = setNavigationOptions({});
            await doActionAwaitingNavigation(options, async () => {
                await evaluate((await get())[0], function getvalue() { this.checked = false; return true; });
            });
        }
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
        isSelected: async () => (await evaluate((await get())[0], function getvalue() { return this.checked; })).value,
        select: async () => {
            const options = setNavigationOptions({});
            await doActionAwaitingNavigation(options, async () => {
                await evaluate((await get())[0], function getvalue() { this.checked = true; return true; });
            });
        },    
        deselect: async () => {
            const options = setNavigationOptions({});
            await doActionAwaitingNavigation(options, async () => {
                await evaluate((await get())[0], function getvalue() { this.checked = false; return true; });
            });
        }    
    };
};

/**
 * This {@link selector} lets you identify an element with text.
 *
 * @example
 * highlight(text('Vehicle'))
 * text('Vehicle').exists()
 *
 * @param {string} text - Text to match.
 * @param {...relativeSelector} args
 * @returns {ElementWrapper}
 */
module.exports.text = (text, ...args) => {
    validate();
    const get = async () => await handleRelativeSearch(await elements(text), args);
    return { get: getIfExists(get), exists: exists(getIfExists(get)), description: `Element with text "${text}"` };
};

/**
 * This {@link selector} lets you identify an element containing the text.
 *
 * @example
 * contains('Vehicle').exists()
 *
 * @param {string} text - Text to match.
 * @param {...relativeSelector} args
 * @returns {ElementWrapper}
 */
module.exports.contains = contains;

function contains(text, ...args) {
    validate();
    assertType(text);
    const get = async (e = '*') => {
        let elements = await $$xpath('//' + e + `[contains(@value, ${xpath(text)})]`);
        if (!elements || !elements.length) elements = await $$xpath('//' + e + `[not(descendant::div) and contains(translate(normalize-space(.),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'), ${xpath(text.toLowerCase())})]`);
        return await handleRelativeSearch(elements, args);
    };
    return { get: getIfExists(get), exists: exists(getIfExists(get)), description: `Element containing text "${text}"` };
}

function match(text, ...args) {
    validate();
    assertType(text);
    const get = async (e = '*') => {
        let elements = await $$xpath('//' + e + `[@value=${xpath(text)}]`);
        if (!elements || !elements.length) {
            if (e === '*')elements = await $$xpath('//' + e + `[translate(normalize-space(.),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz')=${xpath(text.toLowerCase())}]`);
            else elements = await $$xpath('//' + e + `[translate(normalize-space(.//text()),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz')=${xpath(text.toLowerCase())}]`);
        }
        return await handleRelativeSearch(elements, args);
    };
    return { get: getIfExists(get), exists: exists(getIfExists(get)), description: `Element matching text "${text}"` };
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
        const rect = await boundingBox.getBoundingClientRect(dom, e);
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
        const rect = await boundingBox.getBoundingClientRect(dom, e);
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
        const rect = await boundingBox.getBoundingClientRect(dom, e);
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
        const rect = await boundingBox.getBoundingClientRect(dom, e);
        return rect.bottom > v;
    }, value, desc);
};

/**
 * This {@link relativeSelector} lets you perform relative HTML element searches.
 *
 * @example
 * click(link("Block", near("name"))
 *
 * @param {selector|string} selector - Web element selector.
 * @returns {RelativeSearchElement}
 */
module.exports.near = (selector) => {
    validate();
    const desc = isString(selector) ? `Near ${selector}` : `Near ${selector.description}`;
    const value = rectangle(selector, r => r);
    return new RelativeSearchElement(async (e, v) => {
        const nearOffset = 30;
        const rect = await boundingBox.getBoundingClientRect(dom, e);
        return Math.abs(rect.bottom - v.bottom) < nearOffset || Math.abs(rect.top - v.top) < nearOffset ||
            Math.abs(rect.left - v.left) < nearOffset || Math.abs(rect.right - v.right) < nearOffset;
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
 * click('Get Started', waitForNavigation(false))
 *
 * @param {boolean} e
 * @return {boolean}
 */
module.exports.waitForNavigation = e => e;

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

function waitFor(time) {
    var promise = new Promise(resolve => setTimeout(() => {
        resolve();
    }, time));
    return promise;
}

const setRootId = () => {
    return new Promise(function waitForRootId(resolve) {
        if (rootId !== null) {
            resolve();
        }
        else setTimeout(() => { waitForRootId(resolve); }, 500);
    });
};

const doActionAwaitingNavigation = async (options, action) => {
    let promises = [];
    let loadResolver;
    const loadEventPromise = new Promise((resolve) => {
        loadResolver = resolve;
        xhrEvent.addListener('loadEventFired', loadResolver);
    });

    let func = addPromiseToWait(promises);
    xhrEvent.addListener('xhrEvent', func);
    xhrEvent.once('frameStartedLoading', () => {
        promises.push(loadEventPromise);
        promises.push(page.frameStoppedLoading());
    });
    await action();
    await waitForPromises(promises, options.waitForStart);
    if (options.awaitNavigation) {
        //TODO:Handle frame load without loadEventFired
        await waitForNavigation(options.timeout, promises).catch(() => {});
    }
    xhrEvent.removeListener('xhrEvent', func);
    xhrEvent.removeListener('loadEventFired',loadResolver);
};

const waitForPromises = (promises,waitForStart) => {
    return Promise.race([waitFor(waitForStart),new Promise(function waitForPromises(resolve) {
        if (promises.length) {
            resolve();
        }
        else setTimeout(() => { waitForPromises(resolve); }, waitForStart/5);
    })]);
};

const addPromiseToWait = (promises) => {
    return (promise) => {
        promises.push(promise);
    };
};

const waitForNavigation = (timeout, promises = []) => {
    promises.push(setRootId());
    return new Promise((resolve,reject) => {
        Promise.all(promises).then(resolve);
        setTimeout(() => reject('Timedout'), timeout);
    });
};

const handleTimeout = (func, timeout) => {
    return (e) => {
        xhrEvent.removeListener('xhrEvent', func);
        if (e === 'Timedout')
            throw new Error(`Navigation took more than ${timeout}ms. Please increase the timeout.`);
    };
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
        if (isString(selector)) return contains(selector).description;
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

const isString = obj => typeof obj === 'string' || obj instanceof String;

const isSelector = obj => obj['get'] && obj['exists'];

const filter_visible_nodes = async (nodeIds) => {
    let visible_nodes = [];

    function isHidden() {
        return this.offsetParent === null;
    }

    for (const nodeId of nodeIds) {
        const result = await evaluate(nodeId, isHidden);
        if (!result.value) visible_nodes.push(nodeId);
    }

    return visible_nodes;
};

const $$ = async selector => {
    const { nodeIds } = await dom.querySelectorAll({ nodeId: rootId, selector: selector });
    return (await filter_visible_nodes(nodeIds));
};

const $$xpath = async selector => {
    const { searchId, resultCount } = await dom.performSearch({
        query: selector
    });
    if (resultCount === 0) return;
    const { nodeIds } = await dom.getSearchResults({
        searchId,
        fromIndex: 0,
        toIndex: resultCount
    });
    return (await filter_visible_nodes(nodeIds));
};

const evaluate = async (selector, func) => {
    let nodeId = selector;
    if (isNaN(selector)) nodeId = await element(selector);
    const { object: { objectId } } = await dom.resolveNode({ nodeId });
    const { result } = await runtime.callFunctionOn({
        functionDeclaration: func.toString(),
        objectId
    });
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

const exists = get => {
    return async () => {
        if ((await get()).length) return { description: 'Exists' };
        return { description: 'Does not exists' };
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
        const r = await boundingBox.getBoundingClientRect(dom, e);
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
        if(valid) matchingNodes.push({element:element,dist:dist});
    }
    matchingNodes.sort(function(a, b) {
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
                const diff = await boundingBox.getPositionalDifference(dom, nodeId, result.elem);
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
 * * `get()`, `exists()`, `description` for all the elements.
 * * `value()` for input field, fileField and text field.
 * * `value()`, `select()` for combo box.
 * * `check()`, `uncheck()`, `isChecked()` for checkbox.
 * * `select()`, `deselect()`, `isSelected()` for radio button.
 *
 * @typedef {Object} ElementWrapper
 * @property @private {function} get - DOM element getter.
 * @property {function(number, number)} exists - Checks existence for element.
 * @property {string} description - Describing the operation performed.
 *
 * @example
 * link('google').exists()
 * link('google').exists(intervalSecs(1), timeoutSecs(10))
 * link('google').description
 * textField('username').value()
 */

module.exports.metadata = {
    'Browser actions': ['openBrowser', 'closeBrowser', 'client', 'switchTo'],
    'Page actions': ['goto', 'reload', 'title', 'click', 'doubleClick', 'rightClick', 'hover', 'focus', 'write', 'attach', 'press', 'highlight', 'scrollTo', 'scrollRight', 'scrollLeft', 'scrollUp', 'scrollDown', 'screenshot'],
    'Selectors': ['$', 'image', 'link', 'listItem', 'button', 'inputField', 'fileField', 'textField', 'comboBox', 'checkBox', 'radioButton', 'text', 'contains'],
    'Proximity selectors': ['toLeftOf', 'toRightOf', 'above', 'below', 'near'],
    'Events': ['alert', 'prompt', 'confirm', 'beforeunload'],
    'Helpers': ['intervalSecs', 'timeoutSecs', 'waitForNavigation', 'to', 'into', 'waitFor', 'accept', 'dismiss'],
};