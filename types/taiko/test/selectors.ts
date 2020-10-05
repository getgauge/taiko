/* eslint-disable no-undef */
import {
  $,
  button,
  below,
  near,
  image,
  link,
  listItem,
  fileField,
  timeField,
  range,
  color,
  tableCell,
  above,
  textBox,
  text,
  dropDown,
  checkBox,
  radioButton,
} from '..';

// ------------------------------------------
// $
// https://docs.taiko.dev/api/$
// ------------------------------------------

$('//*[text()="text"]'); // $ExpectType DollarWrapper
$('//*[text()="text"]', { selectHiddenElements: true }); // $ExpectType DollarWrapper
$('#id', near('username'), below('login')); // $ExpectType DollarWrapper
$('#id', { selectHiddenElements: true }, near('username'), below('login')); // $ExpectType DollarWrapper

// ------------------------------------------
// image
// https://docs.taiko.dev/api/image
// ------------------------------------------
image('alt'); // $ExpectType ImageWrapper
image('alt', { selectHiddenElements: true }); // $ExpectType ImageWrapper
image({ id: 'imageId' }); // $ExpectType ImageWrapper
image({ id: 'imageId' }, below('text')); // $ExpectType ImageWrapper
image(below('text')); // $ExpectType ImageWrapper
image({ selectHiddenElements: true }, below('text')); // $ExpectType ImageWrapper
image({ id: 'imageId' }, { selectHiddenElements: true }, below('text')); // $ExpectType ImageWrapper

// ------------------------------------------
// link
// https://docs.taiko.dev/api/link
// ------------------------------------------
link('Get Started'); // $ExpectType LinkWrapper
link('Get Started', { selectHiddenElements: true }); // $ExpectType LinkWrapper
link({ id: 'linkId' }); // $ExpectType LinkWrapper
link({ id: 'linkId' }, below('text')); // $ExpectType LinkWrapper
link({ id: 'linkId' }, { selectHiddenElements: true }, below('text')); // $ExpectType LinkWrapper
link(below('text')); // $ExpectType LinkWrapper

// ------------------------------------------
// listitem
// https://docs.taiko.dev/api/listitem
// ------------------------------------------
listItem('Get Started'); // $ExpectType ListItemWrapper
listItem('Get Started', { selectHiddenElements: true }); // $ExpectType ListItemWrapper
listItem({ id: 'listId' }); // $ExpectType ListItemWrapper
listItem({ id: 'listItemId' }, below('text')); // $ExpectType ListItemWrapper
listItem(below('text')); // $ExpectType ListItemWrapper
listItem({ id: 'listItemId' }, { selectHiddenElements: true }, below('text')); // $ExpectType ListItemWrapper

// ------------------------------------------
// button
// https://docs.taiko.dev/api/button
// ------------------------------------------
button('Get Started'); // $ExpectType ButtonWrapper
button('Get Started', { selectHiddenElements: true }); // $ExpectType ButtonWrapper
button({ id: 'buttonId' }); // $ExpectType ButtonWrapper
button({ id: 'buttonId' }, below('text')); // $ExpectType ButtonWrapper
button(below('text')); // $ExpectType ButtonWrapper
button({ id: 'buttonId' }, { selectHiddenElements: true }, below('text')); // $ExpectType ButtonWrapper

// ------------------------------------------
// filefield
// https://docs.taiko.dev/api/filefield
// ------------------------------------------
fileField('Please select a file:'); // $ExpectType FileFieldWrapper
fileField('Please select a file:', { selectHiddenElements: true }); // $ExpectType FileFieldWrapper
fileField({ id: 'file' }); // $ExpectType FileFieldWrapper
fileField({ id: 'fileFieldId' }, below('text')); // $ExpectType FileFieldWrapper
fileField(below('text')); // $ExpectType FileFieldWrapper
fileField({ selectHiddenElements: true }, below('text')); // $ExpectType FileFieldWrapper
fileField({ id: 'fileFieldId' }, { selectHiddenElements: true }, below('text')); // $ExpectType FileFieldWrapper

// ------------------------------------------
// timefield
// https://docs.taiko.dev/api/timefield
// ------------------------------------------
timeField('Birthday:'); // $ExpectType TimeFieldWrapper
timeField('Birthday:', { selectHiddenElements: true }); // $ExpectType TimeFieldWrapper
timeField({ id: 'Birthday' }); // $ExpectType TimeFieldWrapper
timeField({ id: 'Birthday' }, below('text')); // $ExpectType TimeFieldWrapper
timeField(below('text')); // $ExpectType TimeFieldWrapper
timeField({ selectHiddenElements: true }, below('text')); // $ExpectType TimeFieldWrapper
timeField({ id: 'fileFieldId' }, { selectHiddenElements: true }, below('text')); // $ExpectType TimeFieldWrapper

