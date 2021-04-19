const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
let {
  openBrowser,
  goto,
  closeBrowser,
  waitFor,
  $,
  click,
  text,
  button,
} = require('../../lib/taiko');
let { createHtml, removeFile, openBrowserArgs } = require('./test-util');
const test_name = 'waitFor';

chai.use(chaiAsPromised);

describe(test_name, function () {
  let filePath;
  before(async () => {
    let innerHtml =
      '<div name="test for wait">' +
      'Patience is the key, because when the right time comes, it will be very beautiful and totally worth the wait.' +
      '</div>' +
      '<button onclick="myFunction()">Click me</button>' +
      '<p id="demo"></p>' +
      '<script>' +
      'function myFunction() {' +
      'setTimeout(function() {' +
      'document.getElementById("demo").innerHTML = "Wait is Over..!";' +
      '}, 500)' +
      '}' +
      '</script>';
    filePath = createHtml(innerHtml, test_name);
    await openBrowser(openBrowserArgs);
  });

  beforeEach(async () => {
    await goto(filePath);
  });

  after(async () => {
    await closeBrowser();
    removeFile(filePath);
  });

  describe('waitFor test without time', () => {
    it('should not wait if time is not given', async () => {
      await expect(waitFor()).not.to.eventually.be.rejected;
    });
  });

  describe('waitFor test with only time', () => {
    it('should wait just for given time', async () => {
      await expect(waitFor(2000)).not.to.eventually.be.rejected;
    });
  });

  describe('waitFor test with only element', () => {
    it('should wait for element for default timeout', async () => {
      await expect(waitFor('beautiful')).not.to.eventually.be.rejected;
    });

    it('should timeout if element is not there', async () => {
      const expectedMessage = new RegExp(
        "Waiting Failed: Element 'something that is not there' not found within 2000 ms",
      );
      await expect(waitFor('something that is not there', 2000)).to.eventually.be.rejectedWith(
        expectedMessage,
      );
    });
  });

  describe('waitFor test with element and time', () => {
    it('should wait for element with given time ', async () => {
      await expect(waitFor('Patience', 4000)).not.to.eventually.be.rejected;
    });

    it('should wait for element', async () => {
      await expect(waitFor(text('Patience'), 4000)).not.to.eventually.be.rejected;
      await expect(waitFor(button('Click me'))).not.to.eventually.be.rejected;
    });

    it('should wait for element for the given time', async () => {
      const expectedMessage = new RegExp(
        "Waiting Failed: Element 'something that is not there' not found within 2000 ms",
      );
      await expect(waitFor('something that is not there', 2000)).to.eventually.be.rejectedWith(
        expectedMessage,
      );
    });
  });

  describe('waitFor to wait for a given condition', () => {
    it('should reject if element is not present', async () => {
      await click('Click me');
      const expectedMessage = 'waiting failed: retryTimeout 2000ms exceeded';
      await expect(
        waitFor(async () => await $('//*[text()="Wait is eOver..!"]').exists(0, 0), 2000),
      ).to.eventually.be.rejectedWith(expectedMessage);
    });

    it('should reject with custom message if element is not present', async () => {
      await click('Click me');
      const expectedMessage = 'Text Wait is eOver is not found';
      await expect(
        waitFor(async () => await $('//*[text()="Wait is eOver..!"]').exists(0, 0), 2000, {
          message: 'Text Wait is eOver is not found',
        }),
      ).to.eventually.be.rejectedWith(expectedMessage);
    });

    it('should wait for given condition', async () => {
      await click('Click me');
      await expect(waitFor(async () => await $('//*[text()="Wait is Over..!"]').exists(0.0))).not.to
        .eventually.be.rejected;
    });

    it('should wait for given string', async () => {
      await click('Click me');
      await expect(waitFor('Wait is Over', 2000)).not.to.eventually.be.rejected;
    });

    it('should wait for given selector', async () => {
      await click('Click me');
      await expect(waitFor(text('Wait is Over'), 2000)).not.to.eventually.be.rejected;
    });
  });
});
