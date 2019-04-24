let { openBrowser,closeBrowser,client } = require('../../lib/taiko');

describe('close browser successfully',()=>{

    beforeEach(async () => {
        expect(process.env.TAIKO_EMULATE_DEVICE).not.toBeDefined();
        await openBrowser();
    },10000);
    

    test('closeBrowser should return \'Browser Opened\' message',  ()=>{

        return closeBrowser().then(data => {
            expect(data).toEqual({ 'description': 'Browser closed' });
        });
    });

    // test('closeBrowser should nullify CRI client object',  ()=>{

    //     return closeBrowser().then(() => {
    //         expect(client).toBeNull();
    //     });
    // });

});
