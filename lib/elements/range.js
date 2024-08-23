const { setNavigationOptions } = require("../config");
const { descEvent } = require("../eventBus");
const Element = require("./element");
const { defaultConfig } = require("../config");
const { highlightElement } = require("./elementHelper");
const { doActionAwaitingNavigation } = require("../doActionAwaitingNavigation");

class Range extends Element {
  async select(value) {
    function getRange() {
      const range = {};
      range.min = this.min || 0;
      range.max = this.max || 100;
      return range;
    }

    const range = await this.runtimeHandler.runtimeCallFunctionOn(
      getRange,
      null,
      {
        objectId: this.get(),
        arg: value,
        returnByValue: true,
      },
    );

    if (Number.isNaN(Number.parseFloat(value))) {
      throw new Error(
        `The value ${value} is not between the input's range of ${range.result.value.min}-${range.result.value.max}`,
      );
    }

    if (defaultConfig.headful) {
      await highlightElement(this);
    }

    function setRange(value) {
      this.setNativeValue(this, "value", value);

      const rangeValues = {};
      rangeValues.min = this.min || 0;
      rangeValues.max = this.max || 100;
      rangeValues.current = this.value;

      const selectAndDispatchEvent = (self, value) => {
        self.setNativeValue(self, "value", value);
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

      selectAndDispatchEvent(this, this.value);
      return rangeValues;
    }

    await this.registerNativeValueSetter();
    const options = setNavigationOptions({});
    let result;
    await doActionAwaitingNavigation(options, async () => {
      ({ result } = await this.runtimeHandler.runtimeCallFunctionOn(
        setRange,
        null,
        {
          objectId: this.get(),
          arg: value,
          returnByValue: true,
        },
      ));
      if (value < result.value.min || value > result.value.max) {
        console.warn(
          `The value ${value} is not between the input's range of ${range.result.value.min}-${range.result.value.max}`,
        );
      }
    });
    descEvent.emit(
      "success",
      `Selected value ${result.value.current} for the given input value ${value}`,
    );
  }

  async value() {
    function getValue() {
      return this.value;
    }
    const { result } = await this.runtimeHandler.runtimeCallFunctionOn(
      getValue,
      null,
      {
        objectId: this.get(),
      },
    );
    return result.value;
  }
  static from(element, description) {
    return new Range(element.get(), description, element.runtimeHandler);
  }
}

module.exports = Range;
