const { setNavigationOptions } = require("../config");
const { descEvent } = require("../eventBus");
const Element = require("./element");
const { defaultConfig } = require("../config");
const { highlightElement } = require("./elementHelper");
const { convertFullRGBToHex, isValidColor, isRgb } = require("./colorFinder");
const { doActionAwaitingNavigation } = require("../doActionAwaitingNavigation");

class Color extends Element {
  async select(value) {
    if (!isValidColor(value)) {
      throw new Error(
        `The color code ${value} is invalid. Please pass a valid HTML color code.`,
      );
    }
    let hexValue = value;
    if (isRgb(value)) {
      hexValue = convertFullRGBToHex(value);
    }
    if (defaultConfig.headful) {
      await highlightElement(this);
    }

    function setColor(value) {
      this.value = value;
      return this.value;
    }

    const options = setNavigationOptions({});

    if (hexValue.charAt(0) !== "#") {
      hexValue = "#".concat(hexValue);
    }

    await doActionAwaitingNavigation(options, async () => {
      const { result } = await this.runtimeHandler.runtimeCallFunctionOn(
        setColor,
        null,
        {
          objectId: this.get(),
          arg: hexValue,
          returnByValue: true,
        },
      );
      const { stack, error } = result.value;
      if (stack) {
        throw new Error(`${error}\n${stack}`);
      }
    });
    descEvent.emit("success", `Selected ${hexValue.index || hexValue}`);
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
    return new Color(element.get(), description, element.runtimeHandler);
  }
}

module.exports = Color;
