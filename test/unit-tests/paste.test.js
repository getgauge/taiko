const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const EventEmitter = require('events').EventEmitter;
chai.use(chaiAsPromised);
const expect = chai.expect;
let {
  openBrowser,
  goto,
  textBox,
  closeBrowser,
  paste,
  into,
  setConfig,
} = require('../../lib/taiko.js');
let { createHtml, removeFile, openBrowserArgs } = require('./test-util');
let test_name = 'paste';

let innerHtml = `
  <div>
    <script>
      class ShadowButton extends HTMLElement {
        constructor() {
          super();
          var shadow = this.attachShadow({mode: 'open'});

          var button = document.createElement('input');
          button.setAttribute('type', 'text');
          button.setAttribute('id', 'shadow');
          shadow.appendChild(button);
        }
      }
      customElements.define('shadow-button', ShadowButton);
    </script>
    <shadow-button></shadow-button>
    <div>
      <input type='text' id='readonly' readonly />inputTypeTextWithInlineTextReadonly
    </div>
    <div>
      <input type='text' id='focused' autofocus />focused input
    </div>
    <div>
      <input type='text' id='text' />text
    </div>
    <div>
      <label for='labelled'>Labelled input:</label>
      <input type='text' id='labelled' />labelled
    </div>
    <div>
      <input type='text' disabled id='disabled' />initially disabled
    </div>
    <script type='text/javascript'>
      setTimeout( () => {
        document.getElementById('disabled').disabled = false;
      }, 100);
    </script>
  </div>`;

describe(test_name, () => {
  let filePath;

  before(async () => {
    filePath = createHtml(innerHtml, test_name);
    setConfig({
      waitForNavigation: false,
      retryTimeout: 1000,
      retryInterval: 10,
    });
    await openBrowser(openBrowserArgs);
  });

  after(async () => {
    removeFile(filePath);
    await closeBrowser();
  });

  beforeEach(async () => {
    await goto(filePath);
  });

  it('into focused element', async () => {
    const input = textBox({ id: 'focused' });
    const text = 'writing to focused input';
    
    await paste(text);

    expect(await input.value()).to.equal(text);
  });
});
