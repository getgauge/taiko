const puppeteer = require('puppeteer');

let b, p;

const browser = () => {
    validate();
    return b;
};

const page = () => {
    validate();
    return p;
};

const openBrowser = async options => {
    b = await puppeteer.launch(options);
    p = await b.newPage();
    return { description: 'Browser and page initialized' };
};

const closeBrowser = async () => {
    validate();
    await b.close();
    b, p = null;
    return { description: 'Browser and page closed' };
};

const goto = async (url, options) => {
    validate();
    await p.goto(url, options);
    return { description: `Navigated to url "${p.url()}"`, url: p.url() };
};

const reload = async options => {
    validate();
    await p.reload(options);
    return { description: `"${p.url()}" reloaded`, url: p.url() };
};

const click = async (selector, waitForNavigation = true, options = {}) => {
    validate();
    const e = await element(selector);
    await e.click(options);
    await e.dispose();
    if (waitForNavigation) await p.waitForNavigation();
    return { description: 'Clicked ' + description(selector, true) };
};

const doubleClick = async (selector, waitForNavigation = true, options = {}) => {
    validate();
    await click(selector, waitForNavigation, Object.assign({ clickCount: 2, }, options));
    return { description: 'Double clicked ' + description(selector, true) };
};

const rightClick = async (selector, waitForNavigation = true, options = {}) => {
    validate();
    await click(selector, waitForNavigation, Object.assign({ button: 'right', }, options));
    return { description: 'Right clicked ' + description(selector, true) };
};

const hover = async selector => {
    validate();
    const e = await element(selector);
    await e.hover();
    await e.dispose();
    return { description: 'Hovered over the ' + description(selector, true) };
};

const focus = async selector => {
    validate();
    await (await _focus(selector)).dispose();
    return { description: 'Focussed on the ' + description(selector, true) };
};

const write = async (text, into) => {
    validate();
    const selector = isString(into) ? textField(into) : into;
    const e = await _focus(selector);
    await e.type(text);
    await e.dispose();
    return { description: `Wrote ${text} in the ` + description(selector, true) };
};

const upload = async (filepath, to) => {
    validate();
    if (isString(to)) to = {
        get: async () => $xpath(`//input[@type='file'][@id=(//label[contains(text(),'${to}')]/@for)]`),
        desc: `File input field with label containing "${to}"`,
    };
    else if (!isSelector(to)) throw Error('Invalid element passed as paramenter');
    const e = await to.get();
    await e.uploadFile(filepath);
    await e.dispose();
    return { description: `Uploaded ${filepath} to the ` + description(to, true) };
};

const press = async (key, options) => {
    validate();
    await p.keyboard.press(key, options);
    return { description: `Pressed the ${key} key` };
};

const highlight = async selector => {
    validate();
    await evaluate(selector, e => e.style.border = '0.5em solid red');
    return { description: 'Highlighted the ' + description(selector, true) };
};

const scrollTo = async selector => {
    validate();
    await evaluate(selector, e => e.scrollIntoViewIfNeeded());
    return { description: 'Scrolled to the ' + description(selector, true) };
};

const scrollRight = async (e, px = 100) => {
    validate();
    return await scroll(e, px, px => window.scrollBy(px, 0), (e, px) => e.scrollLeft += px, 'right');
};

const scrollLeft = async (e, px = 100) => {
    validate();
    return await scroll(e, px, px => window.scrollBy(px * -1, 0), (e, px) => e.scrollLeft -= px, 'left');
};

const scrollUp = async (e, px = 100) => {
    validate();
    return await scroll(e, px, px => window.scrollBy(0, px * -1), (e, px) => e.scrollTop -= px), 'top';
};

const scrollDown = async (e, px = 100) => {
    validate();
    return await scroll(e, px, px => window.scrollBy(0, px), (e, px) => e.scrollTop += px, 'down');
};

const $ = selector => {
    validate();
    const get = async () => selector.startsWith('//') ? $xpath(selector) : p.$(selector);
    return { get: get, exists: exists(get), desc: `Custom selector "$(${selector})"` };
};

const $$ = selector => {
    validate();
    const get = async () => selector.startsWith('//') ? $$xpath(selector) : p.$$(selector);
    return { get: get, exists: async () => (await get()).length > 0, desc: `Custom selector $$(${selector})` };
};

const image = selector => {
    validate();
    assertType(selector);
    const get = async () => p.$(`img[alt='${selector}']`);
    return { get: get, exists: exists(get), desc: `Image with "alt=${selector}"` };
};

const link = selector => {
    validate();
    const get = async () => element(selector, 'a');
    return { get: get, exists: exists(get), desc: description(selector).replace('Element', 'Link') };
};

const listItem = selector => {
    validate();
    const get = async () => element(selector, 'li');
    return { get: get, exists: exists(get), desc: description(selector).replace('Element', 'List item') };
};

const button = selector => {
    validate();
    const get = async () => element(selector, 'button');
    return { get: get, exists: exists(get), desc: description(selector).replace('Element', 'Button') };
};

const inputField = (attribute, selector) => {
    validate();
    assertType(selector);
    const get = async () => p.$(`input[${attribute}='${selector}']`);
    return {
        get: get,
        exists: exists(get),
        desc: `Input field with "${attribute} = ${selector}"`,
        value: async () => p.evaluate(e => e.value, await get()),
    };
};

const textField = selector => {
    validate();
    assertType(selector);
    const get = async () => $xpath(`//input[@type='text'][@id=(//label[contains(text(),'${selector}')]/@for)]`);
    return {
        get: get,
        exists: exists(get),
        desc: `Text field with label containing "${selector}"`,
        value: async () => p.evaluate(e => e.value, await get()),
    };
};

const comboBox = selector => {
    validate();
    assertType(selector);
    const get = async () => $xpath(`//select[@id=(//label[contains(text(),'${selector}')]/@for)]`);
    return {
        get: get,
        exists: exists(get),
        desc: `Combo box with label containing "${selector}"`,
        select: async (value) => {
            const box = await get();
            if (!box) throw new Error('Combo Box not found');
            await p.evaluate((box, value) => {
                Array.from(box.options).filter(o => o.text === value).forEach(o => o.selected = true);
            }, box, value);
        },
        value: async () => p.evaluate(e => e.value, await get()),
    };
};

const checkBox = selector => {
    validate();
    assertType(selector);
    const get = async () => $xpath(`//input[@type='checkbox'][@id=(//label[contains(text(),'${selector}')]/@for)]`);
    return {
        get: get,
        exists: exists(get),
        desc: `Checkbox with label containing "${selector}"`,
        isChecked: async () => p.evaluate(e => e.checked, await get()),
    };
};

const radioButton = selector => {
    validate();
    assertType(selector);
    const get = async () => $xpath(`//input[@type='radio'][@id=(//label[contains(text(),'${selector}')]/@for)]`);
    return {
        get: get,
        exists: exists(get),
        desc: `Radio button with label containing "${selector}"`,
        isSelected: async () => p.evaluate(e => e.checked, await get())
    };
};

const text = text => {
    validate();
    assertType(text);
    const get = async (e = '*') => $xpath('//' + e + `[text()='${text}']`);
    return { get: get, exists: exists(get), desc: `Element with text "${text}"` };
};

const contains = text => {
    validate();
    assertType(text);
    const get = async (e = '*') => $xpath('//' + e + `[contains(text(),'${text}')]`);
    return { get: get, exists: exists(get), desc: `Element containing text "${text}"` };
};

const alert = (message, callback) => dialog('alert', message, callback);

const prompt = (message, callback) => dialog('prompt', message, callback);

const confirm = (message, callback) => dialog('confirm', message, callback);

const beforeunload = (message, callback) => dialog('beforeunload', message, callback);

const element = async (selector, tag) => {
    const e = await (() => {
        if (isString(selector)) return contains(selector).get(tag);
        else if (isSelector(selector)) return selector.get(tag);
        return null;
    })();
    if (!e) throw new Error('Element not found');
    return e;
};

const description = (selector, lowerCase) => {
    const d = (() => {
        if (isString(selector)) return contains(selector).desc;
        else if (isSelector(selector)) return selector.desc;
        return '';
    })();
    return lowerCase ? d.charAt(0).toLowerCase() + d.slice(1) : d;
};

const _focus = async selector => {
    const e = await element(selector);
    await p.evaluate(e => e.focus(), e);
    return e;
};

const scroll = async (e, px, scrollPage, scrollElement, direction) => {
    e = e || 100;
    if (Number.isInteger(e)) {
        await p.evaluate(scrollPage, e);
        return { description: `Scrolled ${direction} the page by ${px} pixels` };
    }
    await evaluate(e, scrollElement, px);
    return { description: `Scrolled ${direction} ` + description(e, true) + ` by ${px} pixels` };
};

const dialog = (type, message, callback) => {
    validate();
    p.on('dialog', async dialog => {
        if (dialog.type === type && dialog.message() === message)
            await callback(dialog);
    });
};

const screenshot = async options => p.screenshot(options);

const isString = obj => typeof obj === 'string' || obj instanceof String;

const isSelector = obj => obj['get'] && obj['exists'];

const $xpath = async selector => {
    const result = await $$xpath(selector);
    return result.length > 0 ? result[0] : null;
};

const $$xpath = async selector => {
    const arrayHandle = await p.mainFrame()._context.evaluateHandle(selector => {
        let result = document.evaluate(selector, document, null, XPathResult.ANY_TYPE, null),
            node = result.iterateNext(),
            results = [];
        while (node) {
            results.push(node);
            node = result.iterateNext();
        }
        return results;
    }, selector);
    const properties = await arrayHandle.getProperties();
    await arrayHandle.dispose();
    const result = [];
    for (const property of properties.values()) {
        const elementHandle = property.asElement();
        if (elementHandle) result.push(elementHandle);
    }
    return result;
};

const validate = () => {
    if (!b || !p) throw new Error('Browser or page not initialized. Call `openBrowser()` before using this API');
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
            await waitUntil(async () => (await get()) != null, intervalTime, timeout);
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

const evaluate = async (selector, callback, ...args) => {
    const e = await element(selector);
    await p.evaluate(callback, e, ...args);
    await e.dispose();
};

module.exports = {
    browser,
    page,
    openBrowser,
    closeBrowser,
    goto,
    reload,
    $,
    $$,
    link,
    listItem,
    inputField,
    textField,
    image,
    button,
    comboBox,
    checkBox,
    radioButton,
    alert,
    prompt,
    confirm,
    beforeunload,
    text,
    contains,
    click,
    doubleClick,
    rightClick,
    write,
    press,
    upload,
    highlight,
    focus,
    scrollTo,
    scrollRight,
    scrollLeft,
    scrollUp,
    scrollDown,
    hover,
    screenshot,
    timeoutSecs: secs => secs * 1000,
    intervalSecs: secs => secs * 1000,
    waitForNavigation: e => e,
    to: e => e,
    into: e => e,
};