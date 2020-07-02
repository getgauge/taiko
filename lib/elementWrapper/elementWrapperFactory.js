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
const DollarWrapper = require('./dollarWrapper');
const ImageWrapper = require('./imageWrapper');
const LinkWrapper = require('./linkWrapper');
const ListItemWrapper = require('./listItemWrapper');
const { prepareParameters, desc } = require('./helper');

const createElementWrapper = (elementType, query, attrValuePairs, _options, ...args) => {
  const { selector, options } = prepareParameters(attrValuePairs, _options, ...args);
  const description = desc(selector, query, elementType);
  switch (elementType) {
    case 'CustomSelector':
      return new DollarWrapper(selector, options, description);
    case 'Image':
      return new ImageWrapper(selector, options, description);
    case 'Link':
      return new LinkWrapper(selector, options, description);
    case 'ListItem':
      return new ListItemWrapper(selector, options, description);
    case 'Text':
      return new TextBoxWrapper(selector, options, description);
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
    case 'TimeField':
      return new TimeFieldWrapper(selector, options, description);
    default:
      return new ElementWrapper(selector, options, description);
  }
};

module.exports = {
  createElementWrapper,
};
