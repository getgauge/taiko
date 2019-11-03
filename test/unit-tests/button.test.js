const expect = require('chai').expect;
let {
  openBrowser,
  goto,
  closeBrowser,
  button,
  setConfig,
} = require('../../lib/taiko');
let {
  createHtml,
  removeFile,
  openBrowserArgs,
} = require('./test-util');
const test_name = 'button';

describe(test_name, () => {
  let filePath;
  before(async () => {
    let innerHtml =
      '<div name="inline button text">' +
      '<button type="button">Click</button>' +
      '<input type="button" value="Input Button" />' +
      '<input type="reset" value="Input Reset" />' +
      '<input type="submit" value="Input Submit" />' +
      '<input type="image" value="Input Image" />' +
      '</div>' +
      '<div name="button in label">' +
      '<label><input type="button" value="inputButtonInLabel" /><span>InputButtonInLabel</span></label>' +
      '<label><input type="reset" /><span>ResetInLabel</span></label>' +
      '<label><input type="submit" /><span>SubmitInLabel</span></label>' +
      '<label><input type="image" /><span>ImageInLabel</span></label>' +
      '</div>' +
      '<div name="button in label for">' +
      '<label for="inputButton" >LabelForButton</label> <input type="button" id="inputButton" />' +
      '<label for="inputReset" >LabelForReset</label> <input type="reset" id="inputReset" />' +
      '<label for="inputSubmit" >LabelForSubmit</label> <input type="submit" id="inputSubmit" />' +
      '<label for="inputImage" >LabelForImage</label> <input type="image" id="inputImage" />' +
      '</div>' +
      //button tag with wrapped elements
      '<button><span> spanButton </span></button>' +
      '<button><strong>strongButton</strong></button>' +
      '<button><i>italicButton</i></button>' +
      '<button><b>boldButton</b>></button>' +
      '<button>' +
      '<div>childElementButton</div>' +
      '</button>';

    filePath = createHtml(innerHtml, test_name);
    await openBrowser(openBrowserArgs);
    await goto(filePath);
    setConfig({ waitForNavigation: false });
  });
  after(async () => {
    setConfig({ waitForNavigation: true });
    await closeBrowser();
    removeFile(filePath);
  });
  describe('button test', () => {
    describe('normal button', () => {
      it('button exists()', async () => {
        expect(await button('Click').exists()).to.be.true;
        expect(await button('Input Button').exists()).to.be.true;
        expect(await button('Input Reset').exists()).to.be.true;
        expect(await button('Input Submit').exists()).to.be.true;
        expect(await button('Input Image').exists()).to.be.true;
      });

      xit('button get()', async () => {
        expect(
          await (await button('Click').get())[0].text(),
        ).to.be.eql('Click');
        expect(
          await (await button('Input Button').get())[0].text(),
        ).to.be.eql('Input Button');
        expect(
          await (await button('Input Reset').get())[0].text(),
        ).to.be.eql('Input Reset');
        expect(
          await (await button('Input Submit').get())[0].text(),
        ).to.be.eql('Input Submit');
        expect(
          await (await button('Input Image').get())[0].text(),
        ).to.be.eql('Input Image');
      }); // Todo: should be fixed with #815

      it('button description', async () => {
        expect(button('Click').description).to.be.eql(
          'Button with label Click ',
        );
        expect(button('Input Button').description).to.be.eql(
          'Button with label Input Button ',
        );
        expect(button('Input Reset').description).to.be.eql(
          'Button with label Input Reset ',
        );
        expect(button('Input Submit').description).to.be.eql(
          'Button with label Input Submit ',
        );
        expect(button('Input Image').description).to.be.eql(
          'Button with label Input Image ',
        );
      });

      xit('button text()', async () => {
        expect(await button('Click').text()).to.be.eql('Click');
        expect(await button('Input Button').text()).to.be.eql(
          'Input Button',
        );
        expect(await button('Input Reset').text()).to.be.eql(
          'Input Reset',
        );
        expect(await button('Input Submit').text()).to.be.eql(
          'Input Submit',
        );
        expect(await button('Input Image').text()).to.be.eql(
          'Input Image',
        );
      }); // Todo: should be fixed with #815
    });
    describe('button with label', () => {
      it('exists with label()', async () => {
        expect(await button('InputButtonInLabel').exists()).to.be
          .true;
        expect(await button('ResetInLabel').exists()).to.be.true;
        expect(await button('SubmitInLabel').exists()).to.be.true;
        expect(await button('ImageInLabel').exists()).to.be.true;
      });

      xit('get with label()', async () => {
        expect(
          await (await button('InputButtonInLabel').get())[0].text(),
        ).to.be.eql('inputButtonInLabel');
        expect(
          await (await button('ResetInLabel').get())[0].text(),
        ).to.be.eql('resetInLabel');
        expect(
          await (await button('SubmitInLabel').get())[0].text(),
        ).to.be.eql('submitInLabel');
        expect(
          await (await button('ImageInLabel').get())[0].text(),
        ).to.be.eql('imageInLabel');
      }); // Todo: should be fixed with #815

      it('button description', async () => {
        expect(button('InputButtonInLabel').description).to.be.eql(
          'Button with label InputButtonInLabel ',
        );
        expect(button('ResetInLabel').description).to.be.eql(
          'Button with label ResetInLabel ',
        );
        expect(button('SubmitInLabel').description).to.be.eql(
          'Button with label SubmitInLabel ',
        );
        expect(button('ImageInLabel').description).to.be.eql(
          'Button with label ImageInLabel ',
        );
      });

      xit('text with label()', async () => {
        expect(await button('InputButtonInLabel').text()).to.be.eql(
          'inputButtonInLabel',
        );
        expect(await button('ResetInLabel').text()).to.be.eql(
          'resetInLabel',
        );
        expect(await button('SubmitInLabel').text()).to.be.eql(
          'submitInLabel',
        );
        expect(await button('ImageInLabel').text()).to.be.eql(
          'imageInLabel',
        );
      }); // Todo: should be fixed with #815
    });
    describe('button with label for', () => {
      it('test exists with label for()', async () => {
        expect(await button('LabelForButton').exists()).to.be.true;
        expect(await button('LabelForReset').exists()).to.be.true;
        expect(await button('LabelForSubmit').exists()).to.be.true;
        expect(await button('LabelForImage').exists()).to.be.true;
      });

      xit('test get with label for()', async () => {
        expect(
          await (await button('LabelForButton').get())[0].text(),
        ).to.be.eql('LabelForButton');
        expect(
          await (await button('LabelForReset').get())[0].text(),
        ).to.be.eql('LabelForButton');
        expect(
          await (await button('LabelForSubmit').get())[0].text(),
        ).to.be.eql('LabelForButton');
        expect(
          await (await button('LabelForImage').get())[0].text(),
        ).to.be.eql('LabelForButton');
      }); // Todo: should be fixed with #815

      it('button description', async () => {
        expect(button('LabelForButton').description).to.be.eql(
          'Button with label LabelForButton ',
        );
        expect(button('LabelForReset').description).to.be.eql(
          'Button with label LabelForReset ',
        );
        expect(button('LabelForSubmit').description).to.be.eql(
          'Button with label LabelForSubmit ',
        );
        expect(button('LabelForImage').description).to.be.eql(
          'Button with label LabelForImage ',
        );
      });

      xit('test text with label for()', async () => {
        expect(await button('LabelForButton').text()).to.be.eql(
          'LabelForButton',
        );
        expect(await button('LabelForReset').text()).to.be.eql(
          'LabelForButton',
        );
        expect(await button('LabelForSubmit').text()).to.be.eql(
          'LabelForButton',
        );
        expect(await button('LabelForImage').text()).to.be.eql(
          'LabelForImage',
        );
      }); // Todo: should be fixed with #815
    });

    describe('button with contains match', () => {
      it('should match button with partial text', async () => {
        expect(await button('ForButton').exists()).to.be.true;
        expect(await button('ForReset').exists()).to.be.true;
        expect(await button('ForSubmit').exists()).to.be.true;
        expect(await button('ForImage').exists()).to.be.true;
      });
    });

    describe('button with wrapped element text', () => {
      it('should match button with child element text', async () => {
        expect(await button('spanButton').exists()).to.be.true;
        expect(await button('boldButton').exists()).to.be.true;
        expect(await button('italicButton').exists()).to.be.true;
        expect(await button('strongButton').exists()).to.be.true;
        expect(await button('childElementButton').exists()).to.be
          .true;
      });
    });
  });
});
