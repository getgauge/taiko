'use strict';
const { button, link, textBox, text, $ } = require('taiko');

function getElementWithSelector(element, selector) {
  var selectedElement = null;
  var selectedItem;
  try {
    selectedItem = JSON.parse(selector);
  } catch (err) {
    selectedItem = selector;
  }
  switch (element) {
    case 'link':
      selectedElement = link(selectedItem);
      break;
    case 'textBox':
      selectedElement = textBox(selectedItem);
      break;
    case 'text':
      selectedElement = text(selectedItem);
      break;
    case 'button':
      selectedElement = button(selectedItem);
      break;
    case '$':
      selectedElement = $(selectedItem);
      break;
  }
  return selectedElement;
}

function getElements(table) {
  var referenceElements = [];
  table.rows.forEach(function(row) {
    referenceElements.push(getElementWithSelector(row.cells[0], row.cells[1]));
  });
  return referenceElements;
}

module.exports = {
  getElements,
};
