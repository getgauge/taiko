let { openBrowser, closeBrowser, client, emitter } = require('../../lib/taiko');
let { openBrowserArgs } = require('./test-util');

describe(' opens browser successfully',()=>{
    test('openBrowser should return \'Browser Opened\' message',  async ()=>{

        expect(process.env.TAIKO_EMULATE_DEVICE).not.toBeDefined();
        emitter.once('success', (desc) => {
            expect(desc).toEqual('Browser opened');
        });
        await openBrowser(openBrowserArgs).then(data => {
            expect(data).toEqual(undefined);
        });
    });


    test('openBrowser should initiate the CRI client object',  ()=>{

        return openBrowser(openBrowserArgs).then(() => {
            expect(client).not.toBeNull();
        });
    });

    afterEach(async() => await closeBrowser(),10000);

});
