let { handleInterceptor, addInterceptor, setNetwork } = require('../../lib/networkHandler');
const test_name = 'Intercept';

describe(test_name, () => {

    test('Check redirection using interception', async () => {
        let actualOption;
        setNetwork({continueInterceptedRequest: (options) => { actualOption = options; return Promise.resolve();}});
        addInterceptor({ requestUrl: 'www.google.com', action: 'www.ibibo.com' });
        handleInterceptor({interceptionId : 'interceptionId',
            request :{
                url : 'http://www.google.com',
                method: 'GET',
            },
            resourceType: 'Document',
            isNavigationRequest: true
        });
        expect(actualOption.url).toBe('http://www.ibibo.com');
    });

    test('Block url', async () => {
        let actualOption;
        setNetwork({continueInterceptedRequest: (options) => { actualOption = options; return Promise.resolve();}});
        addInterceptor({ requestUrl: 'www.google.com'});
        handleInterceptor({interceptionId : 'interceptionId',
            request :{
                url : 'http://www.google.com',
                method: 'GET',
            },
            resourceType: 'Document',
            isNavigationRequest: true
        });
        expect(actualOption.errorReason).toBe('Failed');
    });

    test('Mock Response', async () => {
        let actualOption;
        setNetwork({continueInterceptedRequest: (options) => { actualOption = options; return Promise.resolve();}});
        addInterceptor({
            requestUrl: 'http://localhost:3000/api/customers/11',
            action: {
                body: {
                    'id':11, 'firstName':'ward', 'lastName':'bell', 'gender':'male', 'address':'12345 Central St.','city':'Los Angeles',
                    'state':{'abbreviation':'CA','name':'California'},'latitude':34.042552,'longitude':-118.266429
                }
            }
        });
        handleInterceptor({interceptionId : 'interceptionId',
            request :{
                url : 'http://localhost:3000/api/customers/11',
                method: 'GET',
            },
            resourceType: 'Document',
            isNavigationRequest: true
        });
        let res = atob(actualOption.rawResponse);
        expect(res).toContain('12345 Central St.');
    });

});