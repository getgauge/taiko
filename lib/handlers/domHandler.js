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
 * This module consists of functions imported from Puppeteer(https://github.com/GoogleChrome/puppeteer)
 */
const { eventHandler } = require('../eventBus');
const { isElement } = require('../helper');
const { defaultConfig } = require('../config');
let dom;

const createdSessionListener = (client) => {
  dom = client.DOM;
};
eventHandler.on('createdSession', createdSessionListener);

async function boundingBoxCenter(e) {
  const box = await assertBoundingBox(e);
  return {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  };
}

async function boundingBoxRight(e) {
  const box = await assertBoundingBox(e);
  return {
    x: box.x + Math.floor(box.width) - 1,
    y: box.y + box.height / 2,
  };
}

async function boundingBox(position = 'center', e) {
  switch (position) {
    case 'center':
      return await boundingBoxCenter(e);
    case 'topRight':
      return await boundingBoxTopRight(e);
    case 'topLeft':
      return await boundingBoxTopLeft(e);
    case 'bottomRight':
      return await boundingBoxBottomRight(e);
    case 'bottomLeft':
      return await boundingBoxBottomLeft(e);
    case 'left':
      return await boundingBoxLeft(e);
    case 'right':
      return await boundingBoxRight(e);
    default:
      console.warn(`Could not find position ${position}. Clicking at center position instead.`);
      return await boundingBoxCenter(e);
  }
}

async function boundingBoxTopLeft(e) {
  const box = await assertBoundingBox(e);
  return {
    x: box.x,
    y: box.y,
  };
}

async function boundingBoxTopRight(e) {
  const box = await assertBoundingBox(e);
  return {
    x: box.x + box.width - 1,
    y: box.y,
  };
}

async function boundingBoxBottomRight(e) {
  const box = await assertBoundingBox(e);
  return {
    x: box.x + box.width - 1,
    y: box.y + box.height - 1,
  };
}

async function boundingBoxBottomLeft(e) {
  const box = await assertBoundingBox(e);
  return {
    x: box.x,
    y: box.y + box.height - 1,
  };
}

async function boundingBoxLeft(e) {
  const box = await assertBoundingBox(e);
  return {
    x: box.x,
    y: box.y + box.height / 2,
  };
}

async function boundBox(e) {
  const result = await getBoxModel(e);

  if (!result) {
    return null;
  }
  const quad = result.model.border;
  const x = Math.min(quad[0], quad[2], quad[4], quad[6]);
  const y = Math.min(quad[1], quad[3], quad[5], quad[7]);
  const width = Math.max(quad[0], quad[2], quad[4], quad[6]) - x;
  const height = Math.max(quad[1], quad[3], quad[5], quad[7]) - y;

  return {
    x,
    y,
    width,
    height,
  };
}

async function assertBoundingBox(e) {
  const boundingBox = await boundBox(e);
  if (boundingBox) {
    return boundingBox;
  }

  throw new Error('Node is either not visible or not an HTMLElement');
}

async function getBoxModel(e) {
  let result;
  result = await dom
    .getBoxModel({
      objectId: isElement(e) ? e.objectId : e,
    });
  return result;
}

async function getBoundingClientRect(e) {
  const result = await getBoxModel(e);
  if (!result) {
    return null;
  }

  const quad = result.model.border;
  const top = Math.min(quad[1], quad[3], quad[5], quad[7]);
  const bottom = Math.max(quad[1], quad[3], quad[5], quad[7]);
  const left = Math.min(quad[0], quad[2], quad[4], quad[6]);
  const right = Math.max(quad[0], quad[2], quad[4], quad[6]);
  return { top, bottom, left, right };
}

const getPositionalDifference = async (nodeA, nodeB) => {
  const r = await getBoundingClientRect(nodeA);
  const v = await getBoundingClientRect(nodeB);
  const topDiff = Math.abs(r.top - v.top);
  const leftDiff = Math.abs(r.left - v.left);
  const bottomDiff = Math.abs(r.bottom - v.bottom);
  const rightDiff = Math.abs(r.right - v.right);
  return topDiff + leftDiff + bottomDiff + rightDiff;
};

const calculateNewCenter = async (sourceElemobjectId, destElem) => {
  const sourceBoundary = await getBoundingClientRect(sourceElemobjectId);
  let newBoundary = sourceBoundary;
  for (const key in destElem) {
    switch (key) {
      case 'up':
        newBoundary.top -= destElem[key];
        newBoundary.bottom -= destElem[key];
        break;
      case 'down':
        newBoundary.top += destElem[key];
        newBoundary.bottom += destElem[key];
        break;
      case 'left':
        newBoundary.right -= destElem[key];
        newBoundary.left -= destElem[key];
        break;
      case 'right':
        newBoundary.right += destElem[key];
        newBoundary.left += destElem[key];
        break;
      default:
        throw new Error('Invalid key for destination position');
    }
  }
  return {
    y: (newBoundary.top + newBoundary.bottom) / 2,
    x: (newBoundary.left + newBoundary.right) / 2,
    newBoundary: newBoundary,
  };
};

const setFileInputFiles = async (objectId, resolvedPath) => {
  await dom.setFileInputFiles({
    objectId,
    files: resolvedPath,
  });
};

module.exports = {
  boundBox,
  boundingBoxCenter,
  boundingBoxRight,
  boundingBox,
  boundingBoxLeft,
  getBoundingClientRect,
  boundingBoxTopRight,
  boundingBoxBottomRight,
  boundingBoxBottomLeft,
  boundingBoxTopLeft,
  getPositionalDifference,
  getBoxModel,
  calculateNewCenter,
  setFileInputFiles,
};
