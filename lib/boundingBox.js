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

async function boundingBoxCenter(dom, e) {
    const box = await assertBoundingBox(dom, e);
    return {
        x: box.x + box.width / 2,
        y: box.y + box.height / 2
    };
}

async function boundBox(dom, e) {
    const result = await getBoxModel(dom, e);

    if (!result)
        return null;
    const quad = result.model.border;
    const x = Math.min(quad[0], quad[2], quad[4], quad[6]);
    const y = Math.min(quad[1], quad[3], quad[5], quad[7]);
    const width = Math.max(quad[0], quad[2], quad[4], quad[6]) - x;
    const height = Math.max(quad[1], quad[3], quad[5], quad[7]) - y;

    return {
        x,
        y,
        width,
        height
    };
}

async function assertBoundingBox(dom, e) {
    const boundingBox = await boundBox(dom, e);
    if (boundingBox)
        return boundingBox;

    throw new Error('Node is either not visible or not an HTMLElement');
}

async function getBoxModel(dom, e) {
    return await dom.getBoxModel({
        nodeId: e
    }).catch();
}

async function getBoundingClientRect(dom, e) {
    const result = await getBoxModel(dom, e);
    if (!result)
        return null;

    const quad = result.model.border;
    const top = Math.min(quad[1], quad[3], quad[5], quad[7]);
    const bottom = Math.max(quad[1], quad[3], quad[5], quad[7]);
    const left = Math.min(quad[0], quad[2], quad[4], quad[6]);
    const right = Math.max(quad[0], quad[2], quad[4], quad[6]);
    return { top, bottom, left, right };
}


const getPositionalDifference = async (dom, nodeA, nodeB) => {
    const r = await getBoundingClientRect(dom, nodeA);
    const v = await getBoundingClientRect(dom, nodeB);
    const topDiff = Math.abs(r.top - v.top);
    const leftDiff = Math.abs(r.left - v.left);
    const bottomDiff = Math.abs(r.bottom - v.bottom);
    const rightDiff = Math.abs(r.bottom - v.bottom);
    return (topDiff + leftDiff + bottomDiff + rightDiff);
};


module.exports = { boundingBoxCenter, getBoundingClientRect, getPositionalDifference, getBoxModel };