const expect = require("chai").expect;
const Element = require("../../../lib/elements/element");
const FileField = require("../../../lib/elements/fileField");
const nodes = {
  23: {
    value: "file-path.txt",
  },
};
describe("FileField", () => {
  const runtimeHandler = {
    runtimeCallFunctionOn: (predicate, contextId, options) => {
      return {
        result: { value: predicate.call(nodes[options.objectId]) },
      };
    },
  };

  it("should be element", () => {
    expect(new FileField() instanceof Element).to.be.true;
  });
  it("should create FileField from element", () => {
    const expectedFileField = FileField.from(
      new Element(12, "", runtimeHandler),
      "description",
    );
    const actualFileField = new FileField(12, "description", runtimeHandler);
    expect(actualFileField).to.be.deep.equal(expectedFileField);
  });

  it("should return element value", async () => {
    const fileField = new FileField(23, "description", runtimeHandler);
    expect(await fileField.value()).to.be.equal("file-path.txt");
  });
});
