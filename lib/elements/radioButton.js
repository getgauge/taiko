const { setNavigationOptions } = require('../config');
const { descEvent } = require('../eventBus');
const { Element } = require('./element');
const { defaultConfig } = require('../config');
const { highlightElement } = require('./elementHelper');

const {
  doActionAwaitingNavigation,
} = require('../doActionAwaitingNavigation');
class RadioButton extends Element {
  async isSelected() {
    function getvalue() {
      return this.checked;
    }
    const options = { nodeId: this.get() };
    const {
      result,
    } = await this.runtimeHandler.runtimeCallFunctionOn(
      getvalue,
      null,
      options,
    );
    var description = result.value
      ? this.description + 'is selected.'
      : this.description + 'is not selected.';
    descEvent.emit('success', description);
    return result.value;
  }
  async select() {
    const navigationOptions = setNavigationOptions({});
    await doActionAwaitingNavigation(navigationOptions, async () => {
      const nodeId = this.get();
      if (defaultConfig.headful) {
        await highlightElement(nodeId);
      }
      const options = { nodeId: nodeId, arg: true };
      await this.runtimeHandler.runtimeCallFunctionOn(
        setChecked,
        null,
        options,
      );
      descEvent.emit('success', this.description + 'is checked');
    });
  }
  async deselect() {
    const navigationOptions = setNavigationOptions({});
    await doActionAwaitingNavigation(navigationOptions, async () => {
      const nodeId = this.get();
      if (defaultConfig.headful) {
        await highlightElement(nodeId);
      }
      const options = { nodeId: nodeId, arg: false };
      await this.runtimeHandler.runtimeCallFunctionOn(
        setChecked,
        null,
        options,
      );
      descEvent.emit('success', this.description + 'is unchecked');
    });
  }

  static from(element, description) {
    return new RadioButton(
      element.get(),
      description,
      element.runtimeHandler,
    );
  }
}

function setChecked(value) {
  this.checked = value;
  let event = new Event('click');
  this.dispatchEvent(event);
}

module.exports = RadioButton;
