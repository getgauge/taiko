const expect = require("chai").expect;
const Element = require("taiko/lib/elements/element");
const TextBox = require("taiko/lib/elements/textBox");
const nodes = {
  23: {
    value: "element value",
  },
  26: {
    innerText: "element text",
  },
};
describe("TextBox", () => {
  const runtimeHandler = {
    runtimeCallFunctionOn: (predicate, contextId, options) => {
      return {
        result: { value: predicate.call(nodes[options.objectId]) },
      };
    },
  };

  it("should be element", () => {
    expect(new TextBox() instanceof Element).to.be.true;
  });
  it("should create textBox from element", () => {
    const expectedTextBox = TextBox.from(
      new Element(12, "", runtimeHandler),
      "description",
    );
    const actualTextBox = new TextBox(12, "description", runtimeHandler);
    expect(actualTextBox).to.be.deep.equal(expectedTextBox);
  });

  it("should return element value", async () => {
    const textBox = new TextBox(23, "description", runtimeHandler);
    expect(await textBox.value()).to.be.equal("element value");
  });

  it("should return innerText as value", async () => {
    const textBox = new TextBox(26, "description", runtimeHandler);
    expect(await textBox.value()).to.be.equal("element text");
  });
});
