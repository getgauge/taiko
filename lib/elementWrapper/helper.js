const { isString, isElement, isSelector } = require('../helper');
const { RelativeSearchElement, handleRelativeSearch } = require('../proximityElementSearch');
const { $$ } = require('../elementSearch');

const firstElement = async function (retryInterval, retryTimeout) {
  const elems = await this.elements(retryInterval, retryTimeout);
  if (elems.length < 1) {
    throw new Error(`${this.description} not found`);
  }
  return elems[0];
};

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
  if (values.options.selectHiddenElements && hasProximitySelectors(values)) {
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
      path += `[${key}~="${attrValuePairs[key]}"]`;
    } else {
      path += `[${key}="${attrValuePairs[key]}"]`;
    }
  }
  return path;
};

const getElementGetter = (selector, query, tags, selectHiddenElements) => {
  let get;
  if (selector.attrValuePairs) {
    let query = tags
      .split(',')
      .map((tag) => getQuery(selector.attrValuePairs, tag))
      .join(',');
    get = async () =>
      await handleRelativeSearch(await $$(query, selectHiddenElements), selector.args);
  } else if (selector.label) {
    get = async () => await handleRelativeSearch(await query(), selector.args);
  } else {
    get = async () =>
      await handleRelativeSearch(await $$(tags, selectHiddenElements), selector.args);
  }
  return get;
};

const desc = (selector, query, tag, options) => {
  let description = '';
  if (selector.attrValuePairs) {
    description = getQuery(selector.attrValuePairs, tag);
  } else if (selector.label) {
    description = `${tag} with ${query} ${selector.label} `;
  } else if (options.row && options.col) {
    description = `${tag} with ${query}`;
  }

  for (const arg of selector.args) {
    description += description === '' ? tag : ' and';
    description += ' ' + arg.toString();
  }

  return description;
};

function elementTypeToSelectorName(elementType) {
  switch (elementType) {
    case 'CustomSelector':
      return '$';
    case 'Checkbox':
      return 'checkBox';
    case 'Table':
      return 'tableCell';
    case 'Element':
      return 'text';
    default:
      return elementType.charAt(0).toLowerCase() + elementType.slice(1);
  }
}

module.exports = {
  prepareParameters,
  getElementGetter,
  desc,
  firstElement,
  elementTypeToSelectorName,
};
