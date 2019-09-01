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
      '<button type="button" disabled>ClickDisabled</button>' +
      '<input type="button" value="Input Button" />' +
      '<input type="button" value="Input Button disabled" disabled/>' +
      '<input type="reset" value="Input Reset" />' +
      '<input type="reset" value="Input Reset disabled" disabled/>' +
      '<input type="submit" value="Input Submit" />' +
      '<input type="submit" value="Input Submit disabled" disabled/>' +
      '</div>' +
      '<div name="button in label">' +
      '<label><input type="button" value="inputButtonInLabel" disabled/><span>InputButtonInLabelDisabled</span></label>' +
      '<label><input type="button" value="inputButtonInLabel"/><span>InputButtonInLabel</span></label>' +
      '<label><input type="reset" disabled/><span>ResetInLabelDisabled</span></label>' +
      '<label><input type="reset"/><span>ResetInLabel</span></label>' +
      '<label><input type="submit" disabled/><span>SubmitInLabelDisabled</span></label>' +
      '<label><input type="submit"/><span>SubmitInLabel</span></label>' +
      '</div>' +
      '<div name="button in label for">' +
      '<label for="inputButton" >LabelForButton</label> <input type="button" id="inputButton" />' +
      '<label for="inputButton" >LabelForButtonDisabled</label> <input type="button" id="inputButton" disabled/>' +
      '<label for="inputReset" >LabelForReset</label> <input type="button" id="inputReset" />' +
      '<label for="inputReset" >LabelForResetDisabled</label> <input type="button" id="inputReset" disabled/>' +
      '<label for="inputSubmit" >LabelForSubmit</label> <input type="button" id="inputSubmit" />' +
      '<label for="inputSubmit" >LabelForSubmitDisabled</label> <input type="button" id="inputSubmit" disabled/>' +
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
    describe('exists()', () => {
      it('button exists()', async () => {
        expect(await button('Click').exists()).to.be.true;
        expect(await button('Input Button').exists()).to.be.true;
        expect(await button('Input Reset').exists()).to.be.true;
        expect(await button('Input Submit').exists()).to.be.true;
      });

      it('button isDisabled()', async () => {
        expect(await button('ClickDisabled').isDisabled()).to.be
          .true;
        expect(await button('Input Button disabled').isDisabled()).to
          .be.true;
        expect(await button('Input Reset disabled').isDisabled()).to
          .be.true;
        expect(await button('Input Submit disabled').isDisabled()).to
          .be.true;
      });
    });

    describe('exists with label', () => {
      it('test exists with label()', async () => {
        expect(await button('InputButtonInLabel').exists()).to.be
          .true;
        expect(await button('ResetInLabel').exists()).to.be.true;
        expect(await button('SubmitInLabel').exists()).to.be.true;
      });

      it('test isDisabled with label()', async () => {
        expect(
          await button('InputButtonInLabelDisabled').isDisabled(),
        ).to.be.true;
        expect(await button('ResetInLabelDisabled').isDisabled()).to
          .be.true;
        expect(await button('SubmitInLabelDisabled').isDisabled()).to
          .be.true;
      });
    });

    describe('exists with label for', () => {
      it('test exists with label for()', async () => {
        expect(await button('LabelForButton').exists()).to.be.true;
        expect(await button('LabelForReset').exists()).to.be.true;
        expect(await button('LabelForSubmit').exists()).to.be.true;
      });

      it('test isDisabled with label for()', async () => {
        expect(await button('LabelForButtonDisabled').isDisabled()).to.be.true;
        expect(await button('LabelForResetDisabled').isDisabled()).to.be.true;
        expect(await button('LabelForSubmitDisabled').isDisabled()).to.be.true;
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
