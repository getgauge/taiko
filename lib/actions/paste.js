const { defaultConfig } = require('../config');
const runtimeHandler = require('../handlers/runtimeHandler');
const { highlightElement } = require('../elements/elementHelper');
const { isString, isElement, isSelector } = require('../helper');
const { doActionAwaitingNavigation } = require('../doActionAwaitingNavigation');
const { description, waitAndGetActionableElement, checksMap } = require('./pageActionChecks');
const Element = require('../elements/element');
const { focus } = require('./focus');
const { evaluate } = require('./../taiko');

const _paste = async (activeElement, text) => {
  if (defaultConfig.headful) {
    await highlightElement(new Element(activeElement.objectId, '', runtimeHandler));
  }
  await focus(activeElement);

  let option = { args: [ {text: text} ]}
  await evaluate(activeElement, (element) => { element.value = args[0].text }, option);
};

const paste = async (text, into, options) => {
  if (text == null || text == undefined) {
    console.warn(`Invalid text value ${text}, setting value to empty ''`);
    text = '';
  } else {
    if (!isString(text)) {
      text = text.toString();
    }
  }

  if (into && !isSelector(into) && !isElement(into) && !isString(into)) {
    options = into;
    into = undefined;
  }

  let desc, elems, elementDesc, selector;
  if (into) {
    const TextBoxWrapper = require('../elementWrapper/textBoxWrapper');
    selector = isString(into) ? new TextBoxWrapper(into) : into;
    elementDesc = description(selector, true);
  }
  elems = await waitAndGetActionableElement(selector, options.force, [checksMap.writable]);

  await doActionAwaitingNavigation(options, async () => {
    await _paste(elems, text);
  });

  const textDesc = (await elems.isPassword()) || options.hideText ? '*****' : text;
  desc = into
    ? `Pasted ${textDesc} into the ${elementDesc === '' ? 'focused element' : elementDesc}`
    : `Pasted ${textDesc} into the focused element.`;
  return desc;
};

module.exports = { paste };
