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
} from '..';

// ------------------------------------------
// $
// https://docs.taiko.dev/api/$
// ------------------------------------------

$('//*[text()="text"]'); // $ExpectType ElementWrapper
$('//*[text()="text"]', { selectHiddenElements: true }); // $ExpectType ElementWrapper
$('#id', near('username'), below('login')); // $ExpectType ElementWrapper
$('#id', { selectHiddenElements: true }, near('username'), below('login')); // $ExpectType ElementWrapper

// ------------------------------------------
// image
// https://docs.taiko.dev/api/image
// ------------------------------------------
image('alt'); // $ExpectType ElementWrapper
image('alt', { selectHiddenElements: true }); // $ExpectType ElementWrapper
image({ id: 'imageId' }); // $ExpectType ElementWrapper
image({ id: 'imageId' }, below('text')); // $ExpectType ElementWrapper
image(below('text')); // $ExpectType ElementWrapper
image({ selectHiddenElements: true }, below('text')); // $ExpectType ElementWrapper
image({ id: 'imageId' }, { selectHiddenElements: true }, below('text')); // $ExpectType ElementWrapper

// ------------------------------------------
// link
// https://docs.taiko.dev/api/link
// ------------------------------------------
link('Get Started'); // $ExpectType ElementWrapper
link('Get Started', { selectHiddenElements: true }); // $ExpectType ElementWrapper
link({ id: 'linkId' }); // $ExpectType ElementWrapper
link({ id: 'linkId' }, below('text')); // $ExpectType ElementWrapper
link({ id: 'linkId' }, { selectHiddenElements: true }, below('text')); // $ExpectType ElementWrapper
link(below('text')); // $ExpectType ElementWrapper

// ------------------------------------------
// listitem
// https://docs.taiko.dev/api/listitem
// ------------------------------------------
listItem('Get Started'); // $ExpectType ElementWrapper
listItem('Get Started', { selectHiddenElements: true }); // $ExpectType ElementWrapper
listItem({ id: 'listId' }); // $ExpectType ElementWrapper
listItem({ id: 'listItemId' }, below('text')); // $ExpectType ElementWrapper
listItem(below('text')); // $ExpectType ElementWrapper
listItem({ id: 'listItemId' }, { selectHiddenElements: true }, below('text')); // $ExpectType ElementWrapper

// ------------------------------------------
// button
// https://docs.taiko.dev/api/button
// ------------------------------------------
button('Get Started'); // $ExpectType ElementWrapper
button('Get Started', { selectHiddenElements: true }); // $ExpectType ElementWrapper
button({ id: 'buttonId' }); // $ExpectType ElementWrapper
button({ id: 'buttonId' }, below('text')); // $ExpectType ElementWrapper
button(below('text')); // $ExpectType ElementWrapper
button({ id: 'buttonId' }, { selectHiddenElements: true }, below('text')); // $ExpectType ElementWrapper

// ------------------------------------------
// filefield
// https://docs.taiko.dev/api/filefield
// ------------------------------------------
fileField('Please select a file:'); // $ExpectType ElementWrapper
fileField('Please select a file:', { selectHiddenElements: true }); // $ExpectType ElementWrapper
fileField({ id: 'file' }); // $ExpectType ElementWrapper
fileField({ id: 'fileFieldId' }, below('text')); // $ExpectType ElementWrapper
fileField(below('text')); // $ExpectType ElementWrapper
fileField({ selectHiddenElements: true }, below('text')); // $ExpectType ElementWrapper
fileField({ id: 'fileFieldId' }, { selectHiddenElements: true }, below('text')); // $ExpectType ElementWrapper

// ------------------------------------------
// timefield
// https://docs.taiko.dev/api/timefield
// ------------------------------------------
timeField('Birthday:'); // $ExpectType ElementWrapper
timeField('Birthday:', { selectHiddenElements: true }); // $ExpectType ElementWrapper
timeField({ id: 'Birthday' }); // $ExpectType ElementWrapper
timeField({ id: 'Birthday' }, below('text')); // $ExpectType ElementWrapper
timeField(below('text')); // $ExpectType ElementWrapper
timeField({ selectHiddenElements: true }, below('text')); // $ExpectType ElementWrapper
timeField({ id: 'fileFieldId' }, { selectHiddenElements: true }, below('text')); // $ExpectType ElementWrapper

// ------------------------------------------
// range
// https://docs.taiko.dev/api/range
// ------------------------------------------
range({ id: 'range-1' }); // $ExpectType ElementWrapper
range({ id: 'range-1' }, { selectHiddenElements: true }); // $ExpectType ElementWrapper
range({ id: 'range-1' }, below('head')); // $ExpectType ElementWrapper
range({ id: 'range-1' }, { selectHiddenElements: true }, below('head')); // $ExpectType ElementWrapper

// ------------------------------------------
// color
// https://docs.taiko.dev/api/color
// ------------------------------------------
color({ id: 'colorId' }); // $ExpectType ElementWrapper
color({ id: 'colorId' }, below('text')); // $ExpectType ElementWrapper
color(below('text')); // $ExpectType ElementWrapper
color(below('text')); // $ExpectType ElementWrapper
color({ id: 'colorId' }); // $ExpectType ElementWrapper
color({ id: 'colorId' }, { selectHiddenElements: true }, below('text')); // $ExpectType ElementWrapper

// ------------------------------------------
// tableCell
// https://docs.taiko.dev/api/tableCell
// ------------------------------------------
tableCell({ row: 1, col: 1 }, 'Table Caption'); // $ExpectType ElementWrapper
tableCell({ id: 'myColumn' }); // $ExpectType ElementWrapper
tableCell({ row: 1, col: 3 }); // $ExpectType ElementWrapper
tableCell({ row: 4, col: 1 }, above('Code')); // $ExpectType ElementWrapper
tableCell({ row: 4, col: 1, selectHiddenElements: true }, above('Code')); // $ExpectType ElementWrapper

// ------------------------------------------
// textBox
// https://docs.taiko.dev/api/textBox
// ------------------------------------------
textBox('Username:'); // $ExpectType ElementWrapper
textBox('Username:', { id: 'textBoxId' }); // $ExpectError
textBox({ id: 'textBoxId' }, { selectHiddenElements: true }, below('text')); // $ExpectType ElementWrapper
textBox({ selectHiddenElements: true }, below('text')); // $ExpectType ElementWrapper
