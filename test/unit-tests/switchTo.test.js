const chai = require('chai');
const expect = require('chai').expect;
let chaiAsPromised = require('chai-as-promised');
const rewire = require('rewire');
const taiko = rewire('../../lib/taiko');
chai.use(chaiAsPromised);

describe('switchTo', () => {
  before(async () => {
    taiko.__set__('validate', () => {});
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
});
