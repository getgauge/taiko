const expect = require('chai').expect;
const rewire = require('rewire');
const Element = require('../../../lib/elements/element');
const DropDown = rewire('../../../lib/elements/dropDown');

class Event {
  constructor(name, options) {
    this.name = name;
    this.options = options;
  }
}
DropDown.__set__('Event', Event);
DropDown.__set__(
  'doActionAwaitingNavigation',
  async (navigationOptions, action) => {
    await action();
  },
);
describe('DropDown', () => {
  let nodes,
    dispatchedEvent,
    runtimeHandler = {
      async runtimeCallFunctionOn(predicate, contextId, options) {
        return {
          result: {
            value: predicate.call(nodes[options.nodeId], options.arg),
          },
        };
      },
    };
  beforeEach(() => {
    dispatchedEvent = null;
    nodes = {
      25: {
        selectedIndex: 1,
        options: [
          { value: '25 value 0', text: '25 text 0' },
          { value: '25 value 1', text: '25 text 1' },
          { value: '25 value 2', text: '25 text 2' },
        ],
        dispatchEvent(event) {
          dispatchedEvent = event;
        },
      },
      26: {
        selectedIndex: 1,
        options: [
          { value: '26 value 0', text: '26 text 0' },
          { value: '26 value 1', text: '26 text 1' },
          { value: '26 value 2', text: '26 text 2' },
        ],
        dispatchEvent(event) {
          dispatchedEvent = event;
        },
      },
      27: {
        selectedIndex: 1,
        options: [
          { value: '27 value 0', text: '27 text 0' },
          { value: '27 value 1', text: '27 text 1' },
          { value: '27 value 2', text: '27 text 2' },
        ],
        dispatchEvent(event) {
          dispatchedEvent = event;
        },
      },
      28: {
        selectedIndex: 1,
        value: '28 value 2',
        options: [
          { value: '28 value 0', text: '28 text 0' },
          { value: '28 value 1', text: '28 text 1' },
          { value: '28 value 2', text: '28 text 2' },
        ],
        dispatchEvent(event) {
          dispatchedEvent = event;
        },
      },
    };
  });

  it('should be element', () => {
    expect(new DropDown() instanceof Element).to.be.true;
  });
  it('should create DropDown from element', () => {
    const expectedDropDown = DropDown.from(
      new Element(12, '', runtimeHandler),
      'description',
    );
    const actualDropDown = new DropDown(
      12,
      'description',
      runtimeHandler,
    );
    expect(actualDropDown).to.be.deep.equal(expectedDropDown);
  });
  describe('select', () => {
    it('should select dropdown item using index ', async () => {
      let nodeId = 25;
      const dropDown = new DropDown(
        nodeId,
        'description',
        runtimeHandler,
      );
      expect(nodes[nodeId].selectedIndex).to.be.equal(1);

      await dropDown.select({ index: 2 });
      expect(nodes[nodeId].selectedIndex).to.be.equal(2);
      expect(dispatchedEvent instanceof Event).to.be.true;
      expect(dispatchedEvent.name).to.be.equal('change');
      expect(dispatchedEvent.options).to.be.deep.equal({
        bubbles: true,
      });
    });

    it('select dropdown item using value', async () => {
      let nodeId = 26;
      const dropDown = new DropDown(
        nodeId,
        'description',
        runtimeHandler,
      );
      expect(nodes[nodeId].selectedIndex).to.be.equal(1);

      await dropDown.select('26 value 2');
      expect(nodes[nodeId].selectedIndex).to.be.equal(2);
      expect(dispatchedEvent instanceof Event).to.be.true;
      expect(dispatchedEvent.name).to.be.equal('change');
      expect(dispatchedEvent.options).to.be.deep.equal({
        bubbles: true,
      });
    });

    it('select dropdown item using text ', async () => {
      let nodeId = 27;
      const dropDown = new DropDown(
        nodeId,
        'description',
        runtimeHandler,
      );
      expect(nodes[nodeId].selectedIndex).to.be.equal(1);

      await dropDown.select('27 text 2');
      expect(nodes[nodeId].selectedIndex).to.be.equal(2);
      expect(dispatchedEvent instanceof Event).to.be.true;
      expect(dispatchedEvent.name).to.be.equal('change');
      expect(dispatchedEvent.options).to.be.deep.equal({
        bubbles: true,
      });
    });
  });

  describe('value', () => {
    it('should return value', async () => {
      let nodeId = 28;
      const dropDown = new DropDown(
        nodeId,
        'description',
        runtimeHandler,
      );
      expect(await dropDown.value()).to.be.equal('28 value 2');
    });
  });
});
