const expect = require('chai').expect;
let { openBrowser, closeBrowser, client } = require('../../lib/taiko');
let { openBrowserArgs } = require('./test-util');

describe(' opens browser successfully',()=>{
    xit('openBrowser should return \'Browser Opened\' message',  async ()=>{

        expect(process.env.TAIKO_EMULATE_DEVICE).to.be.undefined;
        await openBrowser(openBrowserArgs).then(data => {
            expect(data).to.equal(undefined);
        });
    });


    it('openBrowser should initiate the CRI client object',  ()=>{

        return openBrowser(openBrowserArgs).then(() => {
            expect(client).not.to.be.null;
        });
    });

    afterEach(async() => await closeBrowser());

});
