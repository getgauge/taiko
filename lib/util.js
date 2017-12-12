const isWin = require('os').platform() === 'win32';

module.exports.removeQuotes = (textWithQuotes, textWithoutQuotes) => {
    return textWithQuotes.replace(/\\n/g, '\n')
        .replace(/\\'/g, '\'')
        .replace(`'${textWithoutQuotes}'`, () => textWithoutQuotes);
};

module.exports.symbols = {
    pass: (isWin ? '[PASS] ' : ' ✔ '),
    fail: (isWin ? '[FAIL] ' : ' ✘ '),
};