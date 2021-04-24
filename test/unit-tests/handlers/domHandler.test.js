const rewire = require('rewire');
const expect = require('chai').expect;

describe('domHandler', () => {
  let calledWith = {},
    domHandler;

  before(() => {
    domHandler = rewire('../../../lib/handlers/domHandler');
    calledWith = {};
    domHandler.__set__('dom', {
      getBoxModel: async (param) => {
        calledWith = param;
        if (param.objectId == 1) {
          return { model: { border: [0, 1, 2, 3, 4, 5, 6, 7] } };
        }
        return { model: { border: [8, 9, 10, 11, 12, 13, 14, 15] } };
      },
    });
  });

  after(() => {
    const createdSessionListener = domHandler.__get__('createdSessionListener');
    domHandler.__get__('eventHandler').removeListener('createdSession', createdSessionListener);
    domHandler = rewire('../../../lib/handlers/domHandler');
    domHandler.__get__('eventHandler').removeListener('createdSession', createdSessionListener);
  });

  it('.boundBox should give the bound  box of given node id', async () => {
    let box = await domHandler.boundBox(1);
    expect(calledWith).to.be.eql({ objectId: 1 });
    expect(box).to.be.eql({ height: 6, width: 6, x: 0, y: 1 });
  });

  it('.boundingBoxCenter should get the center of a box', async () => {
    let center = await domHandler.boundingBoxCenter(1);
    expect(calledWith).to.be.eql({ objectId: 1 });
    expect(center).to.be.eql({ x: 3, y: 4 });
  });

  it('.boundingBoxLeft should get the left of a box', async () => {
    let center = await domHandler.boundingBoxLeft(1);
    expect(calledWith).to.be.eql({ objectId: 1 });
    expect(center).to.be.eql({ x: 0, y: 4 });
  });

  it('.boundingBoxRight should get the right of a box', async () => {
    let center = await domHandler.boundingBoxRight(1);
    expect(calledWith).to.be.eql({ objectId: 1 });
    expect(center).to.be.eql({ x: 5, y: 4 });
  });

  it('.boundingBoxTopRight should get the right of a box', async () => {
    let center = await domHandler.boundingBoxTopRight(1);
    expect(calledWith).to.be.eql({ objectId: 1 });
    expect(center).to.be.eql({ x: 5, y: 1 });
  });

  it('.boundingBoxTopLeft should get the right of a box', async () => {
    let center = await domHandler.boundingBoxTopLeft(1);
    expect(calledWith).to.be.eql({ objectId: 1 });
    expect(center).to.be.eql({ x: 0, y: 1 });
  });

  it('.boundingBoxBottomLeft should get the right of a box', async () => {
    let center = await domHandler.boundingBoxBottomLeft(1);
    expect(calledWith).to.be.eql({ objectId: 1 });
    expect(center).to.be.eql({ x: 0, y: 6 });
  });

  it('.boundingBoxBottomRight should get the right of a box', async () => {
    let center = await domHandler.boundingBoxBottomRight(1);
    expect(calledWith).to.be.eql({ objectId: 1 });
    expect(center).to.be.eql({ x: 5, y: 6 });
  });

  it('.getBoundingClientRect should get the rectangle', async () => {
    let rect = await domHandler.getBoundingClientRect(1);
    expect(calledWith).to.be.eql({ objectId: 1 });
    expect(rect).to.be.eql({ bottom: 7, top: 1, left: 0, right: 6 });
  });

  it('.getPositionalDifference should get positional difference', async () => {
    let diff = await domHandler.getPositionalDifference(1, 2);
    expect(diff).to.be.eql(32);
  });

  it('.calculateNewCenter should calclulate new center', async () => {
    let center = await domHandler.calculateNewCenter(1, {
      up: 1,
      down: 2,
      left: 3,
      right: 4,
    });
    expect(center).to.be.eql({
      newBoundary: { bottom: 8, left: 1, right: 7, top: 2 },
      x: 4,
      y: 5,
    });
  });
});
