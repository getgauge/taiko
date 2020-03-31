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

const keyDefinitions = require('../data/USKeyboardLayout');
const { eventHandler } = require('../eventBus');
const { assert } = require('../helper');
let input;
let _modifiers = 0;
let _pressedKeys = new Set();

eventHandler.on('createdSession', (client) => {
  input = client.Input;
});

const _down = async (key, options = { text: undefined }) => {
  const description = _keyDescriptionForString(key);

  const autoRepeat = _pressedKeys.has(description.code);
  _pressedKeys.add(description.code);
  _modifiers |= _modifierBit(description.key);

  const text = options.text === undefined ? description.text : options.text;
  await input.dispatchKeyEvent({
    type: text ? 'keyDown' : 'rawKeyDown',
    modifiers: _modifiers,
    windowsVirtualKeyCode: description.keyCode,
    code: description.code,
    key: description.key,
    text: text,
    unmodifiedText: text,
    autoRepeat,
    location: description.location,
    isKeypad: description.location === 3,
  });
};

const _up = async (key) => {
  const description = _keyDescriptionForString(key);

  _modifiers &= ~_modifierBit(description.key);
  _pressedKeys.delete(description.code);
  await input.dispatchKeyEvent({
    type: 'keyUp',
    modifiers: _modifiers,
    key: description.key,
    windowsVirtualKeyCode: description.keyCode,
    code: description.code,
    location: description.location,
  });
};

const _keyDescriptionForString = (keyString) => {
  const shift = _modifiers & 8;
  const description = {
    key: '',
    keyCode: 0,
    code: '',
    text: '',
    location: 0,
  };

  const definition = keyDefinitions[keyString];
  assert(definition, `Unknown key: "${keyString}"`);

  if (definition.key) {
    description.key = definition.key;
  }
  if (shift && definition.shiftKey) {
    description.key = definition.shiftKey;
  }

  if (definition.keyCode) {
    description.keyCode = definition.keyCode;
  }
  if (shift && definition.shiftKeyCode) {
    description.keyCode = definition.shiftKeyCode;
  }

  if (definition.code) {
    description.code = definition.code;
  }

  if (definition.location) {
    description.location = definition.location;
  }

  if (description.key.length === 1) {
    description.text = description.key;
  }

  if (definition.text) {
    description.text = definition.text;
  }
  if (shift && definition.shiftText) {
    description.text = definition.shiftText;
  }

  // if any modifiers besides shift are pressed, no text should be sent
  if (_modifiers & ~8) {
    description.text = '';
  }

  return description;
};

const _mouse_move = async (sourcePosition, destinationPosition) => {
  const steps = 10;
  const fromX = sourcePosition.x,
    fromY = sourcePosition.y;
  for (let i = 1; i <= steps; i++) {
    await input.dispatchMouseEvent({
      type: 'mouseMoved',
      button: 'left',
      x: fromX + (destinationPosition.x - fromX) * (i / steps),
      y: fromY + (destinationPosition.y - fromY) * (i / steps),
      modifiers: _modifiers,
    });
  }
};

function _modifierBit(key) {
  if (key === 'Alt') {
    return 1;
  }
  if (key === 'Control') {
    return 2;
  }
  if (key === 'Meta') {
    return 4;
  }
  if (key === 'Shift') {
    return 8;
  }
  return 0;
}

const tap = async (x, y) => {
  const touchPoints = [{ x: Math.round(x), y: Math.round(y) }];
  await input.dispatchTouchEvent({ type: 'touchStart', touchPoints }).catch((err) => {
    throw new Error(err);
  });
  await input.dispatchTouchEvent({
    type: 'touchEnd',
    touchPoints: [],
  });
};

const _insertText = async (char) => {
  await input.insertText({ text: char });
};

module.exports = {
  up: _up,
  down: _down,
  mouse_move: _mouse_move,
  sendCharacter: _insertText,
  tap,
};
