const { $$xpath } = require("../elementSearch");
const { handleRelativeSearch } = require("../proximityElementSearch");
const { getElementGetter } = require("./helper");
const { xpath } = require("../helper");
const ElementWrapper = require("./elementWrapper");

/**
 * Behaves the same as ElementWrapper.
 * Represents HTML [`td`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td) tag.
 * @extends {ElementWrapper}
 */
class TableCellWrapper extends ElementWrapper {
  constructor(query, attrValuePairs, _options, ...args) {
    super("Table", query, attrValuePairs, _options, ...args);
    this.tableXPathFn = async (tableXPath) =>
      // the concat operation below is required to retain the HTML sematics
      // <tfoot> may appear before <tbody> but the browser renders it after <tbody>
      (
        await $$xpath(
          `${tableXPath}/tr[td][${this._options.row}]/td[${this._options.col}]`,
        )
      )
        .concat(
          await $$xpath(
            `${tableXPath}/tbody/tr[td][${this._options.row}]/td[${this._options.col}]`,
          ),
        )
        .concat(
          await $$xpath(
            `${tableXPath}/tfoot/tr[td][${this._options.row} - count(../../tbody/tr[td])]/td[${this._options.col}]`,
          ),
        );
    this._get = async () => {
      if (!this.selector.attrValuePairs && !this.selector.label) {
        if (!this._options.row || !this._options.col) {
          throw new Error("Table Row and Column Value required");
        }
        return (async () =>
          await handleRelativeSearch(
            await this.tableXPathFn("//table"),
            this.selector.args,
          ))();
      } else {
        const getTableCell = getElementGetter(
          this.selector,
          async () =>
            await this.tableXPathFn(`(//table[@id=${xpath(this.selector.label)}] |
            //table[caption=${xpath(this.selector.label)}] |
            //table[.//th[contains(translate(string(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'),${xpath(
              this.selector.label.toLowerCase(),
            )})]])`),
          "table td",
        );

        return getTableCell();
      }
    };
  }
}
module.exports = TableCellWrapper;
