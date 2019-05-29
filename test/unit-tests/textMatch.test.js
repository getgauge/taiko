let { openBrowser, goto, closeBrowser, text, textBox, toRightOf, evaluate } = require('../../lib/taiko');
let { createHtml, removeFile, openBrowserArgs } = require('./test-util');
let test_name = 'textMatch';

describe('match', () => {
    let filePath;
    beforeAll(async () => {
        await openBrowser(openBrowserArgs);
    }, 30000);

    afterAll(async () => {
        await closeBrowser();
    }, 30000);

    describe('text match', () => {
        beforeAll(() => {
            let innerHtml = '<div>' +
                '<div name="text_node">' +
                'User name: <input type="text" name="uname">' +
                '</div>' +
                '<div name="value_or_type_of_field_as_text">' +
                '<input type="button" value="click me">' +
                '<input type="submit">' +
                '</div>' +
                '<div name="text_across_element">' +
                '<div>Text <span>Across</span> Element</div>' +
                '</div>' +
                '<div id="inTop" name="text_same_as_iframe" style="display: none">' +
                'Text in iframe' +
                '</div>' +
                '<iframe></iframe>' +
                '<script>' +
                'document.querySelector("iframe").contentDocument.write("<div id=\\"inIframe\\">Text in iframe</div>")' +
                '</script>';
            filePath = createHtml(innerHtml, test_name);
        });

        beforeEach(async () => {
            await goto(filePath);
        });

        afterAll(() => {
            removeFile(filePath);
        });

        describe('text node', () => {
            test('test exact match exists()', async () => {
                await expect(text('User name:').exists()).resolves.toBeTruthy();
                await expect(text('user name:').exists()).resolves.toBeTruthy();
            });

            test('test partial match exists()', async () => {
                await expect(text('User').exists()).resolves.toBeTruthy();
            });

            test('test proximity selector', async () => {
                await expect(textBox(toRightOf('User name:')).exists()).resolves.toBeTruthy();
            });
        });

        describe('value or type of field as text', () => {
            test('test value as text exists()', async () => {
                await expect(text('click me').exists()).resolves.toBeTruthy();
            });

            test('test type as text exists()', async () => {
                await expect(text('submit').exists()).resolves.toBeTruthy();
            });
        });

        describe('text across element', () => {
            test('test exact match exists()', async () => {
                await expect(text('Text Across Element').exists()).resolves.toBeTruthy();
            });

            test('test partial match exists()', async () => {
                await expect(text('Text').exists()).resolves.toBeTruthy();
            });
        });

        describe('text in iframe should be matched if match in top is invisible', () => {
            test('test text exists()', async () => {
                await expect(text('Text in iframe').exists()).resolves.toBeTruthy();
            });

            test('test text is from iframe', async () => {
                const id = await evaluate(text('Text in iframe'), (elem) => { return elem.parentElement.id; });
                expect(id.result).toBe('inIframe');
            });
        });
    });

    describe('match multiple text in page', () => {
        describe('match text in multiple paragraph', () => {
            beforeAll(async () => {
                let innerHtml = '<div><p>Sign up</p></div>' +
                    '<div><p>By clicking “Sign up for GitHub”</p></div>' +
                    '<span>Sign up for GitHub<span>';
                filePath = createHtml(innerHtml, test_name);
                await goto(filePath);
            });

            afterAll(() => {
                removeFile(filePath);
            });

            test('test exact match for text', async () => {
                await expect(text('Sign up').exists()).resolves.toBeTruthy();
                await expect(text('Sign up').get().then(elements => elements.length)).resolves.toEqual(1);
                await expect(text('Sign').get().then(elements => elements.length)).resolves.toEqual(3);
            });
            test('test contains match for text', async () => {
                await expect(text('Sign').exists()).resolves.toBeTruthy();
                await expect(text('Sign').get().then(elements => elements.length)).resolves.toEqual(3);
            });
        });

        describe('match text in different tags', () => {
            beforeAll(async () => {
                let innerHtml = '<div>Sign up</div>' +
                    '<div>By clicking “Sign up for GitHub”</div>' +
                    '<a href="github.com">Sign up</a>' +
                    '<a href="github.com">Sign up now</a>' +
                    '<button class="button" type="submit">Sign up</button>' +
                    '<button class="button" type="submit">Sign up for GitHub</button>';
                filePath = createHtml(innerHtml, test_name);
                await goto(filePath);
            });

            afterAll(() => {
                removeFile(filePath);
            });

            test('test exact match for text in multiple elememts', async () => {
                await expect(text('Sign up').exists()).resolves.toBeTruthy();
                await expect(text('Sign up').get().then(elements => elements.length)).resolves.toEqual(3);
            });
            test('test contains match for text in multiple elements', async () => {
                await expect(text('Sign').exists()).resolves.toBeTruthy();
                await expect(text('Sign').get().then(elements => elements.length)).resolves.toEqual(6);
            });
        });
        describe('match text as value in input field', () => {
            beforeAll(async () => {
                let innerHtml =
                '<input type="text" value="user_name" />'+
                '<input type="text" value="Enter user name" />';
                filePath = createHtml(innerHtml, test_name);
                await goto(filePath);
            });

            afterAll(() => {
                removeFile(filePath);
            });

            test('test exact match for value in input', async () => {
                await expect(text('user_name').exists()).resolves.toBeTruthy();
                await expect(text('user_name').get().then(elements => elements.length)).resolves.toEqual(1);
            });
            test('test contains match for value in input', async () => {
                await expect(text('user').exists()).resolves.toBeTruthy();
                await expect(text('user').get().then(elements => elements.length)).resolves.toEqual(2);
            });
        });
        describe('match text for value and paragraph', () => {
            beforeAll(async () => {
                let innerHtml = '<p>user name</p>'+
                '<input type="text" value="user name" />'+
                '<p>Enter user name</p>'+
                '<input type="text" value="Enter user name" />';
                filePath = createHtml(innerHtml, test_name);
                await goto(filePath);
            });

            afterAll(() => {
                removeFile(filePath);
            });

            test('test exact match for value and text', async () => {
                await expect(text('user name').exists()).resolves.toBeTruthy();
                await expect(text('user name').get().then(elements => elements.length)).resolves.toEqual(2);
            });
            test('test contains match for value and text', async () => {
                await expect(text('user').exists()).resolves.toBeTruthy();
                await expect(text('user').get().then(elements => elements.length)).resolves.toEqual(4);
            });
            describe('match text for type and paragraph', () => {
                beforeAll(async () => {
                    let innerHtml = '<p>this is demo for text</p>'+
                    '<input type="text" value="user name" />'+
                    '<p>Enter user name in textbox</p>'+
                    '<input type="text" value="Enter user name" />';
                    filePath = createHtml(innerHtml, test_name);
                    await goto(filePath);
                });

                afterAll(() => {
                    removeFile(filePath);
                });

                test('test exact match for type', async () => {
                    await expect(text('text').exists()).resolves.toBeTruthy();
                    await expect(text('text').get().then(elements => elements.length)).resolves.toEqual(2);
                });
                test('test contains match for type and text', async () => {
                    await expect(text('tex').exists()).resolves.toBeTruthy();
                    await expect(text('tex').get().then(elements => elements.length)).resolves.toEqual(4);
                });
            });
        });
    });
});