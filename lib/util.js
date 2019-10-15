const isWin = require('os').platform() === 'win32';
const fs = require('fs');
const Module = require('module');

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

module.exports.isTaikoRunner = path => {
  try {
    if (!path.includes('taiko.js')) {
      const link = fs.readlinkSync(path);
      return link && link.includes('taiko.js');
    }
    return path && path.includes('taiko.js');
  } catch (e) {
    return Module._nodeModulePaths('taiko').some(
      val => path === val + '.bin/taiko',
    );
  }
};

module.exports.createJsDialogEventName = (...args) => {
  let eventName = args.reduce((acc, arg) => {
    return `${acc}${arg.replace(/[^\w]+/g, '')}`;
  }, '');
  return `js${eventName}DialogOpened`;
};

module.exports.trimCharLeft = (baseString, char) => {
  if (!baseString) return '';
  const splitedString = baseString.split(char);
  return splitedString[splitedString.length - 1];
};

module.exports.isSameUrl = (url1, url2) => {
  if (url1 === url2) return true;
  url1 = nodeURL.parse(url1);
  url2 = nodeURL.parse(url2);
  if (
    url1.protocol === 'file:' &&
    url2.protocol === 'file:' &&
    path.relative(url1.path, url2.path) === '' &&
    url1.query === url2.query &&
    url1.hash === url2.hash
  )
    return true;
  return false;
};

module.exports.escapeHtml = str => {
  var chars = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  let pattern = new RegExp(`[${Object.keys(chars).join('')}]`, 'g');
  return str.replace(pattern, function(m) {
    return chars[m];
  });
};
