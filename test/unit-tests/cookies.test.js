let { openBrowser, closeBrowser, setCookie } = require('../../lib/taiko');
let {openBrowserArgs } = require('./test-util');
let test_name = 'cookies';

describe(test_name, () => {
    beforeAll(async () => {
        await openBrowser(openBrowserArgs);
    }, 30000);

    afterAll(async () => {
        await closeBrowser();
    }, 30000);

    test('setCookie should throw error if url or domain is not specified', async () => {
        await expect(setCookie('someCookie', 'foo')).rejects.toThrow('Atleast URL or Domain needs to be specified for setting cookies');
    });

    test('setCookie should throw error if cookie is not set', async () => {
        let cookieName = 'MySetCookie';
        await expect(setCookie(cookieName, 'Foo', {url: 'file:///foo.html'})).rejects.toThrow('Unable to set ' + cookieName + ' cookie');
    });
});