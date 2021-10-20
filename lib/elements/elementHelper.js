const domHandler = require('../handlers/domHandler');
const { defaultConfig } = require('../config');
const overlayHandler = require('../handlers/overlayHandler');
const { wait } = require('../helper');

const highlightElement = async (element) => {
  if (defaultConfig.highlightOnAction.toLowerCase() !== 'true') {
    return;
  }
  if (await element.isVisible()) {
    let result = await domHandler.getBoxModel(element.get());
    await overlayHandler.highlightQuad(result.model.border);
    await wait(1000);
    await overlayHandler.hideHighlight();
  } else {
    console.warn('WARNING: Taiko cannot highlight hidden elements.');
  }
};

const setNativeValue = function (element, propName, value) {
  const { set: valueSetter } = Object.getOwnPropertyDescriptor(element, propName) || {};
  const prototype = Object.getPrototypeOf(element);
  const { set: prototypeValueSetter } = Object.getOwnPropertyDescriptor(prototype, propName) || {};
  if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(element, value);
  } else if (valueSetter) {
    valueSetter.call(element, value);
  } else {
    throw new Error('The given element does not have a value setter');
  }
};

module.exports = { highlightElement, setNativeValue };
