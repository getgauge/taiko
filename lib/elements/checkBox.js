const { setNavigationOptions } = require('../config');
const { descEvent } = require('../eventBus');
const Element = require('./element');
const { defaultConfig } = require('../config');
const { highlightElement } = require('./elementHelper');
const { doActionAwaitingNavigation } = require('../doActionAwaitingNavigation');

/**
 * Represents HTML [Input Checkbox](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox)
 * @extends {Element}
 * @see {CheckBoxWrapper} for methods available
 */
class CheckBox extends Element {
  async isChecked() {
    function getvalue() {
      return this.checked;
    }
    const options = { objectId: this.get() };
    const { result } = await this.runtimeHandler.runtimeCallFunctionOn(getvalue, null, options);
    var description = result.value
      ? this.description + 'is checked.'
      : this.description + 'is not checked.';
    descEvent.emit('success', description);
    return result.value;
  }
  async check() {
    const navigationOptions = setNavigationOptions({});
    await doActionAwaitingNavigation(navigationOptions, async () => {
      const objectId = this.get();
      if (defaultConfig.headful) {
        await highlightElement(this);
      }
      const options = { objectId: objectId, arg: true };
      await this.runtimeHandler.runtimeCallFunctionOn(setChecked, null, options);
      descEvent.emit('success', this.description + 'is checked');
    });
  }
  async uncheck() {
    const navigationOptions = setNavigationOptions({});
    await doActionAwaitingNavigation(navigationOptions, async () => {
      const objectId = this.get();
      if (defaultConfig.headful) {
        await highlightElement(this);
      }
      const options = { objectId: objectId, arg: false };
      await this.runtimeHandler.runtimeCallFunctionOn(setChecked, null, options);
      descEvent.emit('success', this.description + 'is unchecked');
    });
  }

  static from(element, description) {
    return new CheckBox(element.get(), description, element.runtimeHandler);
  }
}

function setChecked(value) {
  this.checked = value;
  let event = new Event('click');
  this.dispatchEvent(event);
}

module.exports = CheckBox;
