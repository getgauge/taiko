const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const rewire = require('rewire');
const EventEmitter = require('events').EventEmitter;
const taiko = rewire('../../lib/taiko.js');
chai.use(chaiAsPromised);
const expect = chai.expect;
let { openBrowser, goto, textBox, closeBrowser, write, into, toLeftOf, setConfig, reload } = taiko;
let { createHtml, removeFile, openBrowserArgs } = require('./test-util');
let test_name = 'write';

describe(test_name, () => {
  let filePath;
  before(async () => {
    let innerHtml = `
        <div>
            <form name="inputTypeText">
            <!--  //Read only input with type text -->
                <div name="inputTypeTextWithInlineTextReadonly">
                    <input type="text" readonly>inputTypeTextWithInlineTextReadonly</input>
                </div>
                <div name="focused input" >
                    <input type="text" autofocus >focused input</input>
                </div>
                <div name="input-type-text">
                    <input type="text">input-type-text</input>
                </div>
                <div>
                    <input type="text" disabled='true' id='disabled-input'>initially disabled input-type-text</input>
                </div>
            </form>
            <script type="text/javascript">
                setTimeout( () => {
                    document.getElementById('disabled-input').disabled = false;
                }, 100);
            </script>
        </div>`;
    filePath = createHtml(innerHtml, test_name);
    setConfig({
      waitForNavigation: false,
      retryTimeout: 100,
      retryInterval: 10,
    });
    await openBrowser(openBrowserArgs);
    await goto(filePath);
  });

  after(async () => {
    removeFile(filePath);
    setConfig({
      waitForNavigation: true,
      retryTimeout: 10000,
      retryInterval: 100,
    });
    await closeBrowser();
  });

  it('into focused element', async () => {
    await write('writing to focused input');
    expect(await textBox('focused input').value()).to.equal('writing to focused input');
  });

  it('should enter emoji char into focused element', async () => {
    await reload();
    await write('🦘 🦡 🐨 🐯 🦁 🐮 🐷 🐽 🐸 writing to focused input');
    expect(await textBox('focused input').value()).to.equal(
      '🦘 🦡 🐨 🐯 🦁 🐮 🐷 🐽 🐸 writing to focused input',
    );
  });

  it('into input field text', async () => {
    expect(await textBox('input-type-text').value()).to.equal('');
    await write('hello', into(textBox('input-type-text')));
    expect(await textBox('input-type-text').value()).to.equal('hello');
  });

  it('should fail for readonly feild', async () => {
    await expect(
      write('inputTypeTextWithInlineText', into(textBox('inputTypeTextWithInlineTextReadonly'))),
    ).to.eventually.be.rejected;
  });

  it('should wait for element to be writable when selector is provided', async () => {
    await write(
      'Taiko can wait for element to be writable.',
      into(textBox('initially disabled input-type-text')),
    );
    expect(await textBox('initially disabled input-type-text').value()).to.equal(
      'Taiko can wait for element to be writable.',
    );
  });

  it('should wait for element to be writable', async () => {
    let innerHtml = `
        <div>
            <form name="inputTypeText">
                <div>
                    <input type="text" disabled='true' id='disabled-input' autofocus>initially disabled input-type-text</input>
                </div>
            </form>
            <script type="text/javascript">
                setTimeout( () => {
                    document.getElementById('disabled-input').disabled = false;
                }, 100);
            </script>
        </div>`;
    filePath = createHtml(innerHtml, test_name);
    await goto(filePath);
    await write(
      'Taiko can wait for element to be writable.',
      into(textBox('initially disabled input-type-text')),
    );
    expect(await textBox('initially disabled input-type-text').value()).to.equal(
      'Taiko can wait for element to be writable.',
    );
  });
});

