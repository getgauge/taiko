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
module.exports.functionReturningPromiseOfObject =
  functionReturningPromiseOfObject;

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

/**
 * Test description of a test function.
 *
 * @example
 * await functionReturningPromiseOfVoid('https://google.com')
 *
 * @param {string} url - URL to navigate page to.
 *
 * @returns {Promise<void>} - Description of the return
 */
async function functionReturningPromiseOfVoid(url) {
  return new Promise(() => ({
    a: url,
  }));
}
module.exports.functionReturningPromiseOfVoid = functionReturningPromiseOfVoid;

/**
 * Test description of a test function.
 *
 * @example
 * await functionReturningString('https://google.com')
 *
 * @param {string} url - URL to navigate page to.
 *
 * @returns {string} - Description of the return
 */
async function functionReturningString(url) {
  return new Promise(() => ({
    a: url,
  }));
}
module.exports.functionReturningString = functionReturningString;

/**
 * Test description of a test function.
 *
 * @example
 * await functionReturningArrayOfObjects('https://google.com')
 *
 * @param {string} url - URL to navigate page to.
 *
 * @returns {Object[]} - Description of the return
 */
async function functionReturningArrayOfObjects(url) {
  return new Promise(() => ({
    a: url,
  }));
}
module.exports.functionReturningArrayOfObjects =
  functionReturningArrayOfObjects;

/**
 * Test description of a test function.
 *
 * @example
 * await functionReturningPromiseOfArrayOfObjects('https://google.com')
 *
 * @param {string} url - URL to navigate page to.
 *
 * @returns {Promise<Object[]>} - Description of the return
 */
async function functionReturningPromiseOfArrayOfObjects(url) {
  return new Promise(() => ({
    a: url,
  }));
}
module.exports.functionReturningPromiseOfArrayOfObjects =
  functionReturningPromiseOfArrayOfObjects;
