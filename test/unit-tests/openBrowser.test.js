let { openBrowser,closeBrowser, client } = require('../../lib/taiko');

describe(' opens browser successfully',()=>{
    test('openBrowser should return \'Browser Opened\' message',  ()=>{

        expect(process.env.TAIKO_EMULATE_DEVICE).not.toBeDefined();

        return openBrowser().then(data => {

            expect(data).toEqual({'description': 'Browser opened'});
        });
    });


    test('openBrowser should initiate the CRI client object',  ()=>{

        return openBrowser().then(() => {
            expect(client).not.toBeNull();
        });
    });


    test('openBrowser should initiate the CRI client object with Browser domain',  ()=>{

        return openBrowser().then(() => {
            expect(client.Browser).not.toBeNull();
        });
    });


    afterEach(async() => await closeBrowser(),10000);

});
