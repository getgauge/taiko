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
  let _text;
  if (text == null) {
    console.warn(`Invalid text value ${text}, setting value to empty ''`);
    _text = "";
  } else {
    _text = isString(text) ? text : text.toString();
  }

  let _options = { ...options };
  let _into = into;

  if (into && !isSelector(into) && !isElement(into) && !isString(into)) {
    if (!into.delay) {
      _options.delay = into.delay;
    }
    _options = { ...into };
    _into = undefined;
  }

  let elementDesc;
  let selector;
  if (_into) {
    const TextBoxWrapper = require("../elementWrapper/textBoxWrapper");
    selector = isString(_into) ? new TextBoxWrapper(_into) : _into;
    elementDesc = description(selector, true);
  }
  const elems = await waitAndGetActionableElement(
    selector,
    _options.force,
    [checksMap.writable],
  );

  await doActionAwaitingNavigation(_options, async () => {
    await _write(elems, _text, _options);
  });

  const textDesc =
    (await elems.isPassword()) || _options.hideText ? "*****" : _text;
  const desc = _into
    ? `Wrote ${textDesc} into the ${elementDesc === "" ? "focused element" : elementDesc}`
    : `Wrote ${textDesc} into the focused element.`;
  return desc;
};

module.exports = { write };
