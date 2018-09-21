const isWin = require('os').platform() === 'win32';
const fs = require('fs');

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
    try{
        const link = fs.readlinkSync(path);
        return link && link.includes('taiko.js');
    }catch(e){
        if(module.constructor._nodeModulePaths('taiko').some((val) => path.includes(val)))
            return true;
    }
};