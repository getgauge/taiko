let path = require('path');
let { writeFileSync, unlinkSync } = require('fs');

module.exports.createHtml = (innerHtml) => {
    let htmlFilePath = path.join(process.cwd(), 'test', 'unit-tests', 'data', 'test.html');
    let content = `<!DOCTYPE html>
        <html>
        <body>
        ${innerHtml}
        </body>
        </html>
    `;
    writeFileSync(htmlFilePath, content);
    return 'file://' + htmlFilePath;
};

module.exports.removeFile = (filePath) => {
    filePath = filePath.replace('file://', '');
    unlinkSync(filePath);
};