/**
 * Test description of a test function.
 *
 * @example
 * await functionReturningPromiseOfObject('https://google.com')
 *
 * @param {string} url - URL to navigate page to.
 *
 * @returns {Promise<Object>} - Description of the return
 */
async function functionReturningPromiseOfObject(url) {
  return new Promise(() => ({
    a: url,
  }));
}

module.exports.functionReturningPromiseOfObject = functionReturningPromiseOfObject;

/**
 * Test description of a test function.
 *
 * @example
 * await functionReturningPromise('https://google.com')
 *
 * @param {string} url - URL to navigate page to.
 *
 * @returns {Promise} - Description of the return
 */
async function functionReturningPromise(url) {
  return new Promise(() => ({
    a: url,
  }));
}

module.exports.functionReturningPromise = functionReturningPromise;
