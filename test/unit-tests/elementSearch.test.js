const expect = require("chai").expect;
const rewire = require("rewire");
class DomRects {}
const TEXT_NODE = 3;

describe("Element Search", () => {
  let Element, elementSearch, getIfExists;

  before(() => {
    Element = rewire("../../lib/elements/element");
    elementSearch = rewire("../../lib/elementSearch");
    getIfExists = elementSearch.getIfExists;
  });

  after(() => {
    Element = rewire("../../lib/elements/element");
    elementSearch = rewire("../../lib/elementSearch");
  });

  describe("getIfExists", () => {
    let findElementCallCount, originalWaitUntil;
    const findElement = async () => {
      findElementCallCount++;
      return [{ id: 23 }];
    };
    beforeEach(() => {
      originalWaitUntil = elementSearch.__get__("waitUntil");
      findElementCallCount = 0;
      elementSearch.__set__("waitUntil", async (condition) => {
        await condition();
      });
    });

    it("should wait and find elements", async () => {
      const elements = await getIfExists(findElement, "Element description")(
        null,
        10,
        10,
      );

      expect(elements).to.be.deep.equal([
        { id: 23, description: "Element description" },
      ]);
      expect(findElementCallCount).to.be.equal(1);
    });

    it("should try to find element after wait on unsuccessful finding", async () => {
      const findElement = async () => {
        findElementCallCount++;
        const elements = findElementCallCount == 2 ? [{ id: 23 }] : [];
        return elements;
      };
      const elements = await getIfExists(findElement, "Element description")(
        null,
        10,
        10,
      );

      expect(elements).to.be.deep.equal([
        { id: 23, description: "Element description" },
      ]);
      expect(findElementCallCount).to.be.equal(2);
    });

    it("should add custom behaviour to elements", async () => {
      const elements = await getIfExists(findElement, "Element description", {
        exists: () => true,
      })(null, 10, 10);
      const element = elements[0];
      expect("exists" in element).to.be.true;
      expect(element.exists()).to.be.true;
    });

    it("should handle wait timeout error", async () => {
      elementSearch.__set__("waitUntil", originalWaitUntil);
      const elements = await getIfExists(() => [], "Element description")(
        null,
        10,
        10,
      );

      expect(elements.length).to.be.deep.equal(0);
    });

    it("should not handle non wait timeout error", async () => {
      elementSearch.__set__("waitUntil", originalWaitUntil);
      const elementFinder = await getIfExists(() => {
        throw new Error("Non wait timeout error.");
      }, "Element description");

      await expect(elementFinder(null, 10, 10)).to.be.eventually.rejectedWith(
        "Non wait timeout error.",
      );
    });
  });
});
