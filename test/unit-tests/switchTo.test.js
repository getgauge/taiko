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
    await expect(taiko.switchTo()).to.eventually.rejectedWith(
      TypeError,
    );
  });
});
