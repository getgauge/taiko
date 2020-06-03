const expect = require('chai').expect;
const rewire = require('rewire');
class DomRects {}
const TEXT_NODE = 3;

describe('Element Search', () => {
  let Element, elementSearch, getIfExists;

  before(() => {
    Element = rewire('../../lib/elements/element');
    elementSearch = rewire('../../lib/elementSearch');
    getIfExists = elementSearch.getIfExists;
  });

  after(() => {
    Element = rewire('../../lib/elements/element');
    elementSearch = rewire('../../lib/elementSearch');
  });

  describe('Filter visible nodes', () => {
    let objectIds, runtimeHandler, filterVisibleNodes;
    beforeEach(() => {
      filterVisibleNodes = elementSearch.__get__('filterVisibleNodes');
      Element.__set__('Node', { TEXT_NODE });
      objectIds = {
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
            result: { value: predicate.call(objectIds[obj.objectId]) },
          };
          return result;
        },
      };
    });
    const createElement = (elements) =>
      elements.map((objectId) => new Element(objectId, '', runtimeHandler));

    it('should return visible nodes', async () => {
      const visibleobjectIds = createElement([23, 45, 67]);
      const elementsToFilter = createElement([23, 45, 67, 68]);
      expect(await filterVisibleNodes(elementsToFilter)).to.eql(visibleobjectIds);
    });

    it('should use parentElement to determine visibility for text nodes', async () => {
      const visibleobjectIds = createElement([23, 89]);
      const elementsToFilter = createElement([23, 68, 89]);
      expect(await filterVisibleNodes(elementsToFilter)).to.eql(visibleobjectIds);
    });
  });
  describe('getIfExists', () => {
    let findElementCallCount, originalWaitUntil;
    const findElement = async () => {
      findElementCallCount++;
      return [{ id: 23 }];
    };
    beforeEach(() => {
      originalWaitUntil = elementSearch.__get__('waitUntil');
      findElementCallCount = 0;
      elementSearch.__set__('waitUntil', async (condition) => {
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
