const expect = require('chai').expect;
const Element = require('../../../lib/elements/element');
const FileField = require('../../../lib/elements/textBox');
const nodes = {
  23: {
    value: 'file-path.txt',
  },
};
describe('FileField', () => {
  let runtimeHandler = {
    runtimeCallFunctionOn: (predicate, contextId, options) => {
      return {
        result: { value: predicate.call(nodes[options.nodeId]) },
      };
    },
  };

  it('should be element', () => {
    expect(new FileField() instanceof Element).to.be.true;
  });
  it('should create textBox from element', () => {
    const expectedTextBox = FileField.from(
      new Element(12, '', runtimeHandler),
      'description',
    );
    const actualTextBox = new FileField(
      12,
      'description',
      runtimeHandler,
    );
    expect(actualTextBox).to.be.deep.equal(expectedTextBox);
  });

  it('should return element value', async () => {
    const textBox = new FileField(23, 'description', runtimeHandler);
    expect(await textBox.value()).to.be.equal('file-path.txt');
  });
});
