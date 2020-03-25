const expect = require('chai').expect;
const rewire = require('rewire');
const Element = rewire('../../lib/elements/element');
const elementSearch = rewire('../../lib/elementSearch');
const { getIfExists } = elementSearch;
class DomRects {}
const TEXT_NODE = 3;
describe('Element Search', () => {
  describe('Filter visible nodes', () => {
    let nodeIds, runtimeHandler;
    const filterVisibleNodes = elementSearch.__get__('filterVisibleNodes');
    beforeEach(() => {
      Element.__set__('Node', { TEXT_NODE });
      nodeIds = {
        23: {
          offsetHeight: 1,
          offsetWidth: 0,
        },
        45: {
          offsetHeight: 0,
          offsetWidth: 1,
        },
        67: {
          offsetHeight: 0,
          offsetWidth: 1,
          getClientRects: () => [new DomRects(), new DomRects()],
        },
        68: {
          offsetHeight: 0,
          offsetWidth: 0,
          getClientRects: () => [],
        },
        89: {
          nodeType: TEXT_NODE,
          parentElement: {
            offsetHeight: 0,
            offsetWidth: 1,
            getClientRects: () => [new DomRects(), new DomRects()],
          },
        },
      };
      runtimeHandler = {
        runtimeCallFunctionOn: (predicate, args, obj) => {
          const result = {
            result: { value: predicate.call(nodeIds[obj.nodeId]) },
          };
          return result;
        },
      };
    });
    const createElement = elements =>
      elements.map(nodeId => new Element(nodeId, '', runtimeHandler));

    it('should return visible nodes', async () => {
      const visibleNodeIds = createElement([23, 45, 67]);
      const elementsToFilter = createElement([23, 45, 67, 68]);
      expect(await filterVisibleNodes(elementsToFilter)).to.eql(visibleNodeIds);
    });

    it('should use parentElement to determine visibility for text nodes', async () => {
      const visibleNodeIds = createElement([23, 89]);
      const elementsToFilter = createElement([23, 68, 89]);
      expect(await filterVisibleNodes(elementsToFilter)).to.eql(visibleNodeIds);
    });
  });
  describe('getIfExists', () => {
    let findElementCallCount,
      originalWaitUntil = elementSearch.__get__('waitUntil');
    const findElement = async () => {
      findElementCallCount++;
      return [{ id: 23 }];
    };
    beforeEach(() => {
      findElementCallCount = 0;
      elementSearch.__set__('waitUntil', async condition => {
        await condition();
      });
    });

    it('should wait and find elements', async () => {
      let elements = await getIfExists(findElement, 'Element description')(null, 10, 10);

      expect(elements).to.be.deep.equal([{ id: 23, description: 'Element description' }]);
      expect(findElementCallCount).to.be.equal(1);
    });

    it('should try to find element after wait on unsuccessful finding', async () => {
      let findElement = async () => {
        findElementCallCount++;
        let elements = findElementCallCount == 2 ? [{ id: 23 }] : [];
        return elements;
      };
      let elements = await getIfExists(findElement, 'Element description')(null, 10, 10);

      expect(elements).to.be.deep.equal([{ id: 23, description: 'Element description' }]);
      expect(findElementCallCount).to.be.equal(2);
    });

    it('should add custom behaviour to elements', async () => {
      let elements = await getIfExists(findElement, 'Element description', { exists: () => true })(
        null,
        10,
        10,
      );
      const element = elements[0];
      expect('exists' in element).to.be.true;
      expect(element.exists()).to.be.true;
    });

    it('should handle wait timeout error', async () => {
      elementSearch.__set__('waitUntil', originalWaitUntil);
      let elements = await getIfExists(() => [], 'Element description')(null, 10, 10);

      expect(elements.length).to.be.deep.equal(0);
    });

    it('should not handle non wait timeout error', async () => {
      elementSearch.__set__('waitUntil', originalWaitUntil);
      let elementFinder = await getIfExists(() => {
        throw new Error('Non wait timeout error.');
      }, 'Element description');

      await expect(elementFinder(null, 10, 10)).to.be.eventually.rejectedWith(
        'Non wait timeout error.',
      );
    });
  });
});
