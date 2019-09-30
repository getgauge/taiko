const chai = require('chai');
const expect = chai.expect;
const { trimCharLeft } = require('../../lib/util');
const test_name = 'util';

describe(test_name, () => {
  describe('trim Char()', () => {
    it('should trim the char specified from the string', async () => {
      const actual = trimCharLeft('|foo', '|');
      const expected = 'foo';
      expect(actual).to.be.equal(expected);
    });
    it('should return empty string for null or undefined', async () => {
      expect(trimCharLeft(null, '|')).to.be.equal('');
      expect(trimCharLeft(undefined, '|')).to.be.equal('');
    });
  });
});