// ------------------------------------------
// range
// https://docs.taiko.dev/api/range
// ------------------------------------------
range({ id: 'range-1' }); // $ExpectType RangeWrapper
range({ id: 'range-1' }, { selectHiddenElements: true }); // $ExpectType RangeWrapper
range({ id: 'range-1' }, below('head')); // $ExpectType RangeWrapper
range({ id: 'range-1' }, { selectHiddenElements: true }, below('head')); // $ExpectType RangeWrapper

// ------------------------------------------
// color
// https://docs.taiko.dev/api/color
// ------------------------------------------
color({ id: 'colorId' }); // $ExpectType ColorWrapper
color({ id: 'colorId' }, below('text')); // $ExpectType ColorWrapper
color(below('text')); // $ExpectType ColorWrapper
color(below('text')); // $ExpectType ColorWrapper
color({ id: 'colorId' }); // $ExpectType ColorWrapper
color({ id: 'colorId' }, { selectHiddenElements: true }, below('text')); // $ExpectType ColorWrapper

// ------------------------------------------
// tableCell
// https://docs.taiko.dev/api/tableCell
// ------------------------------------------
tableCell({ row: 1, col: 1 }, 'Table Caption'); // $ExpectType TableCellWrapper
tableCell({ id: 'myColumn' }); // $ExpectType TableCellWrapper
tableCell({ row: 1, col: 3 }); // $ExpectType TableCellWrapper
tableCell({ row: 4, col: 1 }, above('Code')); // $ExpectType TableCellWrapper
tableCell({ row: 4, col: 1, selectHiddenElements: true }, above('Code')); // $ExpectType TableCellWrapper

// ------------------------------------------
// textBox
// https://docs.taiko.dev/api/textBox
// ------------------------------------------
textBox('Username:'); // $ExpectType TextBoxWrapper
textBox('Username:', { id: 'textBoxId' }); // $ExpectError
textBox({ id: 'textBoxId' }, { selectHiddenElements: true }, below('text')); // $ExpectType TextBoxWrapper
textBox({ selectHiddenElements: true }, below('text')); // $ExpectType TextBoxWrapper

// ------------------------------------------
// dropDown
// https://docs.taiko.dev/api/dropDown
// ------------------------------------------
dropDown('Vehicle:'); // $ExpectType DropDownWrapper
dropDown({ id: 'dropDownId' }, below('text')); // $ExpectType DropDownWrapper
dropDown(below('text')); // $ExpectType DropDownWrapper
dropDown('Vehicle:', { selectHiddenElements: true }, below('text')); // $ExpectType DropDownWrapper

// ------------------------------------------
// checkBox
// https://docs.taiko.dev/api/checkBox
// ------------------------------------------
checkBox('Vehicle'); // $ExpectType CheckBoxWrapper
checkBox({ id: 'checkBoxId' }, below('text')); // $ExpectType CheckBoxWrapper
checkBox(below('text')); // $ExpectType CheckBoxWrapper
checkBox('Vehicle', { selectHiddenElements: true }, below('text')); // $ExpectType CheckBoxWrapper

// ------------------------------------------
// radioButton
// https://docs.taiko.dev/api/radioButton
// ------------------------------------------
radioButton('Vehicle'); // $ExpectType RadioButtonWrapper
radioButton({ id: 'radioButtonId' }, below('text')); // $ExpectType RadioButtonWrapper
radioButton(below('text')); // $ExpectType RadioButtonWrapper
radioButton('Vehicle', { selectHiddenElements: true }, below('text')); // $ExpectType RadioButtonWrapper

// ------------------------------------------
// text
// https://docs.taiko.dev/api/text
// ------------------------------------------
text('Vehicle'); // $ExpectType TextWrapper
text('Vehicle', below('text')); // $ExpectType TextWrapper
text('Vehicle', { exactMatch: true }, below('text')); // $ExpectType TextWrapper
text('Vehicle', { selectHiddenElements: true }); // $ExpectType TextWrapper
text('Vehicle', { selectHiddenElements: true }); // $ExpectType TextWrapper
text('/Vehicle/'); // $ExpectType TextWrapper
text(/Vehicle/); // $ExpectType TextWrapper
text(new RegExp('Vehicle')); // $ExpectType TextWrapper
