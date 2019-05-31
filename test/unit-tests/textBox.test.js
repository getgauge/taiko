const expect = require('chai').expect;
let { openBrowser, goto, textBox, closeBrowser, write, into} = require('../../lib/taiko');
let { createHtml, removeFile, openBrowserArgs } = require('./test-util');
const test_name = 'textBox';

describe(test_name, () => {
    let filePath;
    before(async () => {
        let innerHtml = '<div>' +
        //Input with type text
        '<form name="inputTypeText">' +
            '<div name="inputTypeTextWithInlineText">' +
                '<input type="text">inputTypeTextWithInlineText</input>' +
            '</div>' +
            '<div name="inputTypeTextWithWrappedLabel">' +
                '<label>' +
                    '<input type="text"/>' +
                    '<span>inputTypeTextWithWrappedLabel</span>' +
                '</label>' +
            '</div>' +
            '<div name="inputTypeTextWithLabelFor">' +
                    '<input id="inputTypeTextWithLabelFor" type="text"/>' +
                    '<label for="inputTypeTextWithLabelFor">inputTypeTextWithLabelFor</label>' +
            '</div>' +
        '</form>' +
        //Input with type password
        '<form name="inputTypePassword">' +
            '<div name="inputTypePasswordWithInlineText">' +
                '<input type="password">inputTypePasswordWithInlineText</input>' +
            '</div>' +
            '<div name="inputTypePasswordWithWrappedLabel">' +
                '<label>' +
                    '<input type="password"/>' +
                    '<span>inputTypePasswordWithWrappedLabel</span>' +
                '</label>' +
            '</div>' +
            '<div name="inputTypePasswordWithLabelFor">' +
                    '<input id="inputTypePasswordWithLabelFor" type="password"/>' +
                    '<label for="inputTypePasswordWithLabelFor">inputTypePasswordWithLabelFor</label>' +
            '</div>' +
        '</form>' +
        //Textarea
        '<form name="textArea">' +
            '<div name="textAreaWithWrappedLabel">' +
                '<label>' +
                    '<span>textAreaWithWrappedLabel</span>' +
                    '<textarea></textarea>' +
                '</label>' +
            '</div>' +
            '<div name="textAreaWithLabelFor">' +
                '<label for="textAreaWithLabelFor">textAreaWithLabelFor</label>' +
                '<textarea id="textAreaWithLabelFor"></textarea>' +
            '</div>' +
        '</form>' +
        //contentEditable div
        '<form name="contentEditable">' +
            '<div name="contentEditableWithWrappedLabel">' +
                '<label>' +
                    '<span>contentEditableWithWrappedLabel</span>' +
                    '<div id="contentEditableWithWrappedLabel" contenteditable=true></div>' +
                '</label>' +
            '</div>' +
            '<div name="contentEditableWithLabelFor">' +
                '<label for="contentEditableWithLabelFor">contentEditableWithLabelFor</label>' +
                '<div id="contentEditableWithLabelFor" contenteditable=true></div>' +
            '</div>' +
        '</form>' +
        '</div>';
        filePath = createHtml(innerHtml, test_name);
        await openBrowser(openBrowserArgs);
        await goto(filePath);
    });

    after(async () => {
        await closeBrowser();
        removeFile(filePath);
    });

    describe('input with type text', () => {
        describe('with inline text', () => {
            it('test exists()', async () => {
                expect(await textBox('inputTypeTextWithInlineText').exists()).to.be.true;
            });

            it('test value()', async () => {
                await write('inputTypeTextWithInlineText', into(textBox('inputTypeTextWithInlineText')));
                expect(await textBox('inputTypeTextWithInlineText').value()).to.equal('inputTypeTextWithInlineText');
            });
        });

        describe('wrapped in label', () => {
            it('test exists()', async () => {
                expect(await textBox('inputTypeTextWithWrappedLabel').exists()).to.be.true;
            });

            it('test value()', async () => {
                await write('inputTypeTextWithWrappedLabel', into(textBox('inputTypeTextWithWrappedLabel')));
                expect(await textBox('inputTypeTextWithWrappedLabel').value()).to.equal('inputTypeTextWithWrappedLabel');
            });
        });

        describe('using label for', () => {
            it('test exists()', async () => {
                expect(await textBox('inputTypeTextWithLabelFor').exists()).to.be.true;
            });

            it('test value()', async () => {
                await write('inputTypeTextWithLabelFor', into(textBox('inputTypeTextWithLabelFor')));
                expect(await textBox('inputTypeTextWithLabelFor').value()).to.equal('inputTypeTextWithLabelFor');
            });
        });

        describe('attribute and value pair', () => {
            it('test exists()', async () => {
                expect(await textBox({id:'inputTypeTextWithLabelFor'}).exists()).to.be.true;
            });

            it('test value()', async () => {
                expect(await textBox({id:'inputTypeTextWithLabelFor'}).value()).to.equal('inputTypeTextWithLabelFor');
            });
        });
    });

    describe('input with type password', () => {
        describe('with inline text',  () => {
            it('test exists()', async () => {
                expect(await textBox('inputTypePasswordWithInlineText').exists()).to.be.true;
            });

            it('test value()', async () => {
                await write('inputTypePasswordWithInlineText', into(textBox('inputTypePasswordWithInlineText')));
                expect(await textBox('inputTypePasswordWithInlineText').value()).to.equal('inputTypePasswordWithInlineText');
            });
        });

        describe('wrapped in label', () => {
            it('test exists()', async () => {
                expect(await textBox('inputTypePasswordWithWrappedLabel').exists()).to.be.true;
            });

            it('test value()', async () => {
                await write('inputTypePasswordWithWrappedLabel', into(textBox('inputTypePasswordWithWrappedLabel')));
                expect(await textBox('inputTypePasswordWithWrappedLabel').value()).to.equal('inputTypePasswordWithWrappedLabel');
            });
        });

        describe('using label for', () => {
            it('test exists()', async () => {
                expect(await textBox('inputTypePasswordWithLabelFor').exists()).to.be.true;
            });

            it('test value()', async () => {
                await write('inputTypePasswordWithLabelFor', into(textBox('inputTypePasswordWithLabelFor')));
                expect(await textBox('inputTypePasswordWithLabelFor').value()).to.equal('inputTypePasswordWithLabelFor');
            });
        });

        describe('attribute and value pair', () => {
            it('test exists()', async () => {
                expect(await textBox({id:'inputTypePasswordWithLabelFor'}).exists()).to.be.true;
            });

            it('test value()', async () => {
                expect(await textBox({id:'inputTypePasswordWithLabelFor'}).value()).to.equal('inputTypePasswordWithLabelFor');
            });
        });
    });

    describe('textarea', () => {
        describe('wrapped in label', () => {
            it('test exists()', async () => {
                expect(await textBox('textAreaWithWrappedLabel').exists()).to.be.true;
            });

            it('test value()', async () => {
                await write('textAreaWithWrappedLabel', into(textBox('textAreaWithWrappedLabel')));
                expect(await textBox('textAreaWithWrappedLabel').value()).to.equal('textAreaWithWrappedLabel');
            });
        });

        describe('using label for', () => {
            it('test exists()', async () => {
                expect(await textBox('textAreaWithLabelFor').exists()).to.be.true;
            });

            it('test value()', async () => {
                await write('textAreaWithLabelFor', into(textBox('textAreaWithLabelFor')));
                expect(await textBox('textAreaWithLabelFor').value()).to.equal('textAreaWithLabelFor');
            });
        });

        describe('attribute and value pair', () => {
            it('test exists()', async () => {
                expect(await textBox({id:'textAreaWithLabelFor'}).exists()).to.be.true;
            });

            it('test value()', async () => {
                expect(await textBox({id:'textAreaWithLabelFor'}).value()).to.equal('textAreaWithLabelFor');
            });
        });
    });   
    
    describe('contentEditable', () => {

        describe('wrapped in label', () => {
            it('test exists()', async () => {
                expect(await textBox('contentEditableWithWrappedLabel').exists()).to.be.true;
            });

            it('test value()', async () => {
                await write('contentEditableWithWrappedLabel', into(textBox('contentEditableWithWrappedLabel')));
                expect(await textBox('contentEditableWithWrappedLabel').value()).to.equal('contentEditableWithWrappedLabel');
            });
        });

        describe('using label for', () => {
            it('test exists()', async () => {
                expect(await textBox('contentEditableWithLabelFor').exists()).to.be.true;
            });

            it('test value()', async () => {
                await write('contentEditableWithLabelFor', into(textBox('contentEditableWithLabelFor')));
                expect(await textBox('contentEditableWithLabelFor').value()).to.equal('contentEditableWithLabelFor');
            });
        });

        describe('attribute and value pair', () => {
            it('test exists()', async () => {
                expect(await textBox({id:'contentEditableWithWrappedLabel'}).exists()).to.be.true;
            });

            it('test value()', async () => {
                expect(await textBox({id:'contentEditableWithWrappedLabel'}).value()).to.equal('contentEditableWithWrappedLabel');
            });
        });
    });
});
