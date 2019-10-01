const chai = require('chai');
const expect = chai.expect;
const { trimCharLeft, escapeHtml } = require('../../lib/util');
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


describe(test_name, () => {
  describe('.escapeHtml', () => {
    it('should escape special char for html', async () => {
      const actual = escapeHtml("&");
      const expected = '&amp;';
      expect(actual).to.be.equal(expected);
    });

    it('should escape multiple special char for html', async () => {
      const actual = escapeHtml("& foo ' \" ;");
      const expected = '&amp; foo &#039; &quot; ;';
      expect(actual).to.be.equal(expected);
    });
  });
});
