const expect = require('chai').expect;
let {
  openBrowser,
  goto,
  fileField,
  closeBrowser,
  above,
  button,
  attach,
  setConfig,
} = require('../../lib/taiko');
let {
  createHtml,
  removeFile,
  openBrowserArgs,
} = require('./test-util');
const path = require('path');
const test_name = 'fileField';

describe(test_name, () => {
  let filePath;
  before(async () => {
    let innerHtml = `
        <form name="upload file">
            <div>
                <input id="file-upload" type="file" name="file">
                </br>
                <input class="button" id="file-submit" type="submit" value="Upload" />
            </div>
            <div>
                <label>
                    <input id="file-upload" type="file" name="file">
                    <span>Select a file</span>
                    <input class="button" id="file-submit" type="submit" value="Upload" />
                </label>
            </div>
            <div>
                <label for="file-upload">Choose a file</label>
                <input id="file-upload" type="file" name="file">
                <input class="button" id="file-submit" type="submit" value="Upload" />
            </div>
            <div>
                <label>Choose a file</label>
                <input id='hidden-file-upload' type='file' style="display:none">
            </div>
        </form>`;
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
  describe('file field with type text', () => {
    describe('with inline text', () => {
      it('test exists()', async () => {
        expect(await fileField(above(button('Upload'))).exists()).to
          .be.true;
      });

      it('test value()', async () => {
        attach(
          path.join(__dirname, 'data', 'foo.txt'),
          fileField(above(button('Upload'))),
        );
        expect(
          await fileField(above(button('Upload'))).value(),
        ).to.include('foo.txt');
      });
    });
    describe('with wrapped text in label', () => {
      it('test exists()', async () => {
        expect(await fileField('Select a file').exists()).to.be.true;
      });

      it('test value()', async () => {
        attach(
          path.join(__dirname, 'data', 'foo.txt'),
          fileField('Select a file'),
        );
        expect(await fileField('Select a file').value()).to.include(
          'foo.txt',
        );
      });
    });
    describe('using label for', () => {
      it('test exists()', async () => {
        expect(await fileField('Choose a file').exists()).to.be.true;
      });

      it('test value()', async () => {
        attach(
          path.join(__dirname, 'data', 'foo.txt'),
          fileField('Select a file'),
        );
        expect(await fileField('Choose a file').value()).to.include(
          'foo.txt',
        );
      });
    });
  });
  describe('hidden', () => {
    it('exists when selectHiddenElement is provided', async () => {
      expect(
        await fileField(
          { id: 'hidden-file-upload' },
          { selectHiddenElement: true },
        ).exists(),
      ).to.be.true;
    });

    it('does not exists when selectHiddenElement is not provided', async () => {
      expect(
        await fileField({ id: 'hidden-file-upload' }).exists(0, 0),
      ).to.be.false;
    });
  });
});
