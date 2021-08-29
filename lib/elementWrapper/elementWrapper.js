const { firstElement, desc, prepareParameters, elementTypeToSelectorName } = require('./helper');

const { descEvent } = require('../eventBus');
let { getIfExists } = require('../elementSearch');
const runtimeHandler = require('../handlers/runtimeHandler');

/**
 * Wrapper object of all found elements. This list mimics the behaviour of {@link Element}
 * by exposing similar methods. The call of these methods gets delegated to first element.
 * By default, the `ElementWrapper` acts as a proxy to the first matching element and hence
 * it forwards function calls that belong to {@link Element}
 */

class ElementWrapper {
  constructor(elementType, query, attrValuePairs, _options, ...args) {
    if (attrValuePairs instanceof ElementWrapper) {
      const selectorName = elementTypeToSelectorName(elementType);

      throw new TypeError(
        'You are passing a `ElementWrapper` to a `' +
          selectorName +
          '` selector. Refer https://docs.taiko.dev/api/' +
          selectorName.toLowerCase() +
          '/ for the correct parameters',
      );
    }

    const { selector, options } = prepareParameters(attrValuePairs, _options, ...args);
    this.selector = selector;
    this._options = options;
    this._description = desc(selector, query, elementType, options);
  }

  /**
   * @deprecated Deprecated from version `1.0.3`. DOM element getter. Implicitly wait for the element to appears with timeout of 10 seconds.
   * @param {number} retryInterval Retry Interval in milliseconds (defaults to global settings).
   * @param {number} retryTimeout Retry Timeout in milliseconds (defaults to global settings).
   * @returns {Element[]} All elements mathing the selector.
   */
  async get(retryInterval, retryTimeout) {
    console.warn('DEPRECATED use .elements()');
    return this.elements(retryInterval, retryTimeout);
  }

  /**
   * @property
   * @description Describes the operation performed. The description is the same that is printed when performing the operation in REPL.
   * @returns {string} Description of the current command that fetched this element(wrapper).
   * @example
   * link('google').description // prints "'Link with text google'"
   */
  get description() {
    return this._description;
  }

  /**
   * @description Checks existence for element. `exists()` waits for `retryTimeout` before deciding that the page is loaded.
   * (NOTE: `exists()` returns boolean from version `0.4.0`)
   * @since 0.4.0
   * @param {number} retryInterval Retry Interval in milliseconds (defaults to global settings).
   * @param {number} retryTimeout Retry Timeout in milliseconds (defaults to global settings).
   * @returns {boolean} true if exists, else false.
   * @example
   * // To 'short-circuit' non existence. However this should be done only if there is no network calls/reloads.
   * element.exists(0,0)
   * @example
   * link('google').exists()
   * @example
   * link('google').exists(1000)
   */
  async exists(retryInterval, retryTimeout) {
    try {
      await firstElement.apply(this, [retryInterval, retryTimeout]);
    } catch (e) {
      if (e.message === `${this._description} not found`) {
        descEvent.emit('success', 'Does not exist');
        return false;
      }
      throw e;
    }
    descEvent.emit('success', 'Exists');
    return true;
  }

  /**
   * @description Gets the [`innerText`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/innerText) of the element
   * @returns {string} [`innerText`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/innerText) of the element
   */
  async text() {
    const elem = await firstElement.apply(this);
    return await elem.text();
  }

  /**
   * @description Checks if element is visually visible. `isVisible()` is false when the element is overshadowed by another element,
   * or if the element is outside the viewport.
   * @param {number} retryInterval Retry Interval in milliseconds (defaults to global settings).
   * @param {number} retryTimeout Retry Timeout in milliseconds (defaults to global settings).
   * @returns {boolean} true if visible, else false.
   */
  async isVisible(retryInterval, retryTimeout) {
    const elem = await firstElement.apply(this, [retryInterval, retryTimeout]);

    async function isVisible() {
      const visibilityRatio = await new Promise((resolve) => {
        let elem = this;
        const observer = new IntersectionObserver((entries) => {
          resolve(entries[0].intersectionRatio);
          observer.disconnect();
        });
        observer.observe(elem);
      });
      return visibilityRatio === 1;
    }
    const objectId = elem.get();
    const { result } = await runtimeHandler.runtimeCallFunctionOn(isVisible, null, {
      objectId: objectId,
      awaitPromise: true,
    });
    if (result.value) {
      descEvent.emit('success', 'Element is Visible');
      return true;
    } else {
      descEvent.emit('success', 'Element is not Visible');
      return false;
    }
  }

  /**
   * @description Checks if element is disabled
   * @param {number} retryInterval Retry Interval in milliseconds (defaults to global settings).
   * @param {number} retryTimeout Retry Timeout in milliseconds (defaults to global settings).
   * @returns {boolean} true if disabled, else false.
   */
  async isDisabled(retryInterval, retryTimeout) {
    const elem = await firstElement.apply(this, [retryInterval, retryTimeout]);
    return await elem.isDisabled();
  }

  /**
   * @description Checks if element is [draggable](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/draggable).
   * @param {number} retryInterval Retry Interval in milliseconds (defaults to global settings).
   * @param {number} retryTimeout Retry Timeout in milliseconds (defaults to global settings).
   * @returns {boolean} true if disabled, else false.
   */

  async isDraggable(retryInterval, retryTimeout) {
    const elem = await firstElement.apply(this, [retryInterval, retryTimeout]);
    return await elem.isDraggable();
  }

  /**
   * @description Read attribute value of the element found.
   * @param {string} name
   * @returns {string} value of attribute
   * @example
   * link('google').attribute('alt')
   */
  async attribute(name) {
    const elem = await firstElement.apply(this);
    return await elem.getAttribute(name);
  }

  /**
   * @description DOM element getter. Implicitly wait for the element to appears with timeout of 10 seconds.
   * @param {number} retryInterval Retry Interval in milliseconds (defaults to global settings).
   * @param {number} retryTimeout Retry Timeout in milliseconds (defaults to global settings).
   * @returns {Element[]} Array of all elements matching the selector.
   * @example
   * // To loop over all the elements
   * let elements = await $('a').elements();
   * for (element of elements) {
   *    console.log(await element.text());
   * }
   * @example
   * textBox('username').value()
   * (await textBox('username').elements())[0].value() # same as above
   * @example
   * $('.class').text()
   * (await $('.class').elements())[0].text() # same as above
   * @example
   * let element = await $('a').element(0);
   * console.log(await element.text());
   */
  async elements(retryInterval, retryTimeout) {
    return await getIfExists(this._get, this._description)(null, retryInterval, retryTimeout);
  }

  /**
   * @description DOM element getter. Implicitly wait for the element to appears with timeout of 10 seconds.
   * @alias elements()[0]
   * @param {number} index Zero-based index of element to return
   * @param {number} retryInterval Retry Interval in milliseconds (defaults to global settings).
   * @param {number} retryTimeout Retry Timeout in milliseconds (defaults to global settings).
   * @returns {Element} First element that matches the selector.
   */
  async element(index, retryInterval, retryTimeout) {
    const results = await getIfExists(this._get, this._description)(
      null,
      retryInterval,
      retryTimeout,
    );
    if (index > results.length - 1) {
      throw new Error(`Element index is out of range. There are only ${results.length} element(s)`);
    }
    return results[index];
  }
}

module.exports = ElementWrapper;
