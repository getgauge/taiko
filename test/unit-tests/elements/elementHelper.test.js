const expect = require('chai').expect;
const sandbox = require('sinon').createSandbox();
const Element = require('../../../lib/elements/element');
const overlayHandler = require('../../../lib/handlers/overlayHandler');
const domHandler = require('../../../lib/handlers/domHandler');
const { highlightElement } = require('../../../lib/elements/elementHelper');
const { setConfig } = require('../../../lib/config');

describe('elementHelper', () => {
  let element, stubedIsVisible, stubedGetBoxModel, stubHighlightQuad, stubHideHighlight, stubedWarn;

  beforeEach(() => {
    stubedIsVisible = sandbox.stub(Element.prototype, 'isVisible');
    stubedGetBoxModel = sandbox.stub(domHandler, 'getBoxModel');
    stubHighlightQuad = sandbox.stub(overlayHandler, 'highlightQuad');
    stubHideHighlight = sandbox.stub(overlayHandler, 'hideHighlight');
    stubedWarn = sandbox.stub(console, 'warn');
    setConfig({ highlightOnAction: 'true' });
    element = new Element(23, '');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should highlight visible element', async () => {
    let border = [8, 45.96875, 246, 45.96875, 246, 63.96875, 8, 63.96875];
    stubedGetBoxModel.returns({ model: { border } });
    stubedIsVisible.returns(true);
    await highlightElement(element);

    expect(stubedGetBoxModel.callCount).to.be.equal(1);
    expect(stubHighlightQuad.callCount).to.be.equal(1);
    expect(stubHighlightQuad.getCall(0).args[0]).to.be.equal(border);
    expect(stubHideHighlight.callCount).to.be.equal(1);
    expect(stubedWarn.callCount).to.be.equal(0);
  });

  it('should not highlight when element is not visible', async () => {
    stubedIsVisible.returns(false);
    await highlightElement(element);

    expect(stubedGetBoxModel.callCount).to.be.equal(0);
    expect(stubHighlightQuad.callCount).to.be.equal(0);
    expect(stubHideHighlight.callCount).to.be.equal(0);
  });

  it('should not highlight when highlightOnAction is false', async () => {
    setConfig({ highlightOnAction: 'false' });
    stubedIsVisible.returns(true);
    await highlightElement(element);

    expect(stubedGetBoxModel.callCount).to.be.equal(0);
    expect(stubHighlightQuad.callCount).to.be.equal(0);
    expect(stubHideHighlight.callCount).to.be.equal(0);
  });

  it('should print warning when element is not visible', async () => {
    stubedIsVisible.returns(false);
    await highlightElement(element);

    expect(stubedWarn.callCount).to.be.equal(1);
    expect(stubedWarn.getCall(0).args).to.be.deep.equal([
      'WARNING: Taiko cannot highlight hidden elements.',
    ]);
  });
});
