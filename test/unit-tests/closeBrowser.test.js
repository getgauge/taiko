let { openBrowser,closeBrowser } = require('../../lib/taiko');
let { openBrowserArgs } = require('./test-util');

describe('close browser successfully',()=>{

    beforeEach(async () => {
        expect(process.env.TAIKO_EMULATE_DEVICE).not.toBeDefined();
        await openBrowser(openBrowserArgs);
    },10000);
    

    test('closeBrowser should return \'Browser Opened\' message',  ()=>{

        return closeBrowser().then(data => {
            expect(data).toEqual({ 'description': 'Browser closed' });
        });
    });

});
