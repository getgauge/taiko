const expect = require('chai').expect;
let { handleInterceptor, addInterceptor, setNetwork, resetInterceptors } = require('../../lib/networkHandler');
const test_name = 'Intercept';

describe(test_name, () => {
    let actualOption;
    before(() => {
        setNetwork({
            continueInterceptedRequest: (options) => { actualOption = options; return Promise.resolve(); },
            requestWillBeSent: () => { },
            loadingFinished: () => { },
            loadingFailed: () => { },
            responseReceived: () => { },
            setCacheDisabled: () => { },
            setRequestInterception: () => { },
            requestIntercepted: () => { }
        });
    });

    afterEach(() => {
        resetInterceptors();
    });

    it('Check redirection using interception', async () => {
        addInterceptor({ requestUrl: 'www.google.com', action: 'www.ibibo.com' });
        handleInterceptor({
            interceptionId: 'interceptionId',
            request: {
                url: 'http://www.google.com',
                method: 'GET',
            },
            resourceType: 'Document',
            isNavigationRequest: true
        });
        expect(actualOption.url).to.equal('http://www.ibibo.com');
    });

    it('Block url', async () => {
        addInterceptor({ requestUrl: 'www.google.com'});
        handleInterceptor({interceptionId : 'interceptionId',
            request :{
                url : 'http://www.google.com',
                method: 'GET',
            },
            resourceType: 'Document',
            isNavigationRequest: true
        });
        expect(actualOption.errorReason).to.equal('Failed');
    });

    it('Mock Response', async () => {
        addInterceptor({
            requestUrl: 'http://localhost:3000/api/customers/11',
            action: {
                body: {
                    'id': 11, 'firstName': 'ward', 'lastName': 'bell', 'gender': 'male', 'address': '12345 Central St.', 'city': 'Los Angeles',
                    'state': { 'abbreviation': 'CA', 'name': 'California' }, 'latitude': 34.042552, 'longitude': -118.266429
                }
            }
        });
        handleInterceptor({
            interceptionId: 'interceptionId',
            request: {
                url: 'http://localhost:3000/api/customers/11',
                method: 'GET',
            },
            resourceType: 'Document',
            isNavigationRequest: true
        });
        let res = Buffer.from(actualOption.rawResponse, 'base64').toString('binary');
        expect(res).to.include('12345 Central St.');
    });

<<<<<<< HEAD
    test('More than one intercept added for the same requestUrl', async () => {
        const spyWarn = jest.spyOn(console, 'warn');
=======
    xit('More than one intercept added for the same requestUrl', async () => {
        const spyWarn = jest.spyOn( console, 'warn' );
>>>>>>> Update test to use mocha
        addInterceptor({ requestUrl: 'www.google.com', action: 'www.ibibo.com' });
        addInterceptor({ requestUrl: 'www.google.com', action: 'www.gauge.org' });
        handleInterceptor({
            interceptionId: 'interceptionId',
            request: {
                url: 'http://www.google.com',
                method: 'GET',
            },
            resourceType: 'Document',
            isNavigationRequest: true
        });
        let warningMessage = '["WARNING: More than one intercept ["www.google.com","www.google.com"] found for request "http://www.google.com".\n Applying: intercept("www.google.com", "www.gauge.org")"]';
        expect(spyWarn).not.toHaveBeenCalledWith(warningMessage);
        expect(actualOption.url).toBe('http://www.gauge.org');
    });

});