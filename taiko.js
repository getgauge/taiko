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

const openBrowser = async(options) => {
    b = await puppeteer.launch(options);
    p = await b.newPage();
};

const closeBrowser = async() => {
    validate();
    await b.close();
};

const goto = async(url, options) => {
    validate();
    await p.goto(url, options);
};

const reload = async(options) => {
    validate();
    await p.reload(options);
};

const click = async(selector, waitForNavigation = true, options = {}) => {
    validate();
    const e = await element(selector);
    await e.click(options);
    await e.dispose();
    if (waitForNavigation) await p.waitForNavigation();
};

const doubleClick = async(selector, waitForNavigation = true, options = {}) => {
    validate();
    await click(selector, waitForNavigation, Object.assign({ clickCount: 2, }, options));
};

const rightClick = async(selector, waitForNavigation = true, options = {}) => {
    validate();
    await click(selector, waitForNavigation, Object.assign({ button: 'right', }, options));
};

const hover = async(selector) => {
    validate();
    const e = await element(selector);
    await e.hover();
    await e.dispose();
};

const focus = async(selector) => {
    validate();
    await (await _focus(selector)).dispose();
};

const write = async(text, into) => {
    validate();
    const e = await _focus(isString(into) ? textField(into) : into);
    await e.type(text);
    await e.dispose();
};

const upload = async(filepath, to) => {
    validate();
    let e;
    if (isString(to)) e = await $xpath(`//input[@type='file'][@id=(//label[contains(text(),'${to}')]/@for)]`);
    else if (isSelector(to)) e = await to.get();
    else throw Error('Invalid element passed as paramenter');
    await e.uploadFile(filepath);
    await e.dispose();
};

const press = async(key, options) => {
    validate();
    await p.keyboard.press(key, options);
};

const highlight = async(selector) => {
    validate();
    await evaluate(selector, e => e.style.border = '0.5em solid red');
};

const scrollTo = async(selector) => {
    validate();
    await evaluate(selector, e => e.scrollIntoViewIfNeeded());
};

const scrollRight = async(e, px = 100) => {
    validate();
    await scroll(e, px, px => window.scrollBy(px, 0), (e, px) => e.scrollLeft += px);
};

const scrollLeft = async(e, px = 100) => {
    validate();
    await scroll(e, px, px => window.scrollBy(px * -1, 0), (e, px) => e.scrollLeft -= px);
};

const scrollUp = async(e, px = 100) => {
    validate();
    await scroll(e, px, px => window.scrollBy(0, px * -1), (e, px) => e.scrollTop -= px);
};

const scrollDown = async(e, px = 100) => {
    validate();
    await scroll(e, px, px => window.scrollBy(0, px), (e, px) => e.scrollTop += px);
};

const $ = (selector) => {
    validate();
    const get = async() => selector.startsWith('//') ? $xpath(selector) : p.$(selector);
    return { get: get, exists: exists(get), };
};

const $$ = (selector) => {
    validate();
    const get = async() => selector.startsWith('//') ? $$xpath(selector) : p.$$(selector);
    return { get: get, exists: async() => (await get()).length > 0, };
};

const image = (selector) => {
    validate();
    assertType(selector);
    const get = async() => p.$(`img[alt='${selector}']`);
    return { get: get, exists: exists(get), };
};

const link = (selector) => {
    validate();
    const get = async() => getElementByTag(selector, 'a');
    return { get: get, exists: exists(get), };
};

const listItem = (selector) => {
    validate();
    const get = async() => getElementByTag(selector, 'li');
    return { get: get, exists: exists(get), };
};

const button = (selector) => {
    validate();
    const get = async() => getElementByTag(selector, 'button');
    return { get: get, exists: exists(get), };
};

const inputField = (attribute, selector) => {
    validate();
    assertType(selector);
    const get = async() => p.$(`input[${attribute}='${selector}']`);
    return { get: get, exists: exists(get), value: async() => p.evaluate(e => e.value, await get()), };
};

const textField = (selector) => {
    validate();
    assertType(selector);
    const get = async() => $xpath(`//input[@type='text'][@id=(//label[contains(text(),'${selector}')]/@for)]`);
    return { get: get, exists: exists(get), value: async() => p.evaluate(e => e.value, await get()), };
};

const comboBox = (selector) => {
    validate();
    assertType(selector);
    const get = async() => $xpath(`//select[@id=(//label[contains(text(),'${selector}')]/@for)]`);
    return {
        get: get,
        exists: exists(get),
        select: async(value) => {
            const box = await get();
            if (!box) throw new Error('Combo Box not found');
            await p.evaluate((box, value) => {
                Array.from(box.options).filter(o => o.text === value).forEach(o => o.selected = true);
            }, box, value);
        },
        value: async() => p.evaluate(e => e.value, await get())
    };
};

const checkBox = (selector) => {
    validate();
    assertType(selector);
    const get = async() => $xpath(`//input[@type='checkbox'][@id=(//label[contains(text(),'${selector}')]/@for)]`);
    return {
        get: get,
        exists: exists(get),
        isChecked: async() => p.evaluate(e => e.checked, await get())
    };
};

const radioButton = (selector) => {
    validate();
    assertType(selector);
    const get = async() => $xpath(`//input[@type='radio'][@id=(//label[contains(text(),'${selector}')]/@for)]`);
    return {
        get: get,
        exists: exists(get),
        isSelected: async() => p.evaluate(e => e.checked, await get())
    };
};

const alert = (message, callback) => dialog('alert', message, callback);

const prompt = (message, callback) => dialog('prompt', message, callback);

const confirm = (message, callback) => dialog('confirm', message, callback);

const beforeunload = (message, callback) => dialog('beforeunload', message, callback);

const text = (text) => {
    validate();
    assertType(text);
    const get = async(e = '*') => $xpath('//' + e + `[text()='${text}']`);
    return { get: get, exists: exists(get), };
};

const contains = (text) => {
    validate();
    assertType(text);
    const get = async(e = '*') => $xpath('//' + e + `[contains(text(),'${text}')]`);
    return { get: get, exists: exists(get), };
};

const element = async(selector) => {
    const e = await (() => {
        if (isString(selector)) return contains(selector).get();
        else if (isSelector(selector)) return selector.get();
        return null;
    })();
    if (!e) throw new Error('Element not found');
    return e;
};

const getElementByTag = async(selector, tag) => {
    if (isString(selector)) return contains(selector).get(tag);
    else if (isSelector(selector)) return selector.get(tag);
    return null;
};

const _focus = async(selector) => {
    const e = await element(selector);
    await p.evaluate(e => e.focus(), e);
    return e;
};

const scroll = async(e, px, scrollPage, scrollElement) => {
    e = e || 100;
    await (Number.isInteger(e) ? p.evaluate(scrollPage, e) : evaluate(e, scrollElement, px));
};

const dialog = (type, message, callback) => {
    validate();
    p.on('dialog', async dialog => {
        if (dialog.type === type && dialog.message() === message)
            await callback(dialog);
    });
};

const screenshot = async(options) => p.screenshot(options);

const isString = (obj) => typeof obj === 'string' || obj instanceof String;

const isSelector = (obj) => obj['get'] && obj['exists'];

const $xpath = async(selector) => {
    const result = await $$xpath(selector);
    return result.length > 0 ? result[0] : null;
};

const $$xpath = async(selector) => {
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
    if (!b || !p) throw new Error('Browser or Page not initialized. Call openBrowser() before using this API.');
};

const assertType = (obj, condition = isString, message = 'String parameter expected') => {
    if (!condition(obj)) throw new Error(message);
};

const sleep = (milliseconds) => {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++)
        if ((new Date().getTime() - start) > milliseconds) break;
};

const exists = (get) => {
    return async(intervalTime = 1000, timeout = 10000) => {
        try {
            await waitUntil(async() => (await get()) != null, intervalTime, timeout);
            return true;
        } catch (e) {
            return false;
        }
    };
};

const waitUntil = async(condition, intervalTime, timeout) => {
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

const evaluate = async(selector, callback, ...args) => {
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