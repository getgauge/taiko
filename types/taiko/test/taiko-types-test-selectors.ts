/* eslint-disable no-undef */
import { $, button, below, near, image, link, listItem } from '..';

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
