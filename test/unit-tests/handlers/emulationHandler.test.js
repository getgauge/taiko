const rewire = require("rewire");
const expect = require("chai").expect;
const assert = require("chai").assert;

describe("emulationHandler", () => {
  let calledWith = {};
  let calledWithTouch = {};
  let emulationHandler;

  before(() => {
    calledWith = {};
    emulationHandler = rewire("../../../lib/handlers/emulationHandler");
    emulationHandler.__set__("emulation", {
      setGeolocationOverride: async (param) => {
        calledWith = param;
      },
      setDeviceMetricsOverride: async (param) => {
        calledWith = param;
      },
      setTouchEmulationEnabled: async (param) => {
        calledWithTouch = param;
      },
    });
  });

  after(() => {
    const createdSessionListener = emulationHandler.__get__(
      "createdSessionListener",
    );
    emulationHandler
      .__get__("eventHandler")
      .removeListener("createdSession", createdSessionListener);
    emulationHandler = rewire("../../../lib/handlers/emulationHandler");
    emulationHandler
      .__get__("eventHandler")
      .removeListener(
        "createdSession",
        emulationHandler.__get__("createdSessionListener"),
      );
  });

  it(".setLocation should set the location", async () => {
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

  it(".setLocation should fail for invalid location", async () => {
    try {
      await emulationHandler.setLocation({
        longitude: 1234,
        latitude: 54,
      });
      assert.fail("should throw error here");
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
      assert.fail("should throw error here");
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
      assert.fail("should throw error here");
    } catch (error) {
      expect(error.message).to.be.eql(
        'Invalid latitude "543": precondition -90 <= LATITUDE <= 90 failed.',
      );
    }
  });
  it(".setViewport should throw error if height or width not given", async () => {
    try {
      await emulationHandler.setViewport({});
    } catch (error) {
      expect(error.message).to.be.eql("No height and width provided");
    }
  });

  it(".setViewport should set viewport and use default setting if not provided", async () => {
    await emulationHandler.setViewport({ height: 123, width: 543 });
    expect(calledWithTouch).to.be.eql({ enabled: false });
    expect(calledWith).to.be.eql({
      height: 123,
      width: 543,
      mobile: false,
      screenOrientation: { angle: 0, type: "portraitPrimary" },
      deviceScaleFactor: 1,
    });
  });

  it(".setViewport should reapply viewport settings when createdSession event is emitted", async () => {
    // Set viewport first
    await emulationHandler.setViewport({ height: 720, width: 1280 });

    // Reset calledWith to verify reapplication
    calledWith = {};
    calledWithTouch = {};

    // Create a new mock emulation for the new session
    const newCalledWith = {};
    const newCalledWithTouch = {};
    const newMockEmulation = {
      setDeviceMetricsOverride: async (param) => {
        Object.assign(newCalledWith, param);
      },
      setTouchEmulationEnabled: async (param) => {
        Object.assign(newCalledWithTouch, param);
      },
    };

    // Mock Network to prevent errors from networkHandler
    const newMockNetwork = {
      requestWillBeSent: () => {},
      loadingFinished: () => {},
      loadingFailed: () => {},
      responseReceived: () => {},
      setCacheDisabled: async () => {},
    };

    const mockClient = {
      Emulation: newMockEmulation,
      Network: newMockNetwork,
    };

    // Emit createdSession event (simulating opening a new tab)
    const eventHandler = emulationHandler.__get__("eventHandler");
    await eventHandler.emit("createdSession", mockClient);

    // Wait for async event handler to complete
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Verify viewport settings were reapplied
    expect(newCalledWith).to.be.eql({
      height: 720,
      width: 1280,
      mobile: false,
      screenOrientation: { angle: 0, type: "portraitPrimary" },
      deviceScaleFactor: 1,
    });
    expect(newCalledWithTouch).to.be.eql({ enabled: false });
  });

  it("should not reapply viewport if setViewport was never called", async () => {
    // Remove old listener before reloading
    const oldEventHandler = emulationHandler.__get__("eventHandler");
    const oldListener = emulationHandler.__get__("createdSessionListener");
    oldEventHandler.removeListener("createdSession", oldListener);

    // Reload the module to reset state
    emulationHandler = rewire("../../../lib/handlers/emulationHandler");

    const newCalledWith = {};
    const newCalledWithTouch = {};
    const newMockEmulation = {
      setDeviceMetricsOverride: async (param) => {
        Object.assign(newCalledWith, param);
      },
      setTouchEmulationEnabled: async (param) => {
        Object.assign(newCalledWithTouch, param);
      },
    };

    // Mock Network to prevent errors from networkHandler
    const newMockNetwork = {
      requestWillBeSent: () => {},
      loadingFinished: () => {},
      loadingFailed: () => {},
      responseReceived: () => {},
      setCacheDisabled: async () => {},
    };

    const mockClient = {
      Emulation: newMockEmulation,
      Network: newMockNetwork,
    };

    // Emit createdSession without setting viewport first
    const eventHandler = emulationHandler.__get__("eventHandler");
    await eventHandler.emit("createdSession", mockClient);

    // Wait for async event handler to complete
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Verify viewport settings were NOT applied
    expect(Object.keys(newCalledWith).length).to.equal(0);
    expect(Object.keys(newCalledWithTouch).length).to.equal(0);
  });
});
