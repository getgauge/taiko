const expect = require('chai').expect;
let { openBrowser, goto, closeBrowser, text, inputField, toRightOf, evaluate } = require('../../lib/taiko');
let { createHtml, removeFile, openBrowserArgs } = require('./test-util');
let test_name = 'textMatch';

describe('match', () => {
    let filePath;

    describe('text match', () => {
        before(async () => {
            let innerHtml = '<div>' +
                //text node exists
                '<div>' +
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
                '</script>' +
                // same text node in page
                '<div><p>Sign up</p></div>' +
                '<div><p>By clicking “Sign up for GitHub”</p></div>' +
                '<span>Sign up for GitHub<span>' +
                //text node in different tags
                '<div>create account</div>' +
                '<div>By clicking “create account in GitHub”</div>' +
                '<a href="github.com">create account</a>' +
                '<a href="github.com">create account now</a>' +
                '<button class="button" type="submit">create account</button>' +
                '<button class="button" type="submit">create account in GitHub</button>' +
                //text node with input tag
                '<input type="text" value="password" />' +
                '<input type="text" value="Enter password" />' +
                //text node with value
                '<p>taiko demo</p>' +
                '<input type="text" value="taiko demo" />' +
                '<p>Enter name for taiko demo</p>' +
                '<input type="text" value="Enter name for taiko demo" />' +
                //text node with type
                '<p>this is text</p>' +
                '<input type="text" value="user name" />' +
                '<p>Enter user name in textbox</p>' +
                '<input type="text" value="Enter user name" />' +
                '</div>';
            filePath = createHtml(innerHtml, test_name);
            await openBrowser(openBrowserArgs);
            await goto(filePath);


        });
        after(async () => {
            await closeBrowser();
            removeFile(filePath);
        });

        describe('text node', () => {
            it('test exact match exists()', async () => {
                expect(await text('User name:').exists()).to.be.true;
                expect(await text('user name:').exists()).to.be.true;
            });

            it('test partial match exists()', async () => {
                expect(await text('User').exists()).to.be.true;
            });

            it('test proximity selector', async () => {
                expect(await inputField(toRightOf('User name:')).exists()).to.be.true;
            });
        });

        describe('value or type of field as text', () => {
            it('test value as text exists()', async () => {
                expect(await text('click me').exists()).to.be.true;
            });

            it('test type as text exists()', async () => {
                expect(await text('submit').exists()).to.be.true;
            });
        });

        describe('text across element', () => {
            it('test exact match exists()', async () => {
                expect(await text('Text Across Element').exists()).to.be.true;
            });

            it('test partial match exists()', async () => {
                expect(await text('Text').exists()).to.be.true;
            });
        });

        describe('text in iframe should be matched if match in top is invisible', () => {
            it('test text exists()', async () => {
                expect(await text('Text in iframe').exists()).to.be.true;
            });

            it('test text is from iframe', async () => {
                const id = await evaluate(text('Text in iframe'), (elem) => { return elem.parentElement.id; });
                expect(id.result).to.equal('inIframe');
            });
        });
        describe('match text in multiple paragraph', () => {
            it('test exact match for text', async () => {
                expect(await text('Sign up').exists()).to.be.true;
                expect(await text('Sign up').get()).to.have.lengthOf(1);
            });
            it('test contains match for text', async () => {
                expect(await text('Sign').exists()).to.be.true;
                expect(await text('Sign').get()).to.have.lengthOf(3);
            });
        });
        describe('match text in different tags', () => {
            it('test exact match for text in multiple elememts', async () => {
                expect(await text('create account').exists()).to.be.true;
                expect(await text('create account').get()).to.have.lengthOf(3);
            });
            it('test contains match for text in multiple elements', async () => {
                expect(await text('account').exists()).to.be.true;
                expect(await text('account').get()).to.have.lengthOf(6);
            });
        });
        describe('match text as value in input field', () => {
            it('test exact match for value in input', async () => {
                expect(await text('password').exists()).to.be.true;
                expect(await text('password').get()).to.have.lengthOf(1);
            });
            it('test contains match for value in input', async () => {
                expect(await text('pass').exists()).to.be.true;
                expect(await text('pass').get()).to.have.lengthOf(2);
            });
        });
        describe('match text for value and paragraph', () => {
            it('test exact match for value and text', async () => {
                expect(await text('taiko demo').exists()).to.be.true;
                expect(await text('taiko demo').get()).to.have.lengthOf(2);
            });
            it('test contains match for value and text', async () => {
                expect(await text('demo').exists()).to.be.true;
                expect(await text('demo').get()).to.have.lengthOf(4);
            });
        });
        describe('match text for type and paragraph', () => {
            it('test exact match for type', async () => {
                expect(await text('text').exists()).to.be.true;
                expect(await text('text').get()).to.have.lengthOf(8);
            });
            it('test contains match for type and text', async () => {
                expect(await text('tex').exists()).to.be.true;
                expect(await text('tex').get()).to.have.lengthOf(11);
            });
        });
    });
});