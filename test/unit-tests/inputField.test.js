let { openBrowser, goto, inputField, closeBrowser, intervalSecs, timeoutSecs, below } = require('../../lib/taiko');
let { createHtml, openBrowserArgs, removeFile } = require('./test-util');
const test_name = 'inputfield';

describe('inputField', () => {

    beforeAll(async () => {
        await openBrowser(openBrowserArgs);
    }, 30000);

    afterAll(async () => {
        await closeBrowser();
    }, 30000);

    describe('with inline text', () => {
        let filePath;
        beforeAll(() => {
            let innerHtml = '<form> \n' +
                '<input type="text" name="user[login]" id="user[login]" /> \n' +
                '<input type="text" name="user[email]" id="user[email]" /> \n' +
                '<input type="password" name="user[password]" id="user[password]" /> \n' +
                '</form>';
            filePath = createHtml(innerHtml, test_name);
        });

        beforeEach(async () => {
            await goto(filePath);
        });

        afterAll(() => {
            removeFile(filePath);
        });

        test('test exists()', async () => {
            await expect(inputField({ id: 'user[login]' }).exists()).resolves.toBeTruthy();
            await expect(inputField({ id: 'user[email]' }).exists()).resolves.toBeTruthy();
            await expect(inputField({ id: 'user[re-password]' }).exists(intervalSecs(0), timeoutSecs(0))).resolves.toBeFalsy();
        });
    });

    describe('wrapped in label', () => {
        let filePath;
        beforeAll(() => {
            let innerHtml = '<form> \n' +
                '<label><input type="text" name="user[login]" id="user[login]" /></label> \n' +
                '<label><input type="text" name="user[email]" id="user[email]" /></label> \n' +
                '<label><input type="password" name="user[password]" id="user[password]" /></label> \n' +
                '</form>';
            filePath = createHtml(innerHtml, test_name);
        });

        beforeEach(async () => {
            await goto(filePath);
        });

        afterAll(() => {
            removeFile(filePath);
        });

        test('test exists()', async () => {
            await expect(inputField({ id: 'user[login]' }).exists()).resolves.toBeTruthy();
            await expect(inputField({ id: 'user[re-password]' }).exists(intervalSecs(0), timeoutSecs(0))).resolves.toBeFalsy();

        });
    });

    describe('with label for', () => {
        let filePath;
        beforeAll(() => {

            let innerHtml = '<form> \n' +
                '<p><label for="login">Login<input type="text" name="user[login]" id="user[login]" /></label></p> \n' +
                '<p><label for="email">Email<input type="text" name="user[email]" id="user[email]" /></label></p> \n' +
                '<p><label for="password">Password<input type="text" name="user[password]" id="user[password]" /></label></p> \n' +
                '</form>';
            filePath = createHtml(innerHtml, test_name);
        });

        beforeEach(async () => {
            await goto(filePath);
        });

        afterAll(() => {
            removeFile(filePath);
        });

        test('test exists()', async () => {
            await expect(inputField('Login').exists()).resolves.toBeTruthy();
            await expect(inputField('Email').exists()).resolves.toBeTruthy();
            await expect(inputField('Password').exists()).resolves.toBeTruthy();
            await expect(inputField('re-password').exists(intervalSecs(0), timeoutSecs(0))).resolves.toBeFalsy();
        });
    });

    describe('with contenteditable text', () => {
        let filePath;
        beforeAll(() => {
            let innerHtml = '<div>Editable Demo</div> \n' +
                '<p contenteditable="true">This is a paragraph. It is editable. Try to change this text.</p>';
            filePath = createHtml(innerHtml, test_name);
        });

        beforeEach(async () => {
            await goto(filePath);
        });

        afterAll(() => {
            removeFile(filePath);
        });

        test('test exists()', async () => {
            await expect(inputField(below('Editable Demo')).exists()).resolves.toBeTruthy();
        });
    });
});