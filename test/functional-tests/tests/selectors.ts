import type { Table } from "gauge-ts";
import { $, button, link, text, textBox } from "taiko";

function getElementWithSelector(element: string, selector: string) {
  let selectedElement = null;
  // biome-ignore lint/suspicious/noImplicitAnyLet: let is used here to allow reassignment
  let selectedItem;
  try {
    selectedItem = JSON.parse(selector);
  } catch (err) {
    selectedItem = selector;
  }
  switch (element) {
    case "link":
      selectedElement = link(selectedItem);
      break;
    case "textBox":
      selectedElement = textBox(selectedItem);
      break;
    case "text":
      selectedElement = text(selectedItem);
      break;
    case "button":
      selectedElement = button(selectedItem);
      break;
    case "$":
      selectedElement = $(selectedItem);
      break;
  }
  return selectedElement;
}

export function getElements(table: Table) {
  const referenceElements = [];
  const headers = table.getColumnNames();
  for (const row of table.getTableRows()) {
    referenceElements.push(
      getElementWithSelector(row.getCell(headers[0]), row.getCell(headers[1])),
    );
  }
  return referenceElements;
}
