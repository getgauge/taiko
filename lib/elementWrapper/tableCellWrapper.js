const { $$xpath } = require('../elementSearch');
const { handleRelativeSearch } = require('../proximityElementSearch');
const { getElementGetter } = require('./helper');
const { xpath } = require('../helper');
const ElementWrapper = require('./elementWrapper');
class TableCellWrapper extends ElementWrapper {
  constructor(selector, options, description) {
    super(selector, options, description);
    this.tableXPathFn = async (tableXPath) =>
      // the concat operation below is required to retain the HTML sematics
      // <tfoot> may appear before <tbody> but the browser renders it after <tbody>
      (
        await $$xpath(
          `${tableXPath}/tr[td][${options.row}]/td[${options.col}]`,
          options.selectHiddenElements,
        )
      )
        .concat(
          await $$xpath(
            `${tableXPath}/tbody/tr[td][${options.row}]/td[${options.col}]`,
            options.selectHiddenElements,
          ),
        )
        .concat(
          await $$xpath(
            `${tableXPath}/tfoot/tr[td][${options.row} - count(../../tbody/tr[td])]/td[${options.col}]`,
            options.selectHiddenElements,
          ),
        );
    this._get = async () => {
      if (!selector.attrValuePairs && !selector.label) {
        if (!options.row || !options.col) {
          throw new Error('Table Row and Column Value required');
        }
        return (async () =>
          await handleRelativeSearch(await this.tableXPathFn('//table'), selector.args))();
      } else {
        const getTableCell = getElementGetter(
          selector,
          async () =>
            await this.tableXPathFn(`(//table[@id=${xpath(selector.label)}] |
            //table[caption=${xpath(selector.label)}] |
            //table[.//th[contains(translate(string(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'),${xpath(
              selector.label.toLowerCase(),
            )})]])`),
          'table td',
        );

        return getTableCell();
      }
    };
  }
}
module.exports = TableCellWrapper;
