const expect = require('chai').expect;
let rewire = require('rewire');
const targetHandler = rewire('../../../lib/handlers/targetHandler');

describe('TargetHandler', () => {

    describe('.getCriTargets', () => {
        let _targets = [];

        before(() => {
            let mockCri = {
                List: function () {
                    return _targets.reverse();
                }
            };
            targetHandler.__set__('cri', mockCri);
        });

        beforeEach(() => {
            _targets = [];
        });
        it('should give current tab as matching if no url given', async () => {
            _targets.push({ id: '1', type: 'page' });
            _targets.push({ id: '2', type: 'page' });
            let targets = await targetHandler.getCriTargets();
            expect(targets.matching.length).to.be.equal(1);
            expect(targets.matching[0].id).to.be.equal('2');
            expect(targets.others.length).to.be.equal(1);
            expect(targets.others[0].id).to.be.equal('1');
        });


        it('should give all matching tabs if url is given', async () => {
            _targets.push({ id: '1', type: 'page', url: 'https://flipkart.com' });
            _targets.push({ id: '2', type: 'page', url: 'https://amazon.com' });
            _targets.push({ id: '3', type: 'page', url: 'https://flipkart.com' });

            let targets = await targetHandler.getCriTargets('flipkart.com');

            expect(targets.matching.length).to.be.equal(2);
            expect(targets.matching[0].id).to.be.equal('3');
            expect(targets.matching[0].url).to.be.equal('https://flipkart.com');
            expect(targets.others.length).to.be.equal(1);
            expect(targets.others[0].url).to.be.equal('https://amazon.com');
        });

        it('should give no matching tabs if given url does not exists', async () => {
            _targets.push({ id: '1', type: 'page', url: 'https://flipkart.com' });
            _targets.push({ id: '2', type: 'page', url: 'https://amazon.com' });
            _targets.push({ id: '3', type: 'page', url: 'https://flipkart.com' });

            let targets = await targetHandler.getCriTargets('gauge.org');

            expect(targets.matching.length).to.be.equal(0);
            expect(targets.others.length).to.be.equal(3);
        });
    });

});

