const { $$, $function } = require('../elementSearch');
const { handleRelativeSearch } = require('../proximityElementSearch');
const { getElementGetter } = require('./helper');
const ElementWrapper = require('./elementWrapper');

function getTableCellElements(arg) {
  let tableCells = [];
  let matchingTables = [...document.querySelectorAll('table')].filter((table) => {
    const captions = [...table.querySelectorAll('caption')].filter((caption) => {
      return caption.innerText.toLowerCase().includes(arg.label.toLowerCase());
    });
    return captions.length;
  });
  matchingTables = [...document.querySelectorAll('table')]
    .filter((table) => {
      const headers = [...table.querySelectorAll('th')].filter((header) => {
        return header.innerText.toLowerCase().includes(arg.label.toLowerCase());
      });
      return headers.length;
    })
    .concat(matchingTables);
  for (let matchingTable of matchingTables) {
    let tableCell;
    if (arg.row > matchingTable.querySelectorAll('tbody tr').length) {
      tableCell = [
        ...matchingTable.querySelectorAll(`tfoot tr:nth-child(1) td:nth-child(${arg.col})`),
      ];
    } else {
      tableCell = [
        ...matchingTable.querySelectorAll(
          `tbody tr:nth-child(${arg.row}) td:nth-child(${arg.col})`,
        ),
      ];
    }
    if (!tableCell.length) {
      tableCell = [
        ...matchingTable.querySelectorAll(`tr:nth-child(${arg.row}) td:nth-child(${arg.col})`),
      ];
    }
    tableCells = tableCells.concat(tableCell);
  }

  return tableCells;
}

class TableCellWrapper extends ElementWrapper {
  _get = async () => {
    if (!this.selector.attrValuePairs && !this.selector.label) {
      if (!this.options.row || !this.options.col) {
        throw new Error('Table Row and Column Value required');
      }
      return await (async () => {
        return await handleRelativeSearch(
          await $$(
            `table tbody tr:nth-child(${this.options.row}) td:nth-child(${this.options.col})`,
            this.options.selectHiddenElements,
          ),
          this.selector.args,
        );
      })();
    } else {
      return await getElementGetter(
        this.selector,
        async () =>
          await $function(
            getTableCellElements,
            { label: this.selector.label, row: this.options.row, col: this.options.col },
            this.options.selectHiddenElements,
          ),
        'table td',
      )();
    }
  };
}
module.exports = TableCellWrapper;
