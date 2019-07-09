const expect = require('chai').expect;
const rewire = require('rewire');
const elementSearch = rewire('../../lib/elementSearch');
class DomRects {
}
const TEXT_NODE = 3;
describe('Element Search', () => {

    describe('Filter visible nodes', () => {
        let nodeIds;
        const filterVisibleNodes = elementSearch.__get__('filterVisibleNodes');
        beforeEach(() => {
            elementSearch.__set__('Node', { TEXT_NODE });
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
            elementSearch.__set__('runtimeHandler',{runtimeCallFunctionOn:(predicate,args,obj)=>{
                const result = {result:{value:predicate.call(nodeIds[obj.nodeId])}};
                return result;
            }});
        });
        it('should return visible nodes', async () => {
            const visibleNodeIds = [23, 45, 67];
            expect(await filterVisibleNodes([23, 45, 67, 68])).to.eql(visibleNodeIds);
        });

        it('should use parentElement to determine visibility for text nodes', async () => {
            const visibleNodeIds = [23, 89];
            expect(await filterVisibleNodes([23, 68, 89])).to.eql(visibleNodeIds);
        });
    });
});