const expect = require("chai").expect;
const Element = require("taiko/lib/elements/element");
const TimeField = require("taiko/lib/elements/timeField");
const nodes = {
  23: {
    value: "2018-07-22",
  },
};
describe("timeField", () => {
  const runtimeHandler = {
    runtimeCallFunctionOn: (predicate, contextId, options) => {
      return {
        result: { value: predicate.call(nodes[options.objectId]) },
      };
    },
  };

  it("should be element", () => {
    expect(new TimeField() instanceof Element).to.be.true;
  });
  it("should create timeField from element", () => {
    const expectedTimeField = TimeField.from(
      new Element(12, "", runtimeHandler),
      "description",
    );
    const actualTimeField = new TimeField(12, "description", runtimeHandler);
    expect(actualTimeField).to.be.deep.equal(expectedTimeField);
  });

  it("should return element value", async () => {
    const timeField = new TimeField(23, "description", runtimeHandler);
    expect(await timeField.value()).to.be.equal("2018-07-22");
  });
});
