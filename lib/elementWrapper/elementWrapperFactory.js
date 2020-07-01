const ElementWrapper = require('./elementWrapper');
const FileFieldWrapper = require('./fileFieldWrapper');
const RadioButtonWrapper = require('./radioButtonWrapper');
const TextBoxWrapper = require('./textBoxWrapper');
const CheckBoxWrapper = require('./checkBoxWrapper');
const DropDownWrapper = require('./dropDownWrapper');
const ColorWrapper = require('./colorWrapper');
const RangeWrapper = require('./rangeWrapper');
const TimeFieldWrapper = require('./timeFieldWrapper');
const { prepareParameters, desc } = require('./helper');

const createElementWrapper = (elementType, query, attrValuePairs, _options, ...args) => {
  const { selector, options } = prepareParameters(attrValuePairs, _options, ...args);
  const description = desc(selector, query, elementType);
  switch (elementType) {
    case 'FileField':
      return new FileFieldWrapper(selector, options, description);
    // case 'textBox':
    //   return new TextBoxWrapper(get, description, getIfExists);
    // case 'radioButton':
    //   return new RadioButtonWrapper(get, description, getIfExists);
    case 'Checkbox':
      return new CheckBoxWrapper(selector, options, description);
    // case 'dropDown':
    //   return new DropDownWrapper(get, description, getIfExists);
    // case 'colorField':
    //   return new ColorWrapper(get, description, getIfExists);
    // case 'rangeType':
    //   return new RangeWrapper(get, description, getIfExists);
    // case 'timeField':
    //   return new TimeFieldWrapper(get, description, getIfExists);
    // default:
    //   return new ElementWrapper(get, description, getIfExists);
  }
};

module.exports = {
  createElementWrapper,
};
