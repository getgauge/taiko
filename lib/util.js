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
        }
        return path && path.includes('taiko.js');
    } catch (e) {
        return Module._nodeModulePaths('taiko').some((val) => path === (val + '.bin/taiko'));
    }
};

module.exports.createJsDialogEventName = (...args) => {
    let eventName = args.reduce((acc, arg) => {
        return `${acc}${arg.replace(/[^\w]+/g, '')}`;
    }, '');
    return `js${eventName}DialogOpened`;
};

module.exports.trimCharLeft = (baseString,char) =>{
    const splitedString = baseString.split(char);
    return splitedString[splitedString.length - 1];
};