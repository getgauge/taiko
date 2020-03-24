const chai = require('chai');
const expect = require('chai').expect;
let chaiAsPromised = require('chai-as-promised');
const rewire = require('rewire');
const taiko = rewire('../../lib/taiko');
chai.use(chaiAsPromised);

describe('switchTo', () => {
  let argument;
  before(async () => {
    taiko.__set__('validate', () => {});
    taiko.__set__('targetHandler.getCriTargets', arg => {
      argument = arg;
      return { matching: [] };
    });
  });

  it('should throw error if no url specified', async () => {
    await expect(taiko.switchTo()).to.eventually.rejectedWith(TypeError);
  });

  it('should throw error if url is empty', async () => {
    await expect(taiko.switchTo('')).to.eventually.rejectedWith(
      'Cannot switch to tab or window. Hint: The targetUrl is empty. Please use a valid string or regex',
    );
  });

  it('should throw error if url is only spaces', async () => {
    await expect(taiko.switchTo('  ')).to.eventually.rejectedWith(
      'Cannot switch to tab or window. Hint: The targetUrl is empty. Please use a valid string or regex',
    );
  });

  it('should accept regex and call targetHandler with RegExp', async () => {
    await expect(taiko.switchTo(/http(s):\/\/www.google.com/)).to.eventually.rejectedWith(
      'No tab(s) matching /http(s):\\/\\/www.google.com/ found',
    );
    await expect(argument).to.deep.equal(new RegExp(/http(s):\/\/www.google.com/));
  });
});
