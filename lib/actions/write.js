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
      if (options && options.delay) {
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
  if (text == null || text == undefined) {
    console.warn(`Invalid text value ${text}, setting value to empty ''`);
    text = "";
  } else {
    if (!isString(text)) {
      text = text.toString();
    }
  }

  if (into && !isSelector(into) && !isElement(into) && !isString(into)) {
    if (!into.delay) {
      into.delay = options.delay;
    }
    options = into;
    into = undefined;
  }

  let desc, elems, elementDesc, selector;
  if (into) {
    const TextBoxWrapper = require("../elementWrapper/textBoxWrapper");
    selector = isString(into) ? new TextBoxWrapper(into) : into;
    elementDesc = description(selector, true);
  }
  elems = await waitAndGetActionableElement(selector, options.force, [
    checksMap.writable,
  ]);

  await doActionAwaitingNavigation(options, async () => {
    await _write(elems, text, options);
  });

  const textDesc =
    (await elems.isPassword()) || options.hideText ? "*****" : text;
  desc = into
    ? `Wrote ${textDesc} into the ${elementDesc === "" ? "focused element" : elementDesc}`
    : `Wrote ${textDesc} into the focused element.`;
  return desc;
};

module.exports = { write };
