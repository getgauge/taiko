const expect = require('chai').expect;
const rewire = require('rewire');
const nodeFilters = rewire('../../lib/nodeFilters');
class DomRects {
}
const TEXT_NODE = 3;
describe('Node filters', () => {

    describe('Filter visible nodes', () => {
        let nodeIds;
        beforeEach(() => {
            nodeFilters.__set__('Node', { TEXT_NODE });
            nodeIds = {
                23: {
                    offsetHeight: 1, offsetWidth: 0
                },
                45: {
                    offsetHeight: 0, offsetWidth: 1
                },
                67: {
                    offsetHeight: 0, offsetWidth: 1, getClientRects: () => [new DomRects(), new DomRects()]
                },
                68: {
                    offsetHeight: 0, offsetWidth: 0, getClientRects: () => []
                },
                89: {
                    nodeType: TEXT_NODE, parentElement: {
                        offsetHeight: 0, offsetWidth: 1, getClientRects: () => [new DomRects(), new DomRects()]
                    }
                }
            };
        });
        it('should return visible nodes', async () => {
            const callOnFunction = (nodeId, predicate) => ({ value: predicate.call(nodeIds[nodeId]) });
            const visibleNodeIds = [23, 45, 67];
            expect(await nodeFilters.filterVisibleNodes([23, 45, 67, 68], callOnFunction)).to.eql(visibleNodeIds);
        });

        it('should use parentElement to determine visibility for text nodes', async () => {
            let callOnFunction = (nodeId, predicate) => {
                return { value: predicate.call(nodeIds[nodeId]) };
            };
            const visibleNodeIds = [23, 89];
            expect(await nodeFilters.filterVisibleNodes([23, 68, 89], callOnFunction)).to.eql(visibleNodeIds);
        });
    });
});