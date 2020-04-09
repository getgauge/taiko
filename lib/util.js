const isWin = require('os').platform() === 'win32';
const Module = require('module');
const nodeURL = require('url');
const path = require('path');
const { spawnSync } = require('child_process');
const { readFileSync, readlinkSync, existsSync } = require('fs');

module.exports.removeQuotes = (textWithQuotes, textWithoutQuotes) => {
  return textWithQuotes
    .replace(/\\n/g, '\n')
    .replace(/\\'/g, "'")
    .replace(`'${textWithoutQuotes}'`, () => textWithoutQuotes);
};

module.exports.symbols = {
  pass: isWin ? '[PASS] ' : ' ✔ ',
  fail: isWin ? '[FAIL] ' : ' ✘ ',
};

module.exports.isTaikoRunner = (path) => {
  try {
    if (!path.includes('taiko.js')) {
      const link = readlinkSync(path);
      return link && link.includes('taiko.js');
    }
    return path && path.includes('taiko.js');
  } catch (e) {
    return Module._nodeModulePaths('taiko').some((val) => path === val + '.bin/taiko');
  }
};

module.exports.createJsDialogEventName = (...args) => {
  let eventName = args.reduce((acc, arg) => {
    return `${acc}${arg.replace(/[^\w]+/g, '')}`;
  }, '');
  return `js${eventName}DialogOpened`;
};

module.exports.trimCharLeft = (baseString, char) => {
  if (!baseString) {
    return '';
  }
  const splitedString = baseString.split(char);
  return splitedString[splitedString.length - 1];
};

module.exports.isSameUrl = (url1, url2) => {
  if (url1 === url2) {
    return true;
  }
  let parsedUrl1 = nodeURL.parse(url1);
  let parsedUrl2 = nodeURL.parse(url2);
  if (
    parsedUrl1.protocol === 'file:' &&
    parsedUrl2.protocol === 'file:' &&
    path.relative(parsedUrl1.path, parsedUrl2.path) === '' &&
    parsedUrl1.query === parsedUrl2.query &&
    parsedUrl1.hash === parsedUrl2.hash
  ) {
    return true;
  }
  return false;
};

module.exports.escapeHtml = (str) => {
  var chars = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  let pattern = new RegExp(`[${Object.keys(chars).join('')}]`, 'g');
  return str.replace(pattern, function (m) {
    return chars[m];
  });
};
module.exports.taikoInstallationLocation = () => {
  const packageJSONFilePath = './package.json';
  if (!existsSync(packageJSONFilePath)) {
    return path.join(spawnSync('npm', ['root', '-g']).output[1].toString().trim(), 'taiko');
  }
  let installLocation = '';
  let jsonData = JSON.parse(readFileSync(packageJSONFilePath, 'utf-8'));
  if (jsonData.dependencies && jsonData.dependencies.taiko) {
    installLocation = path.join(spawnSync('npm', ['root']).output[1].toString().trim(), 'taiko');
  } else if (jsonData.name.toLowerCase() === 'taiko') {
    installLocation = process.cwd();
  } else {
    installLocation = path.join(
      spawnSync('npm', ['root', '-g']).output[1].toString().trim(),
      'taiko',
    );
  }
  return installLocation;
};
