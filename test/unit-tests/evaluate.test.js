const { createHtml, openBrowserArgs, removeFile } = require('./test-util');
const { openBrowser, goto, evaluate, closeBrowser } = require('../../lib/taiko');
const expect = require('chai').expect;
const testName = 'Evaluate';

describe(testName, () => {
    let filePath;
    before(async () => {
        let innerHtml =
            `<section class="header">
                    <h1>${testName} tests</h1>
                 </section>
                `;
        filePath = createHtml(innerHtml, testName);
        await openBrowser(openBrowserArgs);
        await goto(filePath);
    });

    after(async () => {
        await closeBrowser();
        removeFile(filePath);
    });

    describe('without selector', () => {
        it('should pass root html element to the function to be evaluated', async () => {
            const evaluationResult = await evaluate((rootElement) => {
                return rootElement.outerHTML;
            });
            expect(evaluationResult).to.match(/^<html>/);
            expect(evaluationResult).to.match(/<\/html>$/);
        });

        it('should return the result of the evaluation', async () => {
            const evaluationResult = await evaluate(() => {
                return document.title;
            });
            expect(evaluationResult).to.equal(testName);
        });

        it('should return the result of evaluation with async function', async () => {
            const evaluationResult = await evaluate(async () => {
                return document.title;
            });
            expect(evaluationResult).to.equal(testName);
        });

    });

});