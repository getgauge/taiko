const { descEvent } = require('../../lib/helper');

let { openBrowser, goto, dragAndDrop, setConfig, closeBrowser, $ } = require('../../lib/taiko');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
let { createHtml, removeFile, openBrowserArgs, resetConfig } = require('./test-util');
const test_name = 'DragAndDrop';

describe(test_name, () => {
  let filePath;

  let validateEmitterEvent = function (event, expectedText) {
    return new Promise((resolve) => {
      descEvent.once(event, (eventData) => {
        expect(eventData).to.be.equal(expectedText);
        resolve();
      });
    });
  };
  before(async () => {
    let innerHtml = `<div id="columns">
        <div class="column" id="column-a" draggable="true"><header>A</header></div>
        <div class="column" id="column-b" draggable="true" hidden><header>B</header></div>
        </div>`;

    filePath = createHtml(innerHtml, test_name);
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

  describe('Drag and Drop test', () => {
    it('Should throw an error if either source or destination is not present', async () => {
      try {
        expect(await dragAndDrop($('#column-a'), $('#column-c')));
      } catch (err) {
        expect(err.message).to.equal('CustomSelector with query #column-c  not found');
      }
    });

    it('should drag the element from source to destination if it is draggable', async () => {
      try {
        expect(await dragAndDrop($('#column-a'), $('#column-b')));
      } catch (err) {
        expect(err.message).to.equal('CustomSelector with query #column-b is not visible');
      }
    });

    it('should not drag the element if either source or destination is hidden', async () => {
      try {
        expect(await dragAndDrop($('#column-a'), $('#column-b'), { force: true }));
      } catch (err) {
        expect(err.message).to.equal('Taiko cannot drag hidden elements');
      }
    });
  });
});
