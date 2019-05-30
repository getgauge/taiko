const rewire = require('rewire');
const taiko = rewire('../../lib/taiko');
let test_name = 'Goto';

xdescribe(test_name,()=>{
    it('should add protocol http:// if not given',  async ()=>{
        const mockWrapper = async (options, cb) => { console.log(options); await cb(); };
        taiko.__set__('doActionAwaitingNavigation', mockWrapper);
        taiko.__set__('validate',() => {});
        taiko.__set__('network',{setExtraHTTPHeaders: (header) => { console.log(header);}});
        taiko.__set__('pageHandler',{handleNavigation: (url) => { console.log(url);}});
        await taiko.goto('gauge.org');
    });

});