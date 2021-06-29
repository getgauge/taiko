const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const rewire = require('rewire');
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

  it('should paste emoji char into focused element', async () => {
    const input = textBox({ id: 'focused' });
    const text = '🦘 🦡 🐨 🐯 🦁 🐮 🐷 🐽 🐸 writing to focused input';
    await paste(text);
    expect(await input.value()).to.equal(text);
  });

  it('into input field text', async () => {
    const input = textBox({ id: 'text' });
    const text = 'hello';
    await paste(text, into(input));
    expect(await input.value()).to.equal(text);
  });

  it('into input field by label', async () => {
    const input = textBox({ id: 'labelled' });
    const label = 'Labelled input:';
    const text = 'hello';
    await paste(text, into(label));
    expect(await input.value()).to.equal(text);
  });

  it('should fail for readonly field', async () => {
    const input = textBox({ id: 'readonly' });
    const text = 'hello';
    await expect(paste(text, into(input))).to.eventually.be.rejected;
  });

  it('should convert number to string value', async () => {
    const input = textBox({ id: 'text' });
    const number = 12345;
    await expect(paste(number, into(input))).not.to.eventually.be.rejected;
    expect(await input.value()).to.equal(number.toString());
  });

  it('should convert null to empty string value', async () => {
    const input = textBox({ id: 'text' });
    const empty = null;
    await expect(paste(empty, into(input))).not.to.eventually.be.rejected;
    expect(await input.value()).to.equal('');
  });

  it('should convert undefined to empty string value', async () => {
    const input = textBox({ id: 'text' });
    const empty = undefined;
    await expect(paste(empty, into(input))).not.to.eventually.be.rejected;
    expect(await input.value()).to.equal('');
  });

  it('should wait for element to be writable when selector is provided', async () => {
    const input = textBox({ id: 'disabled' });
    const text = 'Taiko can wait for element to be writable.';
    await paste(text, into(input));
    expect(await input.value()).to.equal(text);
  });

  it('should paste into shadow dom element', async () => {
    const input = textBox({ id: 'shadow' });
    const text = 'Shadow text updated';
    await paste(text, into(input));
    expect(await input.value()).to.equal(text);
  });

  describe('write test on multiple similar elements', () => {
    before(async () => {
      let innerHtml = `
        <input type='text' id='text' readonly />
        <input type='text' id='text' />
        <input type='text' id='readonly' readonly />
        <input type='text' id='readonly' readonly />
      `;
      filePath = createHtml(innerHtml, test_name);
    });

    after(async () => {
      removeFile(filePath);
    });

    it('should paste into first writable element', async () => {
      const input = textBox({ id: 'text' });
      const text = 'hello';
      await expect(paste(text, into(input))).not.to.eventually.be.rejected;
    });

    it('should reject if no element is writable', async () => {
      const input = textBox({ id: 'readonly' });
      const text = 'hello';
      await expect(paste(text, into(input))).to.eventually.be.rejectedWith(
        'TextBox[id="readonly"]is not writable',
      );
    });
  });
});

// separated from the rest because taiko needs to get rewired
describe('paste with hideText option', () => {
  let filePath, actualEmmiter, taiko;
  let emitter = new EventEmitter();

  let validateEmitterEvent = function (event, expectedText) {
    return new Promise((resolve) => {
      emitter.on(event, (res) => {
        expect(res).to.be.equal(expectedText);
        resolve();
      });
    });
  };

  before(async () => {
    taiko = rewire('../../lib/taiko.js');
    actualEmmiter = taiko.__get__('descEvent');

    taiko.__set__('descEvent', emitter);

    filePath = createHtml(innerHtml, test_name);
    await taiko.openBrowser(openBrowserArgs);
    await taiko.goto(filePath);
    taiko.setConfig({
      waitForNavigation: false,
      retryTimeout: 100,
      retryInterval: 10,
    });
  });

  after(async () => {
    removeFile(filePath);
    taiko.closeBrowser();
    taiko.__set__('descEvent', actualEmmiter);
  });

  afterEach(() => {
    emitter.removeAllListeners();
  });

  it.skip('should mask the text when pasting to focused element', async () => {
    let validatePromise = validateEmitterEvent('success', 'Pasted ***** into the focused element.');
    await taiko.paste('pasting to focused input', { hideText: true });
    await validatePromise;
  });

  it('should mask the text when pasting into a selected element', async () => {
    let validatePromise = validateEmitterEvent(
      'success',
      'Pasted ***** into the textBox[id="text"]',
    );
    const input = taiko.textBox({ id: 'text' });
    const text = 'hello';
    await taiko.paste(text, taiko.into(input), { hideText: true });
    await validatePromise;
  });
});
