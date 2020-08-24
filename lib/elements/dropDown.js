const { setNavigationOptions } = require('../config');
const { descEvent } = require('../eventBus');
const Element = require('./element');
const { defaultConfig } = require('../config');
const { highlightElement } = require('./elementHelper');
const { doActionAwaitingNavigation } = require('../doActionAwaitingNavigation');

/**
 * Represents HTML [Select](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select)
 * @extends {Element}
 * @see {DropDownWrapper} for methods available
 */
class DropDown extends Element {
  async select(value) {
    if (defaultConfig.headful) {
      await highlightElement(this);
    }

    function selectBox(value) {
      let found_value = {};
      let selectAndDispatchEvent = function (self, index) {
        self.selectedIndex = index;
        ['change', 'input'].forEach((ev) => {
          let event = new Event(ev, { bubbles: true });
          try {
            self.dispatchEvent(event);
          } catch (e) {
            return {
              error: `Error occurred while dispatching ${ev} event`,
              stack: e.stack,
            };
          }
        });
        return true;
      };

      if (!value) {
        found_value['isAvailable'] = false;
        return found_value;
      }

      if (this.options.length > value.index) {
        let ele = selectAndDispatchEvent(this, value.index);
        found_value['isAvailable'] = ele;
        return found_value;
      }

      for (var i = 0; i < this.options.length; i++) {
        let option = this.options[i];
        if (option.text === value || option.value === value) {
          if (option.disabled) {
            found_value['isDisabled'] = true;
            break;
          }
          let ele = selectAndDispatchEvent(this, i);
          found_value['isAvailable'] = ele;
          break;
        }
      }
      return found_value;
    }
    const options = setNavigationOptions({});

    // RegExp is not serialised. So loop through dropdown text and find a match
    // before invoking via CDP API
    let valueToSelect = value;
    if (value instanceof RegExp) {
      let options = await this.text();
      valueToSelect = await options.split('\n').find((option) => value.exec(option));
    }

    await doActionAwaitingNavigation(options, async () => {
      const { result } = await this.runtimeHandler.runtimeCallFunctionOn(selectBox, null, {
        objectId: this.get(),
        arg: valueToSelect,
        returnByValue: true,
      });
      const { stack, error } = result.value;
      if (stack) {
        throw new Error(error + '\n' + stack);
      }
      if (result.value.isDisabled) {
        throw new Error(`Cannot set value ${value} on a disabled field`);
      }
      if (!result.value.isAvailable) {
        throw new Error(`Option ${value} not available in drop down`);
      }
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
      objectId: this.get(),
    });
    return result.value;
  }
  static from(element, description) {
    return new DropDown(element.get(), description, element.runtimeHandler);
  }
}

module.exports = DropDown;
