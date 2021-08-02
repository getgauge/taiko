const domHandler = require('./handlers/domHandler');
const { isElement } = require('./helper');

const handleRelativeSearch = async (elements, args) => {
  if (!args.length) {
    return elements;
  }
  if (!isRelativeSearch(args)) {
    throw new Error('Invalid arguments passed, only relativeSelectors are accepted');
  }
  const matchingNodes = await getMatchingNode(elements, args);
  return Array.from(matchingNodes, (node) => node.element);
};

const isRelativeSearch = (args) => args.every((a) => a instanceof RelativeSearchElement);

const getMatchingNode = async (elements, args) => {
  const matchingNodes = [];
  for (const element of elements) {
    if (!(await element.isVisible())) {
      continue;
    }
    const objectId = isElement(element) ? element.get() : element;
    let valid = true;
    let dist = 0;
    for (const arg of args) {
      const relativeNode = await arg.validNodes(objectId);
      if (relativeNode === undefined) {
        valid = false;
        break;
      }
      dist += relativeNode.dist;
    }
    if (valid) {
      matchingNodes.push({ element: element, dist: dist });
    }
  }
  matchingNodes.sort(function (a, b) {
    return a.dist - b.dist;
  });
  return matchingNodes;
};

class RelativeSearchElement {
  /**
   * @class
   * @ignore
   */
  constructor(condition, findProximityElementRects, desc) {
    this.condition = condition;
    this.findProximityElementRects = findProximityElementRects;
    this.desc = desc;
    this.calculatedRects = [];
  }

  async validNodes(objectId) {
    let matchingNode,
      minDiff = Infinity;
    this.calculatedRects = this.calculatedRects.length
      ? this.calculatedRects
      : await this.findProximityElementRects();

    for (const result of this.calculatedRects) {
      if (await this.condition(objectId, result.result)) {
        const diff = await domHandler.getPositionalDifference(objectId, result.elem);
        if (diff < minDiff) {
          minDiff = diff;
          matchingNode = { elem: result.elem, dist: diff };
        }
      }
    }
    return matchingNode;
  }

  toString() {
    return this.desc;
  }
}

module.exports = { handleRelativeSearch, RelativeSearchElement };
