const ElementWrapper = require('./elementWrapper');
const FileFieldWrapper = require('./fileFieldWrapper');
const ButtonWrapper = require('./buttonWrapper');
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
    case 'Button':
      return new ButtonWrapper(selector, options, description);
    case 'TextBox':
      return new TextBoxWrapper(selector, options, description);
    case 'RadioButton':
      return new RadioButtonWrapper(selector, options, description);
    case 'Checkbox':
      return new CheckBoxWrapper(selector, options, description);
    case 'DropDown':
      return new DropDownWrapper(selector, options, description);
    case 'ColorField':
      return new ColorWrapper(selector, options, description);
    case 'RangeType':
      return new RangeWrapper(selector, options, description);
    // case 'timeField':
    //   return new TimeFieldWrapper(get, description, getIfExists);
    // default:
    //   return new ElementWrapper(get, description, getIfExists);
  }
};

module.exports = {
  createElementWrapper,
};
