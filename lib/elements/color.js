const { setNavigationOptions } = require('../config');
const { descEvent } = require('../eventBus');
const Element = require('./element');
const { defaultConfig } = require('../config');
const { highlightElement } = require('./elementHelper');
const { convertFullRGBToHex, isValidColor, isRgb } = require('./colorFinder');
const { doActionAwaitingNavigation } = require('../doActionAwaitingNavigation');

/**
 * Represents HTML [Input Color](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/color)
 * @extends {Element}
 * @see {ColorWrapper} for methods available
 */
class Color extends Element {
  async select(value) {
    if (!isValidColor(value)) {
      throw new Error(`The color code ${value} is invalid. Please pass a valid HTML color code.`);
    }
    if (isRgb(value)) {
      value = convertFullRGBToHex(value);
    }
    if (defaultConfig.headful) {
      await highlightElement(this);
    }

    function setColor(value) {
      return (this.value = value);
    }
    const options = setNavigationOptions({});
    value.charAt(0) !== '#' ? (value = '#'.concat(value)) : value;

    await doActionAwaitingNavigation(options, async () => {
      const { result } = await this.runtimeHandler.runtimeCallFunctionOn(setColor, null, {
        objectId: this.get(),
        arg: value,
        returnByValue: true,
      });
      const { stack, error } = result.value;
      if (stack) {
        throw new Error(error + '\n' + stack);
      }
    });
    descEvent.emit('success', 'Selected ' + (value.index || value));
  }
  async value() {
    function getValue() {
      return this.value;
    }
    const { result } = await this.runtimeHandler.runtimeCallFunctionOn(getValue, null, {
      objectId: this.get(),
    });
    return result.value;
  }
  static from(element, description) {
    return new Color(element.get(), description, element.runtimeHandler);
  }
}

module.exports = Color;
