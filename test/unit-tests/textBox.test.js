const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
let { openBrowser, goto, textBox, closeBrowser, write, into, setConfig} = require('../../lib/taiko');
let { createHtml, removeFile, openBrowserArgs } = require('./test-util');
const test_name = 'textBox';

describe(test_name, () => {
    before(async () => {
        await openBrowser(openBrowserArgs);
        await setConfig({waitForNavigation:false});
    });

    after(async () => {
        await setConfig({waitForNavigation:true});
        await closeBrowser();
    });

    describe('textarea', () => {
        let filePath;
        before(async () => {
            let innerHtml = '<div>' +
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
            '</div>';
            filePath = createHtml(innerHtml, test_name);
            await goto(filePath);
        });

        after(() => {
            removeFile(filePath);
        });

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
        let filePath;
        before(async () => {
            let innerHtml = '<div>' +
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
            await goto(filePath);
        });

        after(() => {
            removeFile(filePath);
        });

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
    describe('input with type text readonly', () => {
        let filePath;
        before(async () => {
            let innerHtml = '<div>' +
            //Read only input with type text
            '<form name="inputTypeText">' +
                '<div name="inputTypeTextWithInlineTextReadonly">' +
                    '<input type="text" readonly>inputTypeTextWithInlineTextReadonly</input>' +
                '</div>' +
                '<div name="inputTypeTextWithWrappedLabelReadonly">' +
                    '<label>' +
                        '<input type="text" readonly/>' +
                        '<span>inputTypeTextWithWrappedLabelReadonly</span>' +
                    '</label>' +
                '</div>' +
                '<div name="inputTypeTextWithLabelForReadonly">' +
                    '<input id="inputTypeTextWithLabelForReadonly" type="text" readonly/>' +
                    '<label for="inputTypeTextWithLabelForReadonly">inputTypeTextWithLabelForReadonly</label>' +
                '</div>' +
            '</form>';
            '</div>';
            filePath = createHtml(innerHtml, test_name);
            await goto(filePath);
        });

        after(() => {
            removeFile(filePath);
        });

        describe('with inline text', () => {
            it('test exists()', async () => {
                expect(await textBox('inputTypeTextWithInlineTextReadonly').exists()).to.be.true;
            });

            it('test value()', async () => {
                await expect(write('inputTypeTextWithInlineText', into(textBox('inputTypeTextWithInlineTextReadonly')))).to.eventually.be.rejected;
            });
        });

        describe('wrapped in label', () => {
            it('test exists()', async () => {
                expect(await textBox('inputTypeTextWithWrappedLabelReadonly').exists()).to.be.true;
            });

            it('test value()', async () => {
                await expect(write('inputTypeTextWithWrappedLabel', into(textBox('inputTypeTextWithWrappedLabelReadonly')))).to.eventually.be.rejected;
            });
        });

        describe('using label for', () => {
            it('test exists()', async () => {
                expect(await textBox('inputTypeTextWithLabelForReadonly').exists()).to.be.true;
            });

            it('test value()', async () => {
                await expect(write('inputTypeTextWithLabelFor', into(textBox('inputTypeTextWithLabelForReadonly')))).to.be.eventually.rejected;
            });
        });

        describe('attribute and value pair', () => {
            it('test exists()', async () => {
                expect(await textBox({id:'inputTypeTextWithLabelForReadonly'}).exists()).to.be.true;
            });

            it('test value()', async () => {
                expect(await textBox({id:'inputTypeTextWithLabelForReadonly'}).value()).to.equal('');
            });
        });
    });

    var inputTypes = [{type: 'text', name: 'inputType-text', testValue: 'text input type entered'},
        {type: 'password', name: 'inputType-password', testValue: 'password input type entered'},
        {type: 'search', name: 'inputType-search', testValue: 'search input type entered'},
        {type: 'number', name: 'inputType-number', testValue: '10'},
        {type: 'email', name: 'inputType-email', testValue: 'email@test.com'},
        {type: 'tel', name: 'inputType-tel', testValue: '01-111-111-111'},
        {type: 'url', name: 'inputType-url', testValue: 'https://test.com'}];
    inputTypes.forEach((inputType) => {
        describe('input with type ' + inputType.type, () => {
            let filePath;
            before(async () => {
                let innerHtml = '<div>' +
                    //Input with type text
                    `<form name="${inputType.name}">` +
                        '<div name="withInlineText">' +
                            `<input type="${inputType.type}">With Inline Text</input>` +
                        '</div>' +
                        '<div name="withWrappedLabel">' +
                            '<label>' +
                                `<input type="${inputType.type}"/>` +
                                '<span>With Wrapped Label</span>' +
                            '</label>' +
                        '</div>' +
                        '<div name="withLabelFor">' +
                                `<input id="${inputType.name}WithLabelFor" type="${inputType.type}"/>` +
                                `<label for="${inputType.name}WithLabelFor">With Label For</label>` +
                        '</div>' +
                    '</form>' +
                '</div>';
                filePath = createHtml(innerHtml, test_name + inputType.type);
                await goto(filePath);
            });

            after(() => {
                removeFile(filePath);
            });

            describe('with inline text', () => {
                it('test exists()', async () => {
                    expect(await textBox('With Inline Text').exists()).to.be.true;
                });

                it('test value()', async () => {
                    await write(inputType.testValue, into(textBox('With Inline Text')));
                    expect(await textBox('With Inline Text').value()).to.equal(inputType.testValue);
                });
            });

            describe('wrapped in label', () => {
                it('test exists()', async () => {
                    expect(await textBox('With Wrapped Label').exists()).to.be.true;
                });

                it('test value()', async () => {
                    await write(inputType.testValue, into(textBox('With Wrapped Label')));
                    expect(await textBox('With Wrapped Label').value()).to.equal(inputType.testValue);
                });
            });

            describe('using label for', () => {
                it('test exists()', async () => {
                    expect(await textBox('With Label For').exists()).to.be.true;
                });

                it('test value()', async () => {
                    await write(inputType.testValue, into(textBox('With Label For')));
                    expect(await textBox('With Label For').value()).to.equal(inputType.testValue);
                });
            });

            describe('attribute and value pair', () => {
                it('test exists()', async () => {
                    expect(await textBox({id:inputType.name + 'WithLabelFor'}).exists()).to.be.true;
                });

                it('test value()', async () => {
                    expect(await textBox({id:inputType.name + 'WithLabelFor'}).value()).to.equal(inputType.testValue);
                });
            });
        });
    });
});
