const puppeteer = require('puppeteer');

let b, p;

const browser = () => b;

const page = () => p;

const openBrowser = async(options) => {
    b = await puppeteer.launch(options);
    p = await b.newPage();
}

const closeBrowser = async(options) => b.close();

const goto = async(url, options) => {await p.goto(url, options)};

const reload = async(options) => p.reload(options);

const click = async(selector, waitForNavigation = true, options = {}) => {
    const e = await element(selector);
    await e.click(options);
    await e.dispose();
    if (waitForNavigation) await p.waitForNavigation();
}

const doubleClick = async(selector, waitForNavigation = true, options = {}) => {
    await click(selector, waitForNavigation, Object.assign({ clickCount: 2, }, options));
}

const rightClick = async(selector, waitForNavigation = true, options = {}) => {
    await click(selector, waitForNavigation, Object.assign({ button: 'right', }, options));
}

const hover = async(selector) => {
    const e = await element(selector);
    await e.hover();
    await e.dispose();
}

const focus = async(selector) => await (await _focus(selector)).dispose();

const write = async(text, into) => {
    const e = await _focus(isString(into) ? textField(into) : into);
    await e.type(text);
    await e.dispose();
}

const upload = async(filepath, to) => {
    let e;
    if (isString(to)) e = await $xpath(`//input[@type='file'][@id=(//label[contains(text(),'${to}')]/@for)]`);
    else if (isSelector(to)) e = await to.get();
    else throw Error("Invalid element passed as paramenter");
    await e.uploadFile(filepath);
    await e.dispose();
}

const press = async(key, options) => p.keyboard.press(key);

const highlight = async(selector) => evaluate(selector, e => e.style.border = '0.5em solid red');

const scrollTo = async(selector) => evaluate(selector, e => e.scrollIntoViewIfNeeded());

const scrollRight = async(e, px = 100) => scroll(e, px, px => window.scrollBy(px, 0), (e, px) => e.scrollLeft += px);

const scrollLeft = async(e, px = 100) => scroll(e, px, px => window.scrollBy(px * -1, 0), (e, px) => e.scrollLeft -= px);

const scrollUp = async(e, px = 100) => scroll(e, px, px => window.scrollBy(0, px * -1), (e, px) => e.scrollTop -= px);

const scrollDown = async(e, px = 100) => scroll(e, px, px => window.scrollBy(0, px), (e, px) => e.scrollTop += px);

const $ = (selector) => {
    const get = async() => selector.startsWith('//') ? $xpath(selector) : p.$(selector);
    return { get: get, exists: exists(get), };
}

const $$ = (selector) => {
    const get = async() => selector.startsWith('//') ? $$xpath(selector) : p.$$(selector);
    return { get: get, exists: async() => (await get()).length > 0, };
}

const image = (selector) => {
    assertType(selector);
    const get = async() => p.$(`img[alt='${selector}']`);
    return { get: get, exists: exists(get), };
}

const link = (selector) => {
    const get = async() => getElementByTag(selector, 'a');
    return { get: get, exists: exists(get), };
}

const listItem = (selector) => {
    const get = async() => getElementByTag(selector, 'li');
    return { get: get, exists: exists(get), };
}

const button = (selector) => {
    const get = async() => getElementByTag(selector, 'button');
    return { get: get, exists: exists(get), };
}

const inputField = (attribute, selector) => {
    assertType(selector);
    const get = async() => p.$(`input[${attribute}='${selector}']`);
    return { get: get, exists: exists(get), value: async() => p.evaluate(e => e.value, await get()), }
}

const textField = (selector) => {
    assertType(selector);
    const get = async() => $xpath(`//input[@type='text'][@id=(//label[contains(text(),'${selector}')]/@for)]`);
    return { get: get, exists: exists(get), value: async() => p.evaluate(e => e.value, await get()), }
}

const comboBox = (selector) => {
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
            }, box, value)
        },
        value: async() => p.evaluate(e => e.value, await get())
    }
}

const checkBox = (selector) => {
    assertType(selector);
    const get = async() => $xpath(`//input[@type='checkbox'][@id=(//label[contains(text(),'${selector}')]/@for)]`);
    return {
        get: get,
        exists: exists(get),
        isChecked: async() => p.evaluate(e => e.checked, await get())
    }
}

const radioButton = (selector) => {
    assertType(selector);
    const get = async() => $xpath(`//input[@type='radio'][@id=(//label[contains(text(),'${selector}')]/@for)]`);
    return {
        get: get,
        exists: exists(get),
        isSelected: async() => p.evaluate(e => e.checked, await get())
    }
}

const alert = (message, callback) => dialog('alert', message, callback);

const prompt = (message, callback) => dialog('prompt', message, callback);

const confirm = (message, callback) => dialog('confirm', message, callback);

const beforeunload = (message, callback) => dialog('beforeunload', message, callback);

const text = (text) => {
    assertType(text);
    const get = async(e = '*') => $xpath('//' + e + `[text()='${text}']`);
    return { get: get, exists: exists(get), };
}

const contains = (text) => {
    assertType(text);
    const get = async(e = '*') => $xpath('//' + e + `[contains(text(),'${text}')]`);
    return { get: get, exists: exists(get), };
}

const element = async(selector) => {
    const e = await (() => {
        if (isString(selector)) return contains(selector).get();
        else if (isSelector(selector)) return selector.get();
        return null;
    })();
    if (!e) throw new Error("Element not found");
    return e;
}

const getElementByTag = async(selector, tag) => {
    if (isString(selector)) return contains(selector).get(tag);
    else if (isSelector(selector)) return selector.get(tag);
    return null;
}

const _focus = async(selector) => {
    const e = await element(selector);
    await p.evaluate(e => e.focus(), e);
    return e;
}

const scroll = async(e, px, scrollPage, scrollElement) => {
    if(!e) e = 100;
    await (Number.isInteger(e) ? p.evaluate(scrollPage, e) : evaluate(e, scrollElement, px));
}

const dialog = (type, message, callback) => {
    p.on('dialog', async dialog => {
        if (dialog.type === type && dialog.message() === message)
            await callback(dialog);
    });
}

const screenshot = async(options) => p.screenshot(options);

const isString = (obj) => typeof obj === 'string' || obj instanceof String;

const isSelector = (obj) => obj['get'] && obj['exists'];

const $xpath = async(selector) => {
    const result = await $$xpath(selector);
    return result.length > 0 ? result[0] : null;
}

const $$xpath = async(selector) => {
    const arrayHandle = await p.mainFrame()._context.evaluateHandle(selector => {
        let node, results = [];
        let result = document.evaluate(selector, document, null, XPathResult.ANY_TYPE, null);
        while (node = result.iterateNext())
            results.push(node);
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
}

const assertType = (obj, condition = isString, message = 'String parameter expected') => {
    if (!condition(obj)) throw new Error(message);
}

const sleep = (milliseconds) => {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++)
        if ((new Date().getTime() - start) > milliseconds) break;
}

const exists = (get) => {
    return async(intervalTime = 1000, timeout = 10000) => {
        try {
            await waitUntil(async() => (await get()) != null, intervalTime, timeout);
            return true;
        } catch (e) {
            return false;
        }
    }
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
}

const evaluate = async(selector, callback, ...args) => {
    const e = await element(selector);
    await p.evaluate(callback, e, ...args);
    await e.dispose();
}

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
}