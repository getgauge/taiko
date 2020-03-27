const chai = require('chai');
const rewire = require('rewire');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const taiko = rewire('../../lib/taiko');
let { openBrowser, goto, closeBrowser, write, beforeunload, accept, reload } = taiko;
let { createHtml, removeFile, openBrowserArgs } = require('./test-util');
const test_name = 'beforeunload';

describe(test_name, () => {
  let filePath, filePath1, called;
  before(async () => {
    let innerHtml = `
    <div class="main">
        <label>Write your name : <input id='name' type="text" autofocus /> </label>
    </div>
    <script>
        let oldValue = document.getElementById('name').value;
        window.addEventListener('beforeunload', function (e) {
          let newValue = document.getElementById('name').value;
          if( oldValue != newValue) {
            e.returnValue = '';
          }
        });
    </script>
    `;
    filePath = createHtml(innerHtml, test_name);
    filePath1 = createHtml('<div>empty</div>', 'Page without beforeunload');
  });

  afterEach(() => {
    called = false;
  });

  after(async () => {
    removeFile(filePath);
  });

  describe('on browser close', () => {
    it('should invoke callback when beforeunload popup shows up on close browser ', async () => {
      await openBrowser(openBrowserArgs);
      await goto(filePath);
      beforeunload(() => {
        called = true;
        accept();
      });
      await write('some thing', 'Write your name :');
      await closeBrowser();
      expect(called).to.be.true;
    });
  });

  describe('on navigation out of the page', () => {
    before(async () => {
      await openBrowser(openBrowserArgs);
    });

    beforeEach(async () => {
      await goto(filePath);
    });

    after(async () => {
      await closeBrowser();
    });

    it('should invoke callback when beforeunload popup shows up on page navigation', async () => {
      beforeunload(() => {
        called = true;
        accept();
      });
      await write('some thing', 'Write your name :');
      await goto(filePath1);
      expect(called).to.be.true;
    });

    it('should invoke callback when beforeunload popup shows up on reload', async () => {
      beforeunload(() => {
        called = true;
        accept();
      });
      await write('some thing', 'Write your name :');
      await reload();
      expect(called).to.be.true;
    });
  });
});