describe('write test on multiple similar elements', () => {
  let readonlyFilePath;
  before(async () => {
    let innerHtml =
      '<div>' +
      '<form name="inputTypeText">' +
      //Read only input with type text
      '<div name="inputTypeText">' +
      '<input type="text" readonly>inputTypeText</input>' +
      '</div>' +
      '<div name="inputTypeText">' +
      '<input type="text">inputTypeText</input>' +
      '</div>' +
      '<div name="readonlyInputTypeText">' +
      '<input type="text" readonly>readonlyInputTypeText</input>' +
      '</div>' +
      '<div name="readonlyInputTypeText">' +
      '<input type="text" readonly>readonlyInputTypeText</input>' +
      '</div>' +
      '</form>';
    ('</div>');
    readonlyFilePath = createHtml(innerHtml, test_name);
    await openBrowser(openBrowserArgs);
    setConfig({
      waitForNavigation: false,
      retryTimeout: 100,
      retryInterval: 10,
    });
    await goto(readonlyFilePath);
  });

  after(async () => {
    removeFile(readonlyFilePath);
    setConfig({ waitForNavigation: true });
    await closeBrowser();
  });

  it('should write into first writable element', async () => {
    await expect(write('inputTypeTextWithInlineText', into(textBox('inputTypeText')))).not.to
      .eventually.be.rejected;
  });

  it('should reject if no element is writable', async () => {
    await expect(
      write('inputTypeTextWithInlineText', into(textBox('readonlyInputTypeText'))),
    ).to.eventually.be.rejectedWith('Element focused is not writable');
  });

  it('should convert number to string value', async () => {
    await expect(write(12345, into(textBox('inputTypeText')))).not.to.eventually.be.rejected;
  });

  it('should convert null to empty string value', async () => {
    await expect(write(null, into(textBox('inputTypeText')))).not.to.eventually.be.rejected;
  });

  it('should convert undefined to empty string value', async () => {
    await expect(write(undefined, into(textBox('inputTypeText')))).not.to.eventually.be.rejected;
  });
});

describe('Write with hideText option', () => {
  let filePath;
  let actualEmmiter;
  let emitter = new EventEmitter();

  let validateEmitterEvent = function(event, expectedText) {
    return new Promise(resolve => {
      emitter.on(event, res => {
        expect(res).to.be.equal(expectedText);
        resolve();
      });
    });
  };

  before(async () => {
    actualEmmiter = taiko.__get__('descEvent');

    taiko.__set__('descEvent', emitter);

    let innerHtml = `
        <div>
            <form name="inputTypeText">
            <!--  //Read only input with type text -->
                <div name="inputTypeTextWithInlineTextReadonly">
                    <input type="text" readonly />inputTypeTextWithInlineTextReadonly
                </div>
                <div name="focused input">
                    <input type="text" autofocus />focused input
                </div>
                <div name="input-type-text">
                    <input type="text" />input-type-text
                </div>
                <div>
                    <input type="text" disabled="true" id="disabled-input" />initially disabled input-type-text
                </div>
            </form>
            <script type="text/javascript">
                setTimeout( () => {
                    document.getElementById('disabled-input').disabled = false;
                }, 100);
            </script>
        </div>`;

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
    taiko.setConfig({
      waitForNavigation: true,
      retryTimeout: 10000,
      retryInterval: 100,
    });
    await taiko.closeBrowser();
    taiko.__set__('descEvent', actualEmmiter);
  });

  afterEach(() => {
    emitter.removeAllListeners();
  });

  it('should mask the text when writing to focused element', async () => {
    let validatePromise = validateEmitterEvent('success', 'Wrote ***** into the focused element.');
    await taiko.write('writing to focused input', { hideText: true });
    await validatePromise;
  });

  it('should mask the text when writing into a selected element', async () => {
    let validatePromise = validateEmitterEvent(
      'success',
      'Wrote ***** into the text field To left of input-type-text',
    );
    await taiko.write('something', into(textBox(toLeftOf('input-type-text'))), { hideText: true });
    await validatePromise;
  });
});
