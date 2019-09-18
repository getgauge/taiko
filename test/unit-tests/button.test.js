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
      '<button type="button">New <div> button </div></button>' +
      '<input type="button" value="Input Button" />' +
      '<input type="reset" value="Input Reset" />' +
      '<input type="submit" value="Input Submit" />' +
      '</div>' +
      '<div name="button in label">' +
      '<label><input type="button" value="inputButtonInLabel" /><span>InputButtonInLabel</span></label>' +
      '<label><input type="reset" /><span>ResetInLabel</span></label>' +
      '<label><input type="submit" /><span>SubmitInLabel</span></label>' +
      '</div>' +
      '<div name="button in label for">' +
      '<label for="inputButton" >LabelForButton</label> <input type="button" id="inputButton" />' +
      '<label for="inputReset" >LabelForReset</label> <input type="button" id="inputReset" />' +
      '<label for="inputSubmit" >LabelForSubmit</label> <input type="button" id="inputSubmit" />' +
      '</div>';
    filePath = createHtml(innerHtml, test_name);
    await openBrowser(openBrowserArgs);
    await goto(filePath);
    await setConfig({ waitForNavigation: false });
  });
  after(async () => {
    await setConfig({ waitForNavigation: true });
    await closeBrowser();
    removeFile(filePath);
  });
  describe('button test', () => {
    describe('normal button', () => {
      it('button exists()', async () => {
        expect(await button('Click').exists()).to.be.true;
        expect(await button('new button').exists()).to.be.true;
        expect(await button('Input Button').exists()).to.be.true;
        expect(await button('Input Reset').exists()).to.be.true;
        expect(await button('Input Submit').exists()).to.be.true;
      });

      it('button get()', async () => {
        expect( await button('Click').get()).to.have.lengthOf(1);
        expect( await button('new button').get()).to.have.lengthOf(1);
        expect( await button('Input Button').get()).to.have.lengthOf(1);
        expect( await button('Input Reset').get()).to.have.lengthOf(1);
        expect( await button('Input Submit').get()).to.have.lengthOf(1);
      });

      it('button description', async () => {
        expect(await button('Click').description).to.be.eql("Button with label Click ");
        expect(await button('Input Button').description).to.be.eql("Button with label Input Button ");
        expect(await button('Input Reset').description).to.be.eql("Button with label Input Reset ");
        expect(await button('Input Submit').description).to.be.eql("Button with label Input Submit ");
      });

      it('button text()', async () => {
        expect((await button('Click').text())[0]).to.be.eql('Click');
        expect((await button('new button').text())[0]).to.be.eql('New\nbutton');
        expect((await button('Input Button').text())[0]).to.be.eql("Input Button");
        expect((await button('Input Reset').text())[0]).to.be.eql("Input Reset");
        expect((await button('Input Submit').text())[0]).to.be.eql("Input Submit");
      });
    });

    describe('button with label', () => {
      it('exists with label()', async () => {
        expect(await button('InputButtonInLabel').exists()).to.be.true;
        expect(await button('ResetInLabel').exists()).to.be.true;
        expect(await button('SubmitInLabel').exists()).to.be.true;
      });

      it('get with label()', async () => {
        expect(await button('InputButtonInLabel').get()).to.have.lengthOf(1);
        expect(await button('ResetInLabel').get()).to.have.lengthOf(1);
        expect(await button('SubmitInLabel').get()).to.have.lengthOf(1);
      });

      it('button description', async () => {
        expect(button('InputButtonInLabel').description).to.be.eql("Button with label InputButtonInLabel ");
        expect(button('ResetInLabel').description).to.be.eql("Button with label ResetInLabel ");
        expect(button('SubmitInLabel').description).to.be.eql("Button with label SubmitInLabel ");
      });

      it('text with label()', async () => {
        expect((await button('InputButtonInLabel').text())[0]).to.be.eql("inputButtonInLabel");
        expect((await button('ResetInLabel').text())[0]).to.be.eql("");
        expect((await button('SubmitInLabel').text())[0]).to.be.eql("");
      });
    });

    describe('button with label for', () => {
      it('test exists with label for()', async () => {
        expect(await button('LabelForButton').exists()).to.be.true;
        expect(await button('LabelForReset').exists()).to.be.true;
        expect(await button('LabelForSubmit').exists()).to.be.true;
      });
      
      it('test get with label for()', async () => {
        expect(await button('LabelForButton').get()).to.have.lengthOf(1);
        expect(await button('LabelForReset').get()).to.have.lengthOf(1);
        expect(await button('LabelForSubmit').get()).to.have.lengthOf(1);
      });

      it('button description', async () => {
        expect(button('LabelForButton').description).to.be.eql("Button with label LabelForButton ");
        expect(button('LabelForReset').description).to.be.eql("Button with label LabelForReset ");
        expect(button('LabelForSubmit').description).to.be.eql("Button with label LabelForSubmit ");
      });

      it('test text with label for()', async () => {
        expect((await button('LabelForButton').text())[0]).to.be.eql('');
        expect((await button('LabelForReset').text())[0]).to.be.eql('');
        expect((await button('LabelForSubmit').text())[0]).to.be.eql('');
      });
    });

    describe('button with contains match', () => {
      it('should match button with partial text', async () => {
        expect(await button('ForButton').exists()).to.be.true;
        expect(await button('ForReset').exists()).to.be.true;
        expect(await button('ForSubmit').exists()).to.be.true;
      });
    });
  });
});
