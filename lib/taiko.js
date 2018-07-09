const puppeteer = require('puppeteer');
const Browser = require('puppeteer/lib/Browser').Browser;
const Page = require('puppeteer/lib/Page');
const cri = require('chrome-remote-interface');
const childProcess = require('child_process');
const BrowserFetcher = require('./browserFetcher');
const {helper, assert} = require('./helper');
const boundingBox = require('./boundingBox')
const fs = require('fs');
const path = require('path');
const ChromiumRevision = require(path.join(helper.projectRoot(), 'package.json')).taiko.chromium_revision;

let chromeProcess,page,network,runtime,input,client,dom;

const connect_to_cri = async () => {
    return new Promise(function connect(resolve) {
        cri(async (c) => {
            client = c;
            page = c.Page;
            network = c.Network;
            runtime = c.Runtime;
            input = c.Input;
            dom = c.DOM;
            await Promise.all([network.enable(), page.enable(), dom.enable()]);
            resolve();
        }).on('error', (err) => {
            setTimeout(()=>{connect(resolve)}, 1000);
        });
    }); 
}

/**
 * Launches a browser with a tab. The browser will be closed when the parent node.js process is closed.
 *
 * @example
 * openBrowser()
 * openBrowser({ headless: false })
 *
 * @param {Object} options - Set of configurable [options](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#puppeteerlaunchoptions) to set on the browser.
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
module.exports.openBrowser = async options => {
    const browserFetcher = new BrowserFetcher();
    const revisionInfo = browserFetcher.revisionInfo(ChromiumRevision);
    assert(revisionInfo.local, `Chromium revision is not downloaded. Run "npm install"`);
    chromeExecutable = revisionInfo.executablePath;
    chromeProcess = childProcess.spawn(
        chromeExecutable,
        ['--remote-debugging-port=9222']);     
    await connect_to_cri();       
    return { description: 'Browser opened and CRI initialized' };
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
    await client.close();
    chromeProcess.kill('SIGTERM');
    return { description: 'Browser and CRI closed' };
};

/**
 * Opens the specified URL in the browser's tab. Adds `http` protocol to the URL if not present.
 *
 * @example
 * goto('https://google.com')
 * goto('google.com')
 *
 * @param {string} url - URL to navigate page to.
 * @param {Object} options - [Navigation parameters](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagegotourl-options)
 * @returns {Promise<Object>} - Object with the description of the action performed and the final URL.
 */
