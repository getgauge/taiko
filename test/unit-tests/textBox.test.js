const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
let {
  openBrowser,
  goto,
  textBox,
  closeBrowser,
  write,
  into,
  setConfig,
  above,
} = require('../../lib/taiko');
let { createHtml, removeFile, openBrowserArgs, resetConfig } = require('./test-util');
const test_name = 'textBox';

describe(test_name, () => {
  before(async () => {
    await openBrowser(openBrowserArgs);
  });

  after(async () => {
    await closeBrowser();
  });

  describe('textarea', () => {
    let filePath;
    before(async () => {
      let innerHtml =
        '<div>' +
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
        '<div name="sampleTextArea">' +
        '<label for="sampleTextArea">sampleTextArea</label>' +
        '<textarea id="sampleTextArea">someValue</textarea>' +
        '<textarea id="hiddenTextAreaStyle" style="display:none;">someValue</textarea>' +
        '</div>' +
        '</form>' +
        '</div>';
      filePath = createHtml(innerHtml, test_name);
      await goto(filePath);
      setConfig({
        waitForNavigation: false,
        retryTimeout: 100,
        retryInterval: 10,
      });
    });

    after(() => {
      resetConfig();
      removeFile(filePath);
    });

    describe('wrapped in label', () => {
      it('test exists()', async () => {
        expect(await textBox('textAreaWithWrappedLabel').exists()).to.be.true;
      });

      it('test value()', async () => {
        await write('textAreaWithWrappedLabel', into(textBox('textAreaWithWrappedLabel')));
        expect(await textBox('textAreaWithWrappedLabel').value()).to.equal(
          'textAreaWithWrappedLabel',
        );
      });

      it('test description', async () => {
        expect(textBox('textAreaWithWrappedLabel').description).to.be.eql(
          'Text field with label textAreaWithWrappedLabel ',
        );
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

      it('test description', async () => {
        expect(textBox('textAreaWithLabelFor').description).to.be.eql(
          'Text field with label textAreaWithLabelFor ',
        );
      });
    });

    describe('attribute and value pair', () => {
      it('test exists()', async () => {
        expect(await textBox({ id: 'textAreaWithLabelFor' }).exists()).to.be.true;
      });

      it('test value()', async () => {
        expect(await textBox({ id: 'textAreaWithLabelFor' }).value()).to.equal(
          'textAreaWithLabelFor',
        );
      });

      it('test description', async () => {
        expect(textBox({ id: 'textAreaWithLabelFor' }).description).to.be.eql(
          'Text field[@id = concat(\'textAreaWithLabelFor\', "")]',
        );
      });
    });

    describe('with relative selector', () => {
      it('test exists()', async () => {
        expect(await textBox(above('textAreaWithLabelFor')).exists()).to.be.true;
      });

      it('test value()', async () => {
        expect(await textBox(above('textAreaWithLabelFor')).value()).to.equal(
          'textAreaWithWrappedLabel',
        );
      });

      it('test value() should throw if the element is not found', async () => {
        await expect(textBox('foo').value()).to.be.eventually.rejected;
      });

      it('test description', async () => {
        expect(textBox(above('textAreaWithLabelFor')).description).to.be.eql(
          'Text field Above textAreaWithLabelFor',
        );
      });
    });

    describe('test elementsList properties', () => {
      it('test get of elements', async () => {
        const elements = await textBox({
          id: 'sampleTextArea',
        }).elements();
        expect(elements[0].get())
          .to.be.a('number')
          .above(0);
      });

      it('test description of elements', async () => {
        let elements = await textBox({
          id: 'sampleTextArea',
        }).elements();
        expect(elements[0].description).to.be.eql(
          'Text field[@id = concat(\'sampleTextArea\', "")]',
        );
      });

      it('test value of elements', async () => {
        let elements = await textBox({
          id: 'sampleTextArea',
        }).elements();
        expect(await elements[0].value()).to.be.eql('someValue');
      });

      it('should return true for non hidden element when isVisible fn is called on button', async () => {
        expect(await textBox('sampleTextArea').isVisible()).to.be.true;
      });

      // Should run after fix811
      it.skip('should return false for hidden element when isVisible fn is called on textBox', async () => {
        expect(
          await textBox({ id: 'hiddenTextAreaStyle' }, { selectHiddenElement: true }).isVisible(),
        ).to.be.false;
      });
    });
  });

  describe('contentEditable', () => {
    let filePath;
    before(async () => {
      let innerHtml =
        '<div>' +
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
        '<div id="sampleContentEditable" contenteditable=true>contentEditableValue</div>' +
        '</div>' +
        '</form>' +
        '</div>';
      filePath = createHtml(innerHtml, test_name);
      await goto(filePath);
      setConfig({
        waitForNavigation: false,
        retryTimeout: 100,
        retryInterval: 10,
      });
    });

    after(() => {
      resetConfig();
      removeFile(filePath);
    });

    describe('wrapped in label', () => {
      it('test exists()', async () => {
        expect(await textBox('contentEditableWithWrappedLabel').exists()).to.be.true;
      });

      it('test value()', async () => {
        await write(
          'contentEditableWithWrappedLabel',
          into(textBox('contentEditableWithWrappedLabel')),
        );
        expect(await textBox('contentEditableWithWrappedLabel').value()).to.equal(
          'contentEditableWithWrappedLabel',
        );
      });

      it('test description', async () => {
        expect(textBox('contentEditableWithWrappedLabel').description).to.be.eql(
          'Text field with label contentEditableWithWrappedLabel ',
        );
      });
    });

    describe('using label for', () => {
      it('test exists()', async () => {
        expect(await textBox('contentEditableWithLabelFor').exists()).to.be.true;
      });

      it('test value()', async () => {
        await write('contentEditableWithLabelFor', into(textBox('contentEditableWithLabelFor')));
        expect(await textBox('contentEditableWithLabelFor').value()).to.equal(
          'contentEditableWithLabelFor',
        );
      });

      it('test description', async () => {
        expect(textBox('contentEditableWithLabelFor').description).to.be.eql(
          'Text field with label contentEditableWithLabelFor ',
        );
      });
    });

    describe('attribute and value pair', () => {
      it('test exists()', async () => {
        expect(
          await textBox({
            id: 'contentEditableWithWrappedLabel',
          }).exists(),
        ).to.be.true;
      });

      it('test value()', async () => {
        expect(
          await textBox({
            id: 'contentEditableWithWrappedLabel',
          }).value(),
        ).to.equal('contentEditableWithWrappedLabel');
      });

      it('test description', async () => {
        expect(
          textBox({
            id: 'contentEditableWithWrappedLabel',
          }).description,
        ).to.be.eql('Text field[@id = concat(\'contentEditableWithWrappedLabel\', "")]');
      });
    });

    describe('with relative selector', () => {
      it('test exists()', async () => {
        expect(await textBox(above('contentEditableWithLabelFor')).exists()).to.be.true;
      });

      it('test value()', async () => {
        expect(await textBox(above('contentEditableWithLabelFor')).value()).to.equal(
          'contentEditableWithWrappedLabel',
        );
      });

      it('test description', async () => {
        expect(textBox(above('contentEditableWithLabelFor')).description).to.be.eql(
          'Text field Above contentEditableWithLabelFor',
        );
      });
    });

    describe('test elementsList properties', () => {
      it('test get of elements', async () => {
        const elements = await textBox({
          id: 'sampleContentEditable',
        }).elements();
        expect(elements[0].get())
          .to.be.a('number')
          .above(0);
      });

      it('test isVisible of elements', async () => {
        const elements = await textBox({
          id: 'sampleContentEditable',
        }).elements();
        expect(await elements[0].isVisible()).to.be.true;
      });

      it('test description of elements', async () => {
        let elements = await textBox({
          id: 'sampleContentEditable',
        }).elements();
        expect(elements[0].description).to.be.eql(
          'Text field[@id = concat(\'sampleContentEditable\', "")]',
        );
      });

      it('test value of elements', async () => {
        let elements = await textBox({
          id: 'sampleContentEditable',
        }).elements();
        expect(await elements[0].value()).to.be.eql('contentEditableValue');
      });
    });
  });

  var inputTypes = [
    {
      type: 'text',
      name: 'inputType-text',
      testValue: 'text input type entered',
    },
    {
      type: 'password',
      name: 'inputType-password',
      testValue: 'password input type entered',
    },
    {
      type: 'search',
      name: 'inputType-search',
      testValue: 'search input type entered',
    },
    { type: 'number', name: 'inputType-number', testValue: '10' },
    {
      type: 'email',
      name: 'inputType-email',
      testValue: 'email@test.com',
    },
    {
      type: 'tel',
      name: 'inputType-tel',
      testValue: '01-111-111-111',
    },
    {
      type: 'url',
      name: 'inputType-url',
      testValue: 'https://test.com',
    },
  ];
  inputTypes.forEach(inputType => {
    describe('input with type ' + inputType.type, () => {
      let filePath;
      before(async () => {
        let innerHtml = `
                <div>
                    <form name="${inputType.name}">
                        <div name="withInlineText">
                            <input type="${inputType.type}">With Inline Text</input>
                        </div>
                        <div name="withWrappedLabel">
                            <label>
                                <input type="${inputType.type}"/>
                                <span>With Wrapped Label</span>
                            </label>
                        </div>
                        <div name="withLabelFor">
                            <label for="${inputType.name}WithLabelFor">With Label For</label>
                            <input id="${inputType.name}WithLabelFor" type="${inputType.type}"/>
                        </div>
                        <div>
                            <input type="${inputType.type}" id="sample${inputType.type}" value="${inputType.testValue}">With Inline Text</input>
                        </div>
                    </form>
                </div>`;
        filePath = createHtml(innerHtml, test_name + inputType.type);
        await goto(filePath);
        setConfig({
          waitForNavigation: false,
          retryTimeout: 100,
          retryInterval: 10,
        });
      });

      after(() => {
        resetConfig();
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

        it('test description', async () => {
          expect(textBox('With Inline Text').description).to.be.eql(
            'Text field with label With Inline Text ',
          );
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

        it('test description', async () => {
          expect(textBox('With Wrapped Label').description).to.be.eql(
            'Text field with label With Wrapped Label ',
          );
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

        it('test description', async () => {
          expect(textBox('With Label For').description).to.be.eql(
            'Text field with label With Label For ',
          );
        });
      });

      describe('attribute and value pair', () => {
        it('test exists()', async () => {
          expect(
            await textBox({
              id: inputType.name + 'WithLabelFor',
            }).exists(),
          ).to.be.true;
        });

        it('test value()', async () => {
          expect(
            await textBox({
              id: inputType.name + 'WithLabelFor',
            }).value(),
          ).to.equal(inputType.testValue);
        });

        it('test description', async () => {
          expect(
            textBox({
              id: inputType.name + 'WithLabelFor',
            }).description,
          ).to.be.eql(`Text field[@id = concat('inputType-${inputType.type}WithLabelFor', "")]`);
        });
      });

      describe('with relative selector', () => {
        it('test exists()', async () => {
          expect(await textBox(above('With Label For')).exists()).to.be.true;
        });

        it('test value()', async () => {
          expect(await textBox(above('With Label For')).value()).to.equal(inputType.testValue);
        });

        it('test description', async () => {
          expect(textBox(above('With Label For')).description).to.be.eql(
            'Text field Above With Label For',
          );
        });
      });

      describe('test elementsList properties', () => {
        it('test get of elements', async () => {
          const elements = await textBox({
            id: `sample${inputType.type}`,
          }).elements();
          expect(elements[0].get())
            .to.be.a('number')
            .above(0);
        });

        it('test description of elements', async () => {
          let elements = await textBox({
            id: `sample${inputType.type}`,
          }).elements();
          expect(elements[0].description).to.be.eql(
            `Text field[@id = concat('sample${inputType.type}', "")]`,
          );
        });

        it('test value of elements', async () => {
          let elements = await textBox({
            id: `sample${inputType.type}`,
          }).elements();
          expect(await elements[0].value()).to.be.eql(`${inputType.testValue}`);
        });
      });
    });
  });

  describe('input without type ', () => {
    let filePath;
    const inputTypeName = 'input-without-type';
    const inputValue = 'text input type entered';
    const value = 'inputWithoutTypeValue';
    before(async () => {
      let innerHtml = `
            <div>
                <form name="${inputTypeName}">
                    <div name="withInlineText">
                        <input >With Inline Text</input>
                    </div>
                    <div name="withWrappedLabel">
                        <label>
                            <input />
                            <span>With Wrapped Label</span>
                        </label>
                    </div>
                    <div name="withLabelFor">
                        <label for="${inputTypeName}WithLabelFor">With Label For</label>
                        <input id="${inputTypeName}WithLabelFor"/>
                    </div>
                    <div >
                        <input value="${value}">sampleInputWithoutType</input>
                    </div>
                </form>
            </div>`;
      filePath = createHtml(innerHtml, test_name + inputTypeName);
      await goto(filePath);
      setConfig({
        waitForNavigation: false,
        retryTimeout: 100,
        retryInterval: 10,
      });
    });

    after(() => {
      resetConfig();
      removeFile(filePath);
    });

    describe('with inline text', () => {
      it('test exists()', async () => {
        expect(await textBox('With Inline Text').exists()).to.be.true;
      });

      it('test value()', async () => {
        await write(inputValue, into(textBox('With Inline Text')));
        expect(await textBox('With Inline Text').value()).to.equal(inputValue);
      });

      it('test description', async () => {
        expect(textBox('With Inline Text').description).to.be.eql(
          'Text field with label With Inline Text ',
        );
      });
    });

    describe('wrapped in label', () => {
      it('test exists()', async () => {
        expect(await textBox('With Wrapped Label').exists()).to.be.true;
      });

      it('test value()', async () => {
        await write(inputValue, into(textBox('With Wrapped Label')));
        expect(await textBox('With Wrapped Label').value()).to.equal(inputValue);
      });

      it('test description', async () => {
        expect(textBox('With Wrapped Label').description).to.be.eql(
          'Text field with label With Wrapped Label ',
        );
      });
    });

    describe('using label for', () => {
      it('test exists()', async () => {
        expect(await textBox('With Label For').exists()).to.be.true;
      });

      it('test value()', async () => {
        await write(inputValue, into(textBox('With Label For')));
        expect(await textBox('With Label For').value()).to.equal(inputValue);
      });

      it('test description', async () => {
        expect(textBox('With Label For').description).to.be.eql(
          'Text field with label With Label For ',
        );
      });
    });

    describe('attribute and value pair', () => {
      it('test exists()', async () => {
        expect(
          await textBox({
            id: inputTypeName + 'WithLabelFor',
          }).exists(),
        ).to.be.true;
      });

      it('test value()', async () => {
        expect(
          await textBox({
            id: inputTypeName + 'WithLabelFor',
          }).value(),
        ).to.equal(inputValue);
      });

      it('test description', async () => {
        expect(
          textBox({
            id: inputTypeName + 'WithLabelFor',
          }).description,
        ).to.be.eql('Text field[@id = concat(\'input-without-typeWithLabelFor\', "")]');
      });
    });

    describe('with relative selector', () => {
      it('test exists()', async () => {
        expect(await textBox(above('With Label For')).exists()).to.be.true;
      });

      it('test value()', async () => {
        expect(await textBox(above('With Label For')).value()).to.equal(inputValue);
      });

      it('test description', async () => {
        expect(textBox(above('With Label For')).description).to.be.eql(
          'Text field Above With Label For',
        );
      });

      it('test text should throw if the element is not found', async () => {
        await expect(textBox('.foo').text()).to.be.eventually.rejected;
      });
    });

    describe('test elementList properties', () => {
      it('test get of elements', async () => {
        const elements = await textBox('sampleInputWithoutType').elements();
        expect(elements[0].get())
          .to.be.a('number')
          .above(0);
      });

      it('test description of elements', async () => {
        let elements = await textBox('sampleInputWithoutType').elements();
        expect(elements[0].description).to.be.eql('Text field with label sampleInputWithoutType ');
      });

      it('test value of elements', async () => {
        let elements = await textBox('sampleInputWithoutType').elements();
        expect(await elements[0].value()).to.be.eql('inputWithoutTypeValue');
      });
    });
  });
});
