const chai = require('chai');
const expect = chai.expect;
var sinon = require('sinon');
const { descEvent } = require('../../lib/eventBus');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
let {
  openBrowser,
  closeBrowser,
  goto,
  range,
  setConfig,
  below,
  evaluate,
  $,
} = require('../../lib/taiko');
let { createHtml, removeFile, openBrowserArgs, resetConfig } = require('./test-util');

describe('Range test', () => {
  let filePath;

  before(async () => {
    let innerHtml =
      `<script>
     
        class ShadowButton extends HTMLElement {
          constructor() {
            super();
            var shadow = this.attachShadow({mode: 'open'});
    
            var button = document.createElement('input');
            button.setAttribute('type', 'range');
            button.setAttribute('id', 'Shadow Click');
            button.addEventListener("click", event => {
              alert("Hello from the shadows");
            });
            shadow.appendChild(button);

            var hiddenButton = document.createElement('input');
            hiddenButton.setAttribute('type', 'range');
            hiddenButton.setAttribute('id', 'HiddenShadowButton');
            hiddenButton.setAttribute('style','display:none');
            shadow.appendChild(hiddenButton);
            
          }
        }
        customElements.define('shadow-button', ShadowButton);
      </script>` +
      ' <shadow-button></shadow-button>' +
      `
        <div>
            <p>RangeItem</p>
            <input type="range" id="range-1" name="range" 
                min="0" max="100" value='2'>
            <label for="volume">Volume</label>
        </div>
        <div>
        <p>RangeItem</p>
        <input type="range" id="range-2" name="range" value='2'>
        <label for="volume">Volume</label>
    </div>
     `;
    filePath = createHtml(innerHtml, 'Range');
    await openBrowser(openBrowserArgs);
    await goto(filePath);
    setConfig({
      waitForNavigation: false,
      retryTimeout: 10,
      retryInterval: 10,
    });
  });

  after(async () => {
    resetConfig();
    await closeBrowser();
    removeFile(filePath);
  });

  describe('shadow dom', () => {
    it('inside shadow dom', async () => {
      expect(await range({ id: 'Shadow Click' }).exists()).to.be.true;
    });

    it('should return false for hidden element when isVisible fn is called on shadow range', async () => {
      expect(await range({ id: 'HiddenShadowButton' }).isVisible()).to.be.false;
    });
  });

  it('Set Range value with Integer', async () => {
    await range({ id: 'range-1' }).select(10);
    expect(await range({ id: 'range-1' }).value()).to.be.equal('10');
  });

  it('Set Range value with Float value', async () => {
    await range({ id: 'range-1' }).select(10.81);
    expect(await range({ id: 'range-1' }).value()).to.be.equal('11');
  });

  it('Set Range value with Float value as String', async () => {
    await range({ id: 'range-1' }).select('10.81');
    expect(await range({ id: 'range-1' }).value()).to.be.equal('11');
  });

  it('Set Range value with value as String', async () => {
    await range({ id: 'range-1' }).select('10');
    expect(await range({ id: 'range-1' }).value()).to.be.equal('10');
  });

  it('Set Range value with proximity selector', async () => {
    await range({ id: 'range-1' }, below('RangeItem')).select('10');
    expect(await range({ id: 'range-1' }).value()).to.be.equal('10');
  });

  it('Should throw error when value is non integer', async () => {
    await expect(range({ id: 'range-1' }).select('foo')).to.be.rejectedWith(
      "The value foo is not between the input's range of 0-100",
    );
  });

  it('Should throw warning when exceeded maximum value', async () => {
    sinon.stub(console, 'warn');
    await range({ id: 'range-1' }).select(110);
    expect(console.warn.calledOnce).to.be.true;
    expect(console.warn.calledWith("The value 110 is not between the input's range of 0-100")).to.be
      .true;
  });

  it('Test Description emit', async () => {
    descEvent.once('success', (value) => {
      expect(value).to.be.equal('Selected value 100 for the given input value 1111');
    });
    await range({ id: 'range-1' }).select('1111');
  });

  it('should emit events', async () => {
    await evaluate(() => {
      document.raisedEvents = [];
      var range = document.getElementById('range-2');
      ['input', 'change'].forEach((ev) => {
        range.addEventListener(ev, () => document.raisedEvents.push(ev));
      });
    });

    await range({ id: 'range-2' }).select(110);

    var events = await evaluate(() => document.raisedEvents);
    expect(events).to.eql(['change', 'input']);
  });

  describe('Color picker test without min and max', () => {
    it('Set Range value above the extreme edges', async () => {
      await range({ id: 'range-2' }).select(110);
      expect(await range({ id: 'range-2' }).value()).to.be.equal('100');
    });

    it('Set Range value below the extreme edges', async () => {
      await range({ id: 'range-2' }).select(-1);
      expect(await range({ id: 'range-2' }).value()).to.be.equal('0');
    });
  });

  describe('Parameters validation', () => {
    it('should throw a TypeError when an ElementWrapper is passed as argument', async () => {
      expect(() => range($('div'))).to.throw(
        'You are passing a `ElementWrapper` to a `range` selector. Refer https://docs.taiko.dev/api/range/ for the correct parameters',
      );
    });
  });
});
