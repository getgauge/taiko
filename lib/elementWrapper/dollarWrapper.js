const { $$xpath, $$ } = require("../elementSearch");
const { isFunction } = require("../helper");
const runtimeHandler = require("../handlers/runtimeHandler");
const { handleRelativeSearch } = require("../proximityElementSearch");
const ElementWrapper = require("./elementWrapper");
const Element = require("../elements/element");

/**
 * Wrapper object of all found elements. This list mimics the behaviour of {@link Element}
 * by exposing similar methods. The call of these methods gets delegated to first element.
 * By default, the `ElementWrapper` acts as a proxy to the first matching element and hence
 * it forwards function calls that belong to {@link Element}
 *
 * {@link DollarWrapper} is identical to {@link ElementWrapper} except that it represents
 * the results of '{@link $} selector.
 * @extends {ElementWrapper}
 */

class DollarWrapper extends ElementWrapper {
  constructor(attrValuePairs, _options, ...args) {
    super("CustomSelector", "query", attrValuePairs, _options, ...args);
    this._get = async () => {
      function functionSelector(argument) {
        const { querySelector, args } = argument;
        const safeFunction = new Function(
          "args",
          `return (${querySelector})(args);`,
        );
        const queryResult = safeFunction(args);
        if (!(queryResult instanceof Node || queryResult instanceof NodeList)) {
          throw new Error(
            "Query function should return a DOM Node or DOM NodeList",
          );
        }
        return queryResult;
      }

      let element;
      if (isFunction(attrValuePairs)) {
        element = Element.create(
          await runtimeHandler.findElements(functionSelector, {
            querySelector: attrValuePairs.toString(),
            args: _options.args,
          }),
          runtimeHandler,
        );
      } else if (
        this.selector.label.startsWith("/") ||
        this.selector.label.startsWith("(")
      ) {
        element = await $$xpath(this.selector.label);
      } else {
        element = await $$(this.selector.label);
      }
      return await handleRelativeSearch(element, this.selector.args);
    };
  }
}
module.exports = DollarWrapper;
