const { setNavigationOptions } = require('../config');
const { descEvent } = require('../eventBus');
const { Element } = require('./element');

const {
  doActionAwaitingNavigation,
} = require('../doActionAwaitingNavigation');
class RadioButton extends Element {
  async isSelected() {
    function getvalue() {
      return this.checked;
    }
    const {
      result,
    } = await this.runtimeHandler.runtimeCallFunctionOn(
      getvalue,
      null,
      { nodeId: this.get() },
    );
    var description = result.value
      ? this.description + 'is selected.'
      : this.description + 'is not selected.';
    descEvent.emit('success', description);
    return result.value;
  }
  async select() {
    const options = setNavigationOptions({});
    await doActionAwaitingNavigation(options, async () => {
      const nodeId = this.get();
      // if (defaultConfig.headful) {
      //   await highlightElemOnAction(nodeId);
      // }
      await this.runtimeHandler.runtimeCallFunctionOn(
        setChecked,
        null,
        {
          nodeId: nodeId,
          arg: true,
        },
      );
      descEvent.emit('success', this.description + 'is checked');
    });
  }
  async deselect() {
    const options = setNavigationOptions({});
    await doActionAwaitingNavigation(options, async () => {
      const nodeId = this.get();
      // if (defaultConfig.headful) {
      //   await highlightElemOnAction(nodeId);
      // }
      await this.runtimeHandler.runtimeCallFunctionOn(
        setChecked,
        null,
        {
          nodeId: nodeId,
          arg: false,
        },
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
