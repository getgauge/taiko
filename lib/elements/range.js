const { setNavigationOptions } = require('../config');
const { descEvent } = require('../eventBus');
const Element = require('./element');
const { defaultConfig } = require('../config');
const { highlightElement } = require('./elementHelper');

const { doActionAwaitingNavigation } = require('../doActionAwaitingNavigation');
class Range extends Element {
  async select(value) {
    if (!(parseFloat(value) === value)) {
      throw new Error('The range value should be Int or Float. Please pass a valid value.');
    }

    if (defaultConfig.headful) {
      await highlightElement(this);
    }

    function setRange(value) {
      this.value = value;
    }

    function getRangeValues() {
      let rangeValues = {};
      rangeValues['min'] = this.min;
      rangeValues['max'] = this.max;
      return rangeValues;
    }

    const { result } = await this.runtimeHandler.runtimeCallFunctionOn(getRangeValues, null, {
      nodeId: this.get(),
      arg: value,
      returnByValue: true,
    });

    if (value < result.value.min || value > result.value.max) {
      console.warn(
        `The value ${value} should be between the minimum range ${result.value.min} or maximum range ${result.value.max}`,
      );
    }
    const options = setNavigationOptions({});
    await doActionAwaitingNavigation(options, async () => {
      await this.runtimeHandler.runtimeCallFunctionOn(setRange, null, {
        nodeId: this.get(),
        arg: value,
        returnByValue: false,
      });
    });
    descEvent.emit('success', 'Selected ' + (value.index || value));
  }
  async value() {
    function getValue() {
      if (this.value) {
        return this.value;
      }
      return this.innerText;
    }
    const { result } = await this.runtimeHandler.runtimeCallFunctionOn(getValue, null, {
      nodeId: this.get(),
    });
    return result.value;
  }
  static from(element, description) {
    return new Range(element.get(), description, element.runtimeHandler);
  }
}

module.exports = Range;
