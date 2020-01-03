const ElementWrapper = require('./elementWrapper');
const FileFieldWrapper = require('./fileFieldWrapper');
const RadioButtonWrapper = require('./radioButtonWrapper');
const TextBoxWrapper = require('./textBoxWrapper');

const { xpath, isString, isElement, isSelector } = require('../helper');
const { RelativeSearchElement, handleRelativeSearch } = require('../proximityElementSearch');
const { $$xpath, getIfExists, isElementDisabled } = require('../elementSearch');

function hasProximitySelectors(values) {
  return values.selector.args.length > 0;
}

const prepareParameters = (attrValuePairs, options, ...args) => {
  if (options instanceof RelativeSearchElement) {
    args = [options].concat(args);
    options = {};
  }
  let values = {
    selector: { attrValuePairs: attrValuePairs, args: args },
  };
  if (attrValuePairs instanceof RelativeSearchElement) {
    args = [attrValuePairs].concat(args);
    values.selector = { args: args };
  } else if (isString(attrValuePairs) || isSelector(attrValuePairs) || isElement(attrValuePairs)) {
    values.selector = { label: attrValuePairs, args: args };
  }
  values.options = options || {};
  if (values.options.selectHiddenElement && hasProximitySelectors(values)) {
    console.warn(
      'WARNING: Proximity of hidden element are not available hence proximity selector will be ignored',
    );
  }
  return values;
};

const getQuery = (attrValuePairs, tag = '') => {
  let path = tag;
  for (const key in attrValuePairs) {
    if (key === 'class') {
      path += `[contains(@${key}, ${xpath(attrValuePairs[key])})]`;
    } else {
      path += `[@${key} = ${xpath(attrValuePairs[key])}]`;
    }
  }
  return path;
};

const getElementGetter = (selector, query, tags, selectHiddenElement) => {
  let get;
  if (selector.attrValuePairs) {
    let query = tags
      .split('|')
      .map(tag => getQuery(selector.attrValuePairs, tag))
      .join('|');
    get = async () =>
      await handleRelativeSearch(await $$xpath(query, selectHiddenElement), selector.args);
  } else if (selector.label) {
    get = async () => await handleRelativeSearch(await query(), selector.args);
  } else {
    get = async () =>
      await handleRelativeSearch(await $$xpath(tags, selectHiddenElement), selector.args);
  }
  return get;
};

const desc = (selector, query, tag) => {
  let description = '';
  if (selector.attrValuePairs) {
    description = getQuery(selector.attrValuePairs, tag);
  } else if (selector.label) {
    description = `${tag} with ${query} ${selector.label} `;
  }

  for (const arg of selector.args) {
    description += description === '' ? tag : ' and';
    description += ' ' + arg.toString();
  }

  return description;
};

const generateElementWrapper = function(get, description, customFuncs = {}) {
  return {
    get: async function(tag, retryInterval, retryTimeout) {
      console.warn('DEPRECATED use .elements()');
      return this.elements(tag, retryInterval, retryTimeout);
    },
    exists: async function(retryInterval, retryTimeout) {
      const elems = await this.elements(null, retryInterval, retryTimeout);
      if (elems.length < 1) {
        descEvent.emit('success', 'Does not exists');
        return false;
      }
      descEvent.emit('success', 'Exists');
      return true;
    },
    description,
    text: async function() {
      const elems = await this.elements();
      if (!elems[0]) {
        throw new Error(`${this.description} not found`);
      }
      return await elems[0].text();
    },
    isVisible: async function(retryInterval, retryTimeout) {
      const elems = await this.elements(null, retryInterval, retryTimeout);
      if (!elems[0]) {
        throw new Error(`${this.description} not found`);
      }
      if (await elems[0].isVisible()) {
        descEvent.emit('success', 'Element is Visible');
        return true;
      }
      return false;
    },
    elements: getIfExists(get, description, customFuncs),
    isDisabled: async function(retryInterval, retryTimeout) {
      const elems = await this.elements(null, retryInterval, retryTimeout);
      if (!elems[0]) {
        throw new Error(`${this.description} not found`);
      }
      const elemDisable = await isElementDisabled(elems[0].get());
      if (elemDisable === undefined) {
        throw new Error(`${this.description} does not have disable attribute`);
      } else {
        return elemDisable;
      }
    },
  };
};

const createElementWrapper = (get, description, elementType) => {
  let elementWrapper;
  switch (elementType) {
    case 'fileField':
      elementWrapper = FileFieldWrapper;
      break;
    case 'textBox':
      elementWrapper = TextBoxWrapper;
      break;
    case 'radioButton':
      elementWrapper = RadioButtonWrapper;
      break;
    default:
      elementWrapper = ElementWrapper;
  }
  return new elementWrapper(get, description, descEvent, getIfExists);
};

module.exports = {
  prepareParameters,
  getElementGetter,
  desc,
  generateElementWrapper,

  createElementWrapper,
};