module.exports.goto = async (url, options) => {
    validate();
    if (!/^https?:\/\//i.test(url)) url = 'http://' + url;
    await page.navigate({url: url});
    await page.loadEventFired();
    return { description: `Navigated to url "${url}"`, url:url};
};

/**
 * Reloads the page.
 *
 * @example
 * reload('https://google.com')
 * reload('https://google.com', { timeout: 10000 })
 *
 * @param {Object} options - [Navigation parameters](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagereloadoptions)
 * @returns {Promise<Object>} - Object with the description of the action performed and the final URL.
 */
module.exports.reload = async (url, options) => {
    validate();
    await page.reload(url);
    return { description: `"${url}" reloaded`, url: url};
};

/**
 * Returns page's title.
 *
 * @returns {Promise<String>}
 */
module.exports.title = async () => {
    validate();
    const result = await runtime.evaluate({
        expression: "document.querySelector('title').textContent"
    });

    return result.result.value;
};

/**
 * Fetches an element with the given selector, scrolls it into view if needed, and then clicks in the center of the element. If there's no element matching selector, the method throws an error.
 *
 * @example
 * click('Get Started')
 * click(link('Get Started'))
 * click('Get Started', waitForNavigation(false))
 *
 * @param {selector|string} selector - A selector to search for element to click. If there are multiple elements satisfying the selector, the first will be clicked.
 * @param {boolean} [waitForNavigation=true] - Wait for navigation after the click. Default navigation timout is 5 seconds, to override pass `{ timeout: 10000 }` in `options` parameter.
 * @param {Object} options - Click options.
 * @param {string} [options.button='left'] - `left`, `right`, or `middle`.
 * @param {number} [options.number=1] - Number of times to click on the element.
 * @param {number} [options.delay=0] - Time to wait between mousedown and mouseup in milliseconds.
 * @param {number} [options.timeout=5000] - Timeout value in milliseconds for navigation after click.
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
module.exports.click = click;

async function click(selector, waitForNavigation = false, options = {}) {
    validate();
    const e = await element(selector);
    // const type = await p.evaluate(e => e.type, e);
    // assertType(e, () => type !== 'file', 'Unsupported operation, use `attach` on file input field');
    const {x, y} = await boundingBox.boundingBoxCenter(dom,e);
    option = {
        x: x,
        y: y,
        button: options.button || 'left',
        clickCount: options.clickCount || 1
    }
    
    Promise.resolve().then(() => {
        option.type = 'mousePressed';
        return input.dispatchMouseEvent(option);
    }).then(() => {
        option.type = 'mouseReleased';
        return input.dispatchMouseEvent(option);
    }).catch((err) => {
        throw new Error(err);
    });
    
    if (waitForNavigation){
        await page.loadEventFired();
    } 
    
    return { description: 'Clicked ' + description(selector, true) };
}

/**
 * Fetches an element with the given selector, scrolls it into view if needed, and then double clicks the element. If there's no element matching selector, the method throws an error.
 *
 * @example
 * doubleClick('Get Started')
 * doubleClick(button('Get Started'))
 * doubleClick('Get Started', waitForNavigation(false))
 *
 * @param {selector|string} selector - A selector to search for element to click. If there are multiple elements satisfying the selector, the first will be double clicked.
 * @param {boolean} [waitForNavigation=true] - wait for navigation after the click.
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
module.exports.doubleClick = async (selector, waitForNavigation = true) => {
    await click(selector, waitForNavigation, { clickCount: 2, });
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
 * @returns {Promise<Object>} - Object with the description of the action performed.
 */
module.exports.rightClick = async (selector) => {
    await click(selector, false, { button: 'right', });
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
module.exports.hover = async selector => {
    validate();
    const e = await element(selector);
    const {x, y} = await boundingBox.boundingBoxCenter(dom,e);
    option = {
        x: x,
        y: y
    }
    Promise.resolve().then(() => {
        option.type = 'mouseMoved';
        return input.dispatchMouseEvent(option);
    }).catch((err) => {
        throw new Error(err);
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
module.exports.focus = async selector => {
    validate();
    await _focus(selector);
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
    if (into) {
        const selector = isString(into) ? textField(into) : into;
        await _focus(selector);
        await _write(text,options);
        return { description: `Wrote ${text} into the ` + description(selector, true) };
    } else {
        await _write(text, options);
        return { description: `Wrote ${text} into the focused element.` };
    }
};

const _write = async (text,options) => {
    for (const char of text) {
        await input.dispatchKeyEvent({ type: 'char', text: char });
        await new Promise(resolve => setTimeout(resolve, options.delay));
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
    if (isString(to)) to = fileField(to);
    else if (!isSelector(to)) throw Error('Invalid element passed as paramenter');
    const e = await element(to);
    await e.uploadFile(filepath);
    await e.dispose();
    return { description: `Attached ${filepath} to the ` + description(to, true) };
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
module.exports.press = async (key, options) => {
    validate();
    await input.dispatchKeyEvent({ type: 'rawKeyDown', keyIdentifier: key })
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
    function highlightNode() {
        this.style.border = '0.5em solid red';
        return true;
    }
    await evaluate(selector,highlightNode);
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
module.exports.scrollTo = async selector => {
    validate();
    function scrollToNode() {
        this.scrollIntoViewIfNeeded();
        return 'result';
    }
    await evaluate(selector,scrollToNode);
    return { description: 'Scrolled to the ' + description(selector, true) };
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
    return await scroll(e, px, px => window.scrollBy(px, 0), (e, px) => e.scrollLeft += px, 'right');
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
    return await scroll(e, px, px => window.scrollBy(px * -1, 0), (e, px) => e.scrollLeft -= px, 'left');
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
    return await scroll(e, px, px => window.scrollBy(0, px * -1), (e, px) => e.scrollTop -= px), 'top';
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
    return await scroll(e, px, px => window.scrollBy(0, px), (e, px) => e.scrollTop += px, 'down');
};

/**
 * Captures a screenshot of the page.
 *
 * @example
 * screenshot({path: 'screenshot.png'})
 *
 * @param {Object} options - Options object with properties mentioned [here](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagescreenshotoptions).
 * @returns {Promise<Buffer>} - Promise which resolves to buffer with captured screenshot.
 */
module.exports.screenshot = async options => {
    validate();
    if(options == null ){options = {path:"Screenshot.png"};}
    options.path = options.path ||  "Screenshot.png";    
    const {data} = await page.captureScreenshot();
    fs.writeFileSync(options.path, Buffer.from(data, 'base64'));
    return{description:`Screenshot is created at "${options.path}"`}
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
    return { get: get, exists: exists(get), description: `Custom selector $(${selector})` };
};

/**
 * This {@link selector} lets you identify an image on a web page. Typically, this is done via the image's alt text.
 *
 * @example
 * click(image('alt'))
 * image('alt').exists()
 *
 * @param {string} alt - The image's alt text.
 * @param {...relativeSelector} args
 * @returns {ElementWrapper}
 */
module.exports.image = (alt, ...args) => {
    validate();
    assertType(alt);
    const get = async () => await handleRelativeSearch(await $$xpath(`//img[contains(@alt, ${xpath(alt)})]`), args);
    return { get: get, exists: exists(get), description: `Image with "alt=${alt}"` };
};

/**
 * This {@link selector} lets you identify a link on a web page.
 *
 * @example
 * click(link('Get Started'))
 * link('Get Started').exists()
 *
 * @param {string} text - The link text.
 * @param {...relativeSelector} args
 * @returns {ElementWrapper}
 */
module.exports.link = (text, ...args) => {
    validate();
    const get = async () => await handleRelativeSearch(await elements(text, 'a'), args);
    return { get: get, exists: exists(get), description: description(text).replace('Element', 'Link') };
};

/**
 * This {@link selector} lets you identify a list item (HTML <li> element) on a web page.
 *
 * @example
 * highlight(listItem('Get Started'))
 * listItem('Get Started').exists()
 *
 * @param {string} label - The label of the list item.
 * @param {...relativeSelector} args
 * @returns {ElementWrapper}
 */
module.exports.listItem = (label, ...args) => {
    validate();
    const get = async () => await handleRelativeSearch(await elements(label, 'li'), args);
    return { get: get, exists: exists(get), description: description(label).replace('Element', 'List item') };
};

/**
 * This {@link selector} lets you identify a button on a web page.
 *
 * @example
 * highlight(button('Get Started'))
 * button('Get Started').exists()
 *
 * @param {string} label - The button label.
 * @param {...relativeSelector} args
 * @returns {ElementWrapper}
 */
module.exports.button = (label, ...args) => {
    validate();
    const get = async () => await handleRelativeSearch(await elements(label, 'button'), args);
    return { get: get, exists: exists(get), description: description(label).replace('Element', 'Button') };
};

/**
 * This {@link selector} lets you identify an input field on a web page.
 *
 * @example
 * focus(inputField('id', 'name'))
 * inputField('id', 'name').exists()
 *
 * @param {string} [attribute='value'] - The input field's attribute.
 * @param {string} value - Value of the attribute specified in the first parameter.
 * @param {...relativeSelector} args
 * @returns {ElementWrapper}
 */
module.exports.inputField = (attribute = 'value', value, ...args) => {
    validate();
    if (value instanceof RelativeSearchElement) {
        args = [value].concat(args);
        value = undefined;
    }
    if (!value) {
        value = attribute;
        attribute = 'value';
    }
    assertType(value);
    assertType(attribute);
    const get = async () => await handleRelativeSearch(await $$(`input[${attribute}="${value}"]`), args);
    return {
        get: get,
        exists: exists(get),
        description: `Input field with "${attribute} = ${value}"`,
        value: async () => (await evaluate((await get())[0],function getvalue(){ return this.value})).value,
    };
};

/**
 * This {@link selector} lets you identify a file input field on a web page.
 *
 * @example
 * fileField('Please select a file:').value()
 * fileField('Please select a file:').exists()
 *
 * @param {string} label - The label (human-visible name) of the file input field.
 * @param {...relativeSelector} args
 * @returns {ElementWrapper}
 */
module.exports.fileField = fileField;
function fileField(label, ...args) {
    const get = async () => await handleRelativeSearch(await $$xpath(`//input[@type='file'][@id=(//label[contains(text(), ${xpath(label)})]/@for)]`), args);
    return {
        get: get,
        exists: exists(get),
        value:  async () => (await evaluate((await get())[0],function getvalue(){ return this.value})).value,
        description: `File input field with label containing "${label}"`,
    };
}

/**
 * This {@link selector} lets you identify a text field on a web page.
 *
 * @example
 * focus(textField('Username:'))
 * textField('Username:').exists()
 *
 * @param {string} label - The label (human-visible name) of the text field.
 * @param {...relativeSelector} args
 * @returns {ElementWrapper}
 */
module.exports.textField = textField;

function textField(label, ...args) {
    validate();
    assertType(label);
    const get = async () => await handleRelativeSearch(await $$xpath(`//input[@type='text'][@id=(//label[contains(text(), ${xpath(label)})]/@for)]`), args);
    return {
        get: get,
        exists: exists(get),
        description: `Text field with label containing "${label}"`,
        value:  async () => (await evaluate((await get())[0],function getvalue(){ return this.value})).value,
    };
}

/**
 * This {@link selector} lets you identify a combo box on a web page.
 *
 * @example
 * comboBox('Vehicle:').select('Car')
 * comboBox('Vehicle:').value()
 * comboBox('Vehicle:').exists()
 *
 * @param {string} label - The label (human-visible name) of the combo box.
 * @param {...relativeSelector} args
 * @returns {ElementWrapper}
 */
module.exports.comboBox = (label, ...args) => {
    validate();
    assertType(label);
    const get = async () => await handleRelativeSearch(await $$xpath(`//select[@id=(//label[contains(text(), ${xpath(label)})]/@for)]`), args);
    return {
        get: get,
        exists: exists(get),
        description: `Combo box with label containing "${label}"`,
        select: async (value) => {
            const box = (await get())[0];
            if (!box) throw new Error('Combo Box not found');
            await p.evaluate((box, value) => {
                Array.from(box.options).filter(o => o.text === value).forEach(o => o.selected = true);
            }, box, value);
        },
        value: async () => p.evaluate(e => e.value, (await get())[0]),
    };
};

/**
 * This {@link selector} lets you identify a checkbox on a web page.
 *
 * @example
 * checkBox('Vehicle').check()
 * checkBox('Vehicle').uncheck()
 * checkBox('Vehicle').isChecked()
 * checkBox('Vehicle').exists()
 *
 * @param {string} label - The label (human-visible name) of the check box.
 * @param {...relativeSelector} args
 * @returns {ElementWrapper}
 */
module.exports.checkBox = (label, ...args) => {
    validate();
    assertType(label);
    const get = async () => await handleRelativeSearch(await $$xpath(`//input[@type='checkbox'][@id=(//label[contains(text(), ${xpath(label)})]/@for)]`), args);
    return {
        get: get,
        exists: exists(get),
        description: `Checkbox with label containing "${label}"`,
        isChecked: async () => p.evaluate(e => e.checked, (await get())[0]),
        check: async () => p.evaluate(e => e.checked = true, (await get())[0]),
        uncheck: async () => p.evaluate(e => e.checked = false, (await get())[0]),
    };
};

/**
 * This {@link selector} lets you identify a radio button on a web page.
 *
 * @example
 * radioButton('Vehicle').select()
 * radioButton('Vehicle').deselect()
 * radioButton('Vehicle').isSelected()
 * radioButton('Vehicle').exists()
 *
 * @param {string} label - The label (human-visible name) of the radio button.
 * @param {...relativeSelector} args
 * @returns {ElementWrapper}
 */
module.exports.radioButton = (label, ...args) => {
    validate();
    assertType(label);
    const get = async () => await handleRelativeSearch(await $$xpath(`//input[@type='radio'][@id=(//label[contains(text(), ${xpath(label)})]/@for)]`), args);
    return {
        get: get,
        exists: exists(get),
        description: `Radio button with label containing "${label}"`,
        isSelected: async () => p.evaluate(e => e.checked, (await get())[0]),
        select: async () => p.evaluate(e => e.checked = true, (await get())[0]),
        deselect: async () => p.evaluate(e => e.checked = false, (await get())[0]),
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
    assertType(text);
    const get = async (e = '*') => await handleRelativeSearch(await $$xpath('//' + e + `[text()=${xpath(text)}]`), args);
    return { get: get, exists: exists(get), description: `Element with text "${text}"` };
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
        if (!elements || !elements.length)
        elements = await $$xpath('//' + e + `[contains(text(), ${xpath(text)})]`);
        return await handleRelativeSearch(elements, args);
    };
    return { get: get, exists: exists(get), description: `Element containing text "${text}"` };
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
        const rect =  await boundingBox.getBoundingClientRect(dom,e);
        return rect.left < v }, 
        rectangle(selector, r => r.left), `To left of ${selector}`);
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
    return new RelativeSearchElement(async (e, v) => {
        const rect =  await boundingBox.getBoundingClientRect(dom,e);
        return rect.right > v }, 
        rectangle(selector, r => r.right), `To right of ${selector}`);
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
    return new RelativeSearchElement(async (e, v) => {
        const rect =  await boundingBox.getBoundingClientRect(dom,e);
        return rect.top < v }, 
        rectangle(selector, r => r.top), `Above ${selector}`);
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
    return new RelativeSearchElement(async (e, v) => {
        const rect =  await boundingBox.getBoundingClientRect(dom,e);
        return rect.bottom > v},
        rectangle(selector, r => r.bottom), `Below ${selector}`);
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
    return new RelativeSearchElement(async (e,v) => {
        const nearOffset = 300;
        const rect = await boundingBox.getBoundingClientRect(dom,e);
        return Math.abs(rect.bottom - v.bottom) < nearOffset || Math.abs(rect.top - v.top) < nearOffset ||
            Math.abs(rect.left - v.left) < nearOffset || Math.abs(rect.right - v.right) < nearOffset;
    },rectangle(selector, r => r), `near ${selector}`);
};

/**
 * Lets you perform an operation when an `alert` with given text is shown.
 *
 * @example
 * alert('Message', async alert => await alert.dismiss())
 *
 * @param {string} message - Identify alert based on this message.
 * @param {function(alert)} callback - Operation to perform.
 */
module.exports.alert = (message, callback) => dialog('alert', message, callback);

/**
 * Lets you perform an operation when a `prompt` with given text is shown.
 *
 * @example
 * prompt('Message', async prompt => await prompt.dismiss())
 *
 * @param {string} message - Identify prompt based on this message.
 * @param {function(prompt)} callback - Operation to perform.
 */
module.exports.prompt = (message, callback) => dialog('prompt', message, callback);

/**
 * Lets you perform an operation when a `confirm` with given text is shown.
 *
 * @example
 * confirm('Message', async confirm => await confirm.dismiss())
 *
 * @param {string} message - Identify confirm based on this message.
 * @param {function(confirm)} callback - Operation to perform.
 */
module.exports.confirm = (message, callback) => dialog('confirm', message, callback);

/**
 * Lets you perform an operation when a `beforeunload` with given text is shown.
 *
 * @example
 * beforeunload('Message', async beforeunload => await beforeunload.dismiss())
 *
 * @param {string} message - Identify beforeunload based on this message.
 * @param {function(beforeunload)} callback - Operation to perform.
 */
module.exports.beforeunload = (message, callback) => dialog('beforeunload', message, callback);

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
module.exports.waitFor = (time) => new Promise(resolve => setTimeout(resolve, time));

const element = async (selector, tag) => (await elements(selector, tag))[0];

const elements = async (selector, tag) => {
    const elements = await (() => {
        if (isString(selector)) return contains(selector).get(tag);
        else if (isSelector(selector)) return selector.get(tag);
        return null;
    })();
    if (!elements || !elements.length) throw new Error('Element not found');
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
    function focusElement(){
        this.focus();
        return true;
    }
    await evaluate(selector,focusElement);
};

const scroll = async (e, px, scrollPage, scrollElement, direction) => {
    e = e || 100;
    if (Number.isInteger(e)) {
        await p.evaluate(scrollPage, e);
        return { description: `Scrolled ${direction} the page by ${e} pixels` };
    }
    // await evaluate(e, scrollElement, px);
    return { description: `Scrolled ${direction} ` + description(e, true) + ` by ${px} pixels` };
};

const dialog = (type, message, callback) => {
    validate();
    p.on('dialog', async dialog => {
        if (dialog.type() === type && dialog.message() === message)
            await callback(dialog);
    });
};

const isString = obj => typeof obj === 'string' || obj instanceof String;

const isSelector = obj => obj['get'] && obj['exists'];

const $$ = async selector => {
    const {root: {nodeId}} = await dom.getDocument();
    const {nodeIds} = await dom.querySelectorAll({nodeId, selector: selector});
    return nodeIds;
};

const $$xpath = async selector => {
    await dom.getDocument();
    const {searchId, resultCount} = await dom.performSearch({
        query: selector
    });
    if(resultCount === 0) return;
    const {nodeIds} = await dom.getSearchResults({
        searchId,
        fromIndex: 0,
        toIndex: resultCount
    });
    return nodeIds;
};

const evaluate = async (selector,func) => {
    let nodeId = selector;
    if(isNaN(selector)) nodeId = await element(selector);
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
    return async (intervalTime = 1000, timeout = 10000) => {
        try {
            await waitUntil(async () => (await get()).length > 0, intervalTime, timeout);
            return true;
        } catch (e) {
            return false;
        }
    };
};

const waitUntil = async (condition, intervalTime, timeout) => {
    var start = new Date().getTime();
    while (true) {
        try {
            if (await condition()) break;
        } catch (e) {}
        if ((new Date().getTime() - start) > timeout)
            throw new Error(`waiting failed: timeout ${timeout}ms exceeded`);
        sleep(intervalTime);
    }
};

const xpath = s => `concat(${s.match(/[^'"]+|['"]/g).map(part => {
    if (part === '\'') return '"\'"';
    if (part === '"')   return '\'"\'';
    return '\'' + part + '\'';
}).join(',') + ', ""'})`;

const rectangle = async (selector, callback) => {
    const e = await element(selector);
    const r = await boundingBox.getBoundingClientRect(dom,e); 
    return  callback(r);
};

const isRelativeSearch = args => args.every(a => a instanceof RelativeSearchElement);

const handleRelativeSearch = async (elements, args) => {
    if (!args.length) return elements;
    if (!isRelativeSearch(args)) throw new Error('Invalid arguments passed, only relativeSelectors are accepted');
    const filteredElements = [];
    for (let i = 0; i < elements.length; i++) {
        let isValid = true;
        for (let j = 0; j < args.length; j++){
            if (!await args[j].isValid(elements[i]))
                isValid = false;}
        if (isValid) filteredElements.push(elements[i]);
    }
    return filteredElements;
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

    async isValid(nodeId) {
        return await this.condition(nodeId, await this.value);
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
    'Browser actions': ['openBrowser', 'closeBrowser', 'setup', 'browser'],
    'Page actions': ['page', 'goto', 'reload', 'title', 'click', 'doubleClick', 'rightClick', 'hover', 'focus', 'write', 'attach', 'press', 'highlight', 'scrollTo', 'scrollRight', 'scrollLeft', 'scrollUp', 'scrollDown', 'screenshot'],
    'Selectors': ['$', 'image', 'link', 'listItem', 'button', 'inputField', 'fileField', 'textField', 'comboBox', 'checkBox', 'radioButton', 'text', 'contains'],
    'Proximity selectors': ['toLeftOf', 'toRightOf', 'above', 'below', 'near'],
    'Events': ['alert', 'prompt', 'confirm', 'beforeunload'],
    'Helpers': ['intervalSecs', 'timeoutSecs', 'waitForNavigation', 'to', 'into'],
};