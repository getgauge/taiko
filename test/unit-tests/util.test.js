const chai = require('chai');
const expect = chai.expect;
const { trimChar } = require('../../lib/util');
const test_name = 'util';

describe(test_name, () => {
    describe('trim Char()', () => {
        it('should trim the char specified from the string', async () => {
            const actual = trimChar('|foo|','|');
            const expected = 'foo';
            expect(actual).to.be.equal(expected);
        });
    });
});
