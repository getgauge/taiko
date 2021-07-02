const runtimeHandler = require('../handlers/runtimeHandler');
const { findFirstElement } = require('../elementSearch');
const { defaultConfig, setNavigationOptions } = require('../config');
const { highlightElement } = require('../elements/elementHelper');
const { doActionAwaitingNavigation } = require('../doActionAwaitingNavigation');

const scrollToElement = async (element, alignment) => {
  function scrollToNode() {
    const element = this.nodeType === Node.TEXT_NODE ? this.parentElement : this;
    element.scrollIntoView(alignment);
    return 'result';
  }
  await runtimeHandler.runtimeCallFunctionOn(scrollToNode, null, { objectId: element.get() });
};

const scroll = async (e, px, scrollPage, scrollElement, direction) => {
  e = e || 100;
  if (Number.isInteger(e)) {
    const res = await runtimeHandler.runtimeEvaluate(
      `(${scrollPage}).apply(null, ${JSON.stringify([e])})`,
    );
    if (res.result.subtype == 'error') {
      throw new Error(res.result.description);
    }
    return {
      description: `Scrolled ${direction} the page by ${e} pixels`,
    };
  }

  const element = await findFirstElement(e);
  if (defaultConfig.headful) {
    await highlightElement(element);
  }
  //TODO: Allow user to set options for scroll
  const options = setNavigationOptions({});
  await doActionAwaitingNavigation(options, async () => {
    const res = await runtimeHandler.runtimeCallFunctionOn(scrollElement, null, {
      objectId: element.get(),
      arg: px,
    });
    if (res.result.subtype == 'error') {
      throw new Error(res.result.description);
    }
  });
  const { description } = require('./pageActionChecks');
  return 'Scrolled ' + direction + description(e, true) + 'by ' + px + ' pixels';
};

module.exports = { scrollToElement, scroll };
