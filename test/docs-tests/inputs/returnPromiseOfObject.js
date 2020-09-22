/**
 * Test description of a test function.
 *
 * @example
 * await functionReturningPromiseOfObject('https://google.com')
 *
 * @param {string} url - URL to navigate page to.
 *
 * @returns {Promise<Object>} response
 */
async function functionReturningPromiseOfObject(url) {
  return new Promise(() => ({
    a: url,
  }));
}

module.exports.goto = functionReturningPromiseOfObject;
