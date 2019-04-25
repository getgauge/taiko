let { openBrowser,closeBrowser, client } = require('../../lib/taiko');
let { openBrowserArgs } = require('./test-util');

describe(' opens browser successfully',()=>{
    test('openBrowser should return \'Browser Opened\' message',  ()=>{

        expect(process.env.TAIKO_EMULATE_DEVICE).not.toBeDefined();

        return openBrowser(openBrowserArgs).then(data => {

            expect(data).toEqual({'description': 'Browser opened'});
        });
    });


    test('openBrowser should initiate the CRI client object',  ()=>{

        return openBrowser(openBrowserArgs).then(() => {
            expect(client).not.toBeNull();
        });
    });

    afterEach(async() => await closeBrowser(),10000);

});
