const chai = require('chai');
const expect = chai.expect;
const chaiAsPromissed = require('chai-as-promised');
chai.use(chaiAsPromissed);
let { setNetworkEmulation, setNetwork } = require('../../lib/networkHandler');
let { setConfig } = require('../../lib/config');
const test_name = 'Network Handler';

describe(test_name, () => {
    let network = {
        requestWillBeSent: () => { },
        loadingFinished: () => { },
        loadingFailed: () => { },
        responseReceived: () => { },
        setCacheDisabled: () => { },
        setRequestInterception: () => { },
        requestIntercepted: () => { }
    };

    it('should invoke emulateNetworkConditions with correct options', async () => {
        await setNetwork(Object.assign({}, network, {
            emulateNetworkConditions: (d) => {
                expect(d).to.deep.equal({
                    offline: false,
                    downloadThroughput: 6400,
                    uploadThroughput: 2560,
                    latency: 500
                });
                return Promise.resolve();
            }
        }));
        return setNetworkEmulation('GPRS');
    });

    it('should throw error for invalid network type', async () => {
        return expect(setNetworkEmulation('invalid network'))
            .to
            .eventually
            .rejectedWith('Please set one of the given network types GPRS,Regular2G,Good2G,Regular3G,Good3G,Regular4G,DSL,WiFi,Offline');
    });

    it('should use networkType from config when not provided', async () => {
        setConfig({ networkType: 'GPRS' });
        await setNetwork(Object.assign({}, network, {
            emulateNetworkConditions: (d) => {
                expect(d).to.deep.equal({
                    offline: false,
                    downloadThroughput: 6400,
                    uploadThroughput: 2560,
                    latency: 500
                });
                return Promise.resolve();
            }
        }));
        return setNetworkEmulation();
    });

});