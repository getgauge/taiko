const fs = require('fs');
const path = require('path');
let projectRoot = null;

class Helper {
     
    /**
     * @return {string}
     */
    static projectRoot() {
      if (!projectRoot) {
        // Project root will be different for node6-transpiled code.
        projectRoot = fs.existsSync(path.join(__dirname, '..', 'package.json')) ? path.join(__dirname, '..') : path.join(__dirname, '..', '..');
      }
      return projectRoot;
    }
  
    static promisify(nodeFunction) {
      function promisified(...args) {
        return new Promise((resolve, reject) => {
          function callback(err, ...result) {
            if (err)
              return reject(err);
            if (result.length === 1)
              return resolve(result[0]);
            return resolve(result);
          }
          nodeFunction.call(null, ...args, callback);
        });
      }
      return promisified;
    }
  }

/**
 * @param {*} value
 * @param {string=} message
 */
function assert(value, message) {
    if (!value)
      throw new Error(message);
  }


  module.exports = {
    helper: Helper,
    assert
  };  