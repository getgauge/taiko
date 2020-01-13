const rewire = require('rewire');
const expect = require('chai').expect;
const assert = require('chai').assert;
const emulationHandler = rewire('../../../lib/handlers/emulationHandler');

describe('emulationHandler', () => {
  let calledWith = {};
  let calledWithTouch = {};

  beforeEach(() => {
    calledWith = {};

    emulationHandler.__set__('emulation', {
      setGeolocationOverride: async param => {
        calledWith = param;
      },
      setDeviceMetricsOverride: async param => {
        calledWith = param;
      },
      setTouchEmulationEnabled: async param => {
        calledWithTouch = param;
      },
    });
  });

  it('.setLocation should set the location', async () => {
    await emulationHandler.setLocation({
      longitude: 123,
      latitude: 54,
    });
    expect(calledWith).to.be.eql({
      longitude: 123,
      latitude: 54,
      accuracy: 0,
    });
  });

  it('.setLocation should fail for invalid location', async () => {
    try {
      await emulationHandler.setLocation({
        longitude: 1234,
        latitude: 54,
      });
      assert.fail('should throw error here');
    } catch (error) {
      expect(error.message).to.be.eql(
        'Invalid longitude "1234": precondition -180 <= LONGITUDE <= 180 failed.',
      );
    }

    try {
      await emulationHandler.setLocation({
        longitude: 123,
        latitude: 543,
      });
      assert.fail('should throw error here');
    } catch (error) {
      expect(error.message).to.be.eql(
        'Invalid latitude "543": precondition -90 <= LATITUDE <= 90 failed.',
      );
    }

    try {
      await emulationHandler.setLocation({
        longitude: 123,
        latitude: 543,
      });
      assert.fail('should throw error here');
    } catch (error) {
      expect(error.message).to.be.eql(
        'Invalid latitude "543": precondition -90 <= LATITUDE <= 90 failed.',
      );
    }
  });
  it('.setViewport should throw error if height or width not given', async () => {
    try {
      await emulationHandler.setViewport({});
    } catch (error) {
      expect(error.message).to.be.eql('No height and width provided');
    }
  });

  it('.setViewport should set viewport and use default setting if not provided', async () => {
    await emulationHandler.setViewport({ height: 123, width: 543 });
    expect(calledWithTouch).to.be.eql({ enabled: false });
    expect(calledWith).to.be.eql({
      height: 123,
      width: 543,
      mobile: false,
      screenOrientation: { angle: 0, type: 'portraitPrimary' },
      deviceScaleFactor: 1,
    });
  });
});
