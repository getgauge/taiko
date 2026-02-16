const { setNavigationOptions } = require("../config");
const { descEvent } = require("../eventBus");
const Element = require("./element");
const { defaultConfig } = require("../config");
const { highlightElement } = require("./elementHelper");
const { doActionAwaitingNavigation } = require("../doActionAwaitingNavigation");
const { isRegex } = require("../helper");

class DropDown extends Element {
  async select(values) {
    if (defaultConfig.headful) {
      await highlightElement(this);
    }

    function selectBox(values) {
      const found_value = {};
      const selectAndDispatchEvent = (self, index) => {
        if (values.length === 1) {
          self.selectedIndex = index;
        } else {
          self[index].selected = true;
        }
        for (const ev of ["change", "input"]) {
          const event = new Event(ev, { bubbles: true });
          try {
            self.dispatchEvent(event);
          } catch (e) {
            return {
              error: `Error occurred while dispatching ${ev} event`,
              stack: e.stack,
            };
          }
        }
        return true;
      };

      if (!this.multiple && values.length > 1) {
        return {
          error: "Cannot select multiple values on a single select dropdown",
          stack: "",
        };
      }

      values.every((value) => {
        if (this.options.length > value && value != null) {
          if (this.options[value].disabled) {
            found_value[value] = { isDisabled: true };
            return false;
          }
          const ele = selectAndDispatchEvent(this, value);
          found_value[value] = { isAvailable: ele };
          return true;
        }
        if (!value) {
          if (Object.keys(found_value).length <= 0) {
            return false;
          }
          found_value[value] = { isAvailable: false };
          return false;
        }
        return true;
      });

      if (Object.keys(found_value).length > 0) {
        return found_value;
      }

      values.every((value) => {
        if (!value) {
          if (Object.keys(found_value).length <= 0) {
            return false;
          }
          found_value[value] = { isAvailable: false };
          return false;
        }
        let found = false;
        let disabled = false;
        for (let i = 0; i < this.options.length; i++) {
          const option = this.options[i];
          if (option.text === value || option.value === value) {
            found = true;
            if (option.disabled) {
              found_value[value] = { isDisabled: true };
              disabled = true;
              break;
            }
            const ele = selectAndDispatchEvent(this, i);
            found_value[value] = { isAvailable: ele };
            return true;
          }
        }
        if (disabled) {
          return false;
        }
        if (!found) {
          found_value[value] = { isAvailable: false };
          return false;
        }
        return true;
      });
      return found_value;
    }
    const options = setNavigationOptions({});

    // RegExp is not serialised. So loop through dropdown text and find a match
    // before invoking via CDP API

    let valuesToSelect = values;
    if (!Array.isArray(values)) {
      if (values && typeof values === "object" && "index" in values) {
        if (Array.isArray(values.index)) {
          valuesToSelect = values.index;
        } else {
          valuesToSelect = [values.index];
        }
      } else if (isRegex(values)) {
        const options = await this.text();
        valuesToSelect = await options
          .split("\n")
          .filter((option) => values.exec(option));
      } else {
        valuesToSelect = [values];
      }
    }

    await doActionAwaitingNavigation(options, async () => {
      const { result } = await this.runtimeHandler.runtimeCallFunctionOn(
        selectBox,
        null,
        {
          objectId: this.get(),
          arg: valuesToSelect,
          returnByValue: true,
        },
      );
      const { stack, error } = result.value;
      if (stack) {
        throw new Error(`${error}\n${stack}`);
      }
      if (error) {
        throw new Error(error);
      }
      const disabledValues = [];
      const unavailableValues = [];
      for (const key of Object.keys(result.value)) {
        if (result.value[key].isDisabled) {
          disabledValues.push(key);
        }
        if (!result.value[key].isAvailable) {
          unavailableValues.push(key);
        }
      }

      if (disabledValues.length > 0) {
        throw new Error(
          `Cannot set value ${disabledValues.join(",")} on a disabled field`,
        );
      }
      if (Object.keys(result.value).length === 0) {
        if (typeof values === "undefined") {
          throw new Error("Option undefined not available in drop down");
        }
        if (!values) {
          throw new Error(`Option ${values} not available in drop down`);
        }
        if ("index" in values) {
          throw new Error(
            `Option ${
              Array.isArray(values.index)
                ? values.index.join(",")
                : values.index
            } not available in drop down`,
          );
        }
        if (Array.isArray(values)) {
          throw new Error(
            `Option ${values
              .map((value) =>
                typeof value === "undefined"
                  ? "undefined"
                  : !value
                    ? "null"
                    : value,
              )
              .join(",")} not available in drop down`,
          );
        }
      } else if (unavailableValues.length > 0) {
        throw new Error(
          `Option ${unavailableValues.join(",")} not available in drop down`,
        );
      }
    });

    descEvent.emit("success", `Selected ${values.index || values}`);
  }

  async value() {
    function getValue() {
      const selectedValues = [];
      for (let index = 0; index < this.options.length; index++) {
        if (this.options[index].selected || this.selectedIndex === index) {
          if (this.options[index].value) {
            selectedValues.push(this.options[index].value);
          } else {
            selectedValues.push(this.options[index].innerText);
          }
        }
      }
      if (selectedValues.length <= 1) {
        return selectedValues.join(",");
      }
      return selectedValues;
    }
    const { result } = await this.runtimeHandler.runtimeCallFunctionOn(
      getValue,
      null,
      {
        objectId: this.get(),
        returnByValue: true,
      },
    );
    return result.value;
  }

  async options() {
    function getOptions() {
      const dropDownValues = [];
      for (let index = 0; index < this.options.length; index++) {
        dropDownValues.push(this.options[index].value);
      }
      return dropDownValues;
    }
    const { result } = await this.runtimeHandler.runtimeCallFunctionOn(
      getOptions,
      null,
      {
        objectId: this.get(),
        returnByValue: true,
      },
    );
    return result.value;
  }

  static from(element, description) {
    return new DropDown(element.get(), description, element.runtimeHandler);
  }
}

module.exports = DropDown;
