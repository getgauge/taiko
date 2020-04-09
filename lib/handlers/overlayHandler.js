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
let overlay;

eventHandler.on('createdSession', (client) => {
  overlay = client.Overlay;
});

const highlightQuad = async (quad, outlineColor = { r: 255, g: 0, b: 0 }) => {
  await overlay.highlightQuad({
    quad: quad,
    outlineColor,
  });
};
const highlightRect = async ({ x, y, width, height }, outlineColor = { r: 255, g: 0, b: 0 }) => {
  await overlay.highlightRect({
    x: x,
    y: y,
    width: width,
    height: height,
    outlineColor: outlineColor,
  });
};

const hideHighlight = async () => {
  await overlay.hideHighlight();
};
module.exports = {
  highlightQuad,
  hideHighlight,
  highlightRect,
};
