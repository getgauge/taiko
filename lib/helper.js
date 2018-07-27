/**
 * Copyright 2018 Thoughtworks Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * This module is imported from Puppeteer(https://github.com/GoogleChrome/puppeteer)
 * Few modifications are done on the file.
 */

const fs = require('fs');
const path = require('path');
let projectRoot = null;

class Helper {

    /**
     * @return {string}
     */
    static projectRoot() {
        if (!projectRoot) {
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

const cartesian = (arg) => {
    var r = [], max = arg.length-1;
    function helper(arr, i) {
        for (var j=0, l=arg[i].length; j<l; j++) {
            var a = arr.slice(0);
            a.push(arg[i][j]);
            if (i==max)
                r.push(a);
            else
                helper(a, i+1);
        }
    }
    helper([], 0);
    return r;
};

module.exports = {
    helper: Helper,
    assert,
    cartesian
};