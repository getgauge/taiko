const isWin = require('os').platform() === 'win32';
const fs = require('fs');
const Module = require('module');

module.exports.removeQuotes = (textWithQuotes, textWithoutQuotes) => {
    return textWithQuotes.replace(/\\n/g, '\n')
        .replace(/\\'/g, '\'')
        .replace(`'${textWithoutQuotes}'`, () => textWithoutQuotes);
};

module.exports.symbols = {
    pass: (isWin ? '[PASS] ' : ' ✔ '),
    fail: (isWin ? '[FAIL] ' : ' ✘ '),
};

module.exports.isTaikoRunner = (path) => {
    try {
        if (!path.includes('taiko.js')) {
            const link = fs.readlinkSync(path);
            return link && link.includes('taiko.js');
        } else {
            return path && path.includes('taiko.js');
        }
    } catch (e) {
        if (Module._nodeModulePaths('taiko').some((val) => path === (val + '.bin/taiko')))
            return true;
    }
};

module.exports.calcObserveDelay = (shouldObserve, observeTime) => {
    if (shouldObserve) {
        return observeTime || 3000;
    } else {
        return observeTime || 0;
    }
};

module.exports.createJsDialogEventName = (...args) => {
    let eventName = args.reduce((acc, arg) => {
        return `${acc}${arg.replace(/[^\w]+/g, '')}`;
    }, '');
    return `js${eventName}DialogOpened`;
};

module.exports.trimChar = (baseString,char) =>{
    const regex = new RegExp('^[' + char + ']+|[' + char + ']+$', 'g');
    return baseString.replace(regex, '');
};