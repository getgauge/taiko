const expect = require("chai").expect;
const rewire = require("rewire");
const Element = require("../../../lib/elements/element");

class Event {
  constructor(name, options) {
    this.name = name;
    this.options = options;
  }
}

describe("DropDown", () => {
  let nodes,
    DropDown,
    dispatchedEvents,
    runtimeHandler = {
      async runtimeCallFunctionOn(predicate, contextId, options) {
        return {
          result: {
            value: predicate.call(nodes[options.objectId], options.arg),
          },
        };
      },
    };
  beforeEach(() => {
    DropDown = rewire("../../../lib/elements/dropDown");
    DropDown.__set__("Event", Event);
    DropDown.__set__(
      "doActionAwaitingNavigation",
      async (navigationOptions, action) => {
        await action();
      },
    );
    dispatchedEvents = [];
    nodes = {
      25: {
        selectedIndex: 1,
        multiple: false,
        options: [
          { value: "25 value 0", text: "25 text 0" },
          { value: "25 value 1", text: "25 text 1" },
          { value: "25 value 2", text: "25 text 2" },
        ],
        dispatchEvent(event) {
          dispatchedEvents.push(event);
        },
      },
      26: {
        selectedIndex: 1,
        multiple: false,
        options: [
          { value: "26 value 0", text: "26 text 0" },
          { value: "26 value 1", text: "26 text 1" },
          { value: "26 value 2", text: "26 text 2" },
        ],
        dispatchEvent(event) {
          dispatchedEvents.push(event);
        },
      },
      27: {
        selectedIndex: 1,
        multiple: false,
        options: [
          { value: "27 value 0", text: "27 text 0" },
          { value: "27 value 1", text: "27 text 1" },
          { value: "27 value 2", text: "27 text 2" },
        ],
        dispatchEvent(event) {
          dispatchedEvents.push(event);
        },
      },
      28: {
        selectedIndex: 1,
        multiple: false,
        value: "28 value 2",
        options: [
          { value: "28 value 0", text: "28 text 0" },
          { value: "28 value 1", text: "28 text 1" },
          { value: "28 value 2", text: "28 text 2" },
        ],
        dispatchEvent(event) {
          dispatchedEvents.push(event);
        },
      },
    };
  });

  afterEach(() => {
    DropDown = rewire("../../../lib/elements/dropDown");
  });

  it("should be element", () => {
    expect(new DropDown() instanceof Element).to.be.true;
  });

  it("should create DropDown from element", () => {
    const expectedDropDown = DropDown.from(
      new Element(12, "", runtimeHandler),
      "description",
    );
    const actualDropDown = new DropDown(12, "description", runtimeHandler);
    expect(actualDropDown).to.be.deep.equal(expectedDropDown);
  });

  describe("select", () => {
    it("should select dropdown item using index ", async () => {
      const objectId = 25;
      const dropDown = new DropDown(objectId, "description", runtimeHandler);
      expect(nodes[objectId].selectedIndex).to.be.equal(1);

      await dropDown.select({ index: 2 });
      expect(nodes[objectId].selectedIndex).to.be.equal(2);
      dispatchedEvents.forEach((e) => {
        expect(e instanceof Event).to.be.true;
        expect(e.options).to.be.deep.equal({
          bubbles: true,
        });
      });
      expect(dispatchedEvents.map((x) => x.name)).to.eql(["change", "input"]);
    });

    it("select dropdown item using value", async () => {
      const objectId = 26;
      const dropDown = new DropDown(objectId, "description", runtimeHandler);
      expect(nodes[objectId].selectedIndex).to.be.equal(1);

      await dropDown.select("26 value 2");
      expect(nodes[objectId].selectedIndex).to.be.equal(2);
      dispatchedEvents.forEach((e) => {
        expect(e instanceof Event).to.be.true;
        expect(e.options).to.be.deep.equal({
          bubbles: true,
        });
      });
      expect(dispatchedEvents.map((x) => x.name)).to.eql(["change", "input"]);
    });

    it("select dropdown item using text ", async () => {
      const objectId = 27;
      const dropDown = new DropDown(objectId, "description", runtimeHandler);
      expect(nodes[objectId].selectedIndex).to.be.equal(1);

      await dropDown.select("27 text 2");
      expect(nodes[objectId].selectedIndex).to.be.equal(2);
      dispatchedEvents.forEach((e) => {
        expect(e instanceof Event).to.be.true;
        expect(e.options).to.be.deep.equal({
          bubbles: true,
        });
      });
      expect(dispatchedEvents.map((x) => x.name)).to.eql(["change", "input"]);
    });
  });

  describe("value", () => {
    it("should return value", async () => {
      const objectId = 28;
      const dropDown = new DropDown(objectId, "description", runtimeHandler);
      await dropDown.select("28 text 2");
      expect(await dropDown.value()).to.be.equal("28 value 2");
    });
  });
});
