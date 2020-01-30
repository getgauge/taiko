const chai = require('chai');
const rewire = require('rewire');
const expect = chai.expect;
const util = rewire('../../lib/util');
const { trimCharLeft, escapeHtml, taikoInstallationLocation } = util;
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

  describe('.escapeHtml', () => {
    it('should escape special char for html', async () => {
      const actual = escapeHtml('&');
      const expected = '&amp;';
      expect(actual).to.be.equal(expected);
    });

    it('should escape multiple special char for html', async () => {
      const actual = escapeHtml('& foo \' " ;');
      const expected = '&amp; foo &#039; &quot; ;';
      expect(actual).to.be.equal(expected);
    });
  });

  describe('taikoInstallationLocation', () => {
    let packageJSONExists = true,
      packageJSONData;
    before(() => {
      util.__set__('existsSync', () => {
        return packageJSONExists;
      });
      util.__set__('readFileSync', () => {
        return packageJSONData;
      });
      util.__set__('spawnSync', (_, options) => {
        if (options.includes('-g')) {
          return { output: [null, '/path/to/taiko-global/installation'] };
        }
        return { output: [null, '/path/to/taiko-local/installation'] };
      });
    });

    it('should return taiko installtion location when CWD is not an npm project', () => {
      packageJSONExists = false;
      let expected = '/path/to/taiko-global/installation/taiko';
      let actual = taikoInstallationLocation();
      expect(actual).to.be.equal(expected);
    });

    it('should return taiko installtion location when taiko is installed locally', () => {
      packageJSONExists = true;
      packageJSONData = JSON.stringify({
        dependencies: {
          taiko: '1.0.3',
        },
      });
      let expected = '/path/to/taiko-local/installation/taiko';
      let actual = taikoInstallationLocation();
      expect(actual).to.be.equal(expected);
    });

    it('should return taiko installtion location when taiko is installed globally', () => {
      packageJSONExists = true;
      packageJSONData = JSON.stringify({ name: 'npm-module' });
      let expected = '/path/to/taiko-global/installation/taiko';
      let actual = taikoInstallationLocation();
      expect(actual).to.be.equal(expected);
    });

    it('should return taiko installtion location when taiko is installed from local source', () => {
      packageJSONExists = true;
      packageJSONData = JSON.stringify({ name: 'taiko' });
      let expected = process.cwd();
      let actual = taikoInstallationLocation();
      expect(actual).to.be.equal(expected);
    });
  });
});
