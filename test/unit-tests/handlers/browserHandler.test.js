const rewire = require('rewire');
const expect = require('chai').expect;

describe('browserHandler', () => {
  let browserHandler;
  before(() => {
    browserHandler = rewire('../../../lib/handlers/browserHandler');
  });

  after(() => {
    const createdSessionListener = browserHandler.__get__('createdSessionListener');
    browserHandler.__get__('eventHandler').removeListener('createdSession', createdSessionListener);
    browserHandler = rewire('../../../lib/handlers/browserHandler');
    browserHandler
      .__get__('eventHandler')
      .removeListener('createdSession', browserHandler.__get__('createdSessionListener'));
  });

  it('.clearPermissionOverrides should clear all overriden permissions', () => {
    let isCalled = false;
    let mockBrInstance = {
      resetPermissions: async () => {
        isCalled = true;
      },
    };
    browserHandler.__set__('_browser', mockBrInstance);
    browserHandler.__set__('_target', {
      getTargets: () => {
        return { targetInfos: [] };
      },
    });
    browserHandler.clearPermissionOverrides();
    expect(isCalled).to.be.true;
  });

  it('.overridePermissions should overriden given permissions', () => {
    let isCalled = false;
    let calledWith = {};
    let mockBrInstance = {
      grantPermissions: async (param) => {
        isCalled = true;
        calledWith = param;
      },
    };
    browserHandler.__set__('_browser', mockBrInstance);
    browserHandler.__set__('_target', {
      getTargets: () => {
        return { targetInfos: [] };
      },
    });
    browserHandler.overridePermissions('https://url.com', ['geolocation']);
    expect(isCalled).to.be.true;
    expect(calledWith).to.be.eql({
      origin: 'https://url.com',
      permissions: ['geolocation'],
    });
  });

  it('.overridePermissions should throw error if given permission is not valid', async () => {
    let isCalled = false;
    let mockBrInstance = {
      grantPermissions: async () => {
        isCalled = true;
      },
    };
    browserHandler.__set__('_browser', mockBrInstance);
    browserHandler.__set__('_target', {
      getTargets: () => {
        return { targetInfos: [] };
      },
    });
    try {
      await browserHandler.overridePermissions('https://url.com', ['foo-bar']);
    } catch (error) {
      expect(isCalled).to.be.false;
      expect(error.message).to.be.eql('Unknown permission: foo-bar');
    }
  });
});
