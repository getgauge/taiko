const keyDefinitions = require("../data/USKeyboardLayout");
const { defaultConfig } = require("../config");
const inputHandler = require("../handlers/inputHandler");
const runtimeHandler = require("../handlers/runtimeHandler");
const { highlightElement } = require("../elements/elementHelper");
const { isString, isElement, isSelector } = require("../helper");
const { doActionAwaitingNavigation } = require("../doActionAwaitingNavigation");
const {
  description,
  waitAndGetActionableElement,
  checksMap,
} = require("./pageActionChecks");
const Element = require("../elements/element");
const { focus } = require("./focus");

const _write = async (activeElement, text, options) => {
  if (defaultConfig.headful) {
    await highlightElement(
      new Element(activeElement.objectId, "", runtimeHandler),
    );
  }
  await focus(activeElement);
  for (const char of text) {
    if (keyDefinitions[char]) {
      await inputHandler.down(char);
      await inputHandler.up(char);
      if (options?.delay) {
        await new Promise((resolve) => {
          setTimeout(resolve, options.delay);
        });
      }
    } else {
      await inputHandler.sendCharacter(char);
    }
  }
};

const write = async (text, into, options) => {
  let input;
  if (text == null) {
    console.warn(`Invalid text value ${text}, setting value to empty ''`);
    input = "";
  } else {
    input = isString(text) ? text : text.toString();
  }

  let finalOptions = { ...options };
  let finalInto = into;

  if (into && !isSelector(into) && !isElement(into) && !isString(into)) {
    if (!into.delay) {
      finalOptions.delay = into.delay;
    }
    finalOptions = { ...into };
    finalInto = undefined;
  }

  let elementDesc;
  let selector;
  if (finalInto) {
    const TextBoxWrapper = require("../elementWrapper/textBoxWrapper");
    selector = isString(finalInto) ? new TextBoxWrapper(finalInto) : finalInto;
    elementDesc = description(selector, true);
  }
  const elems = await waitAndGetActionableElement(selector, finalOptions.force, [
    checksMap.writable,
  ]);

  await doActionAwaitingNavigation(finalOptions, async () => {
    await _write(elems, input, finalOptions);
  });

  const textDesc =
    (await elems.isPassword()) || finalOptions.hideText ? "*****" : input;
  const desc = finalInto
    ? `Wrote ${textDesc} into the ${elementDesc === "" ? "focused element" : elementDesc}`
    : `Wrote ${textDesc} into the focused element.`;
  return desc;
};

module.exports = { write };
