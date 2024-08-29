const rewire = require("rewire");
const EventEmitter = require("node:events").EventEmitter;
const expect = require("chai").expect;

describe("pageHandler", () => {
  const navigate = {};
  let pageHandler;
  const event = new EventEmitter();

  before(() => {
    pageHandler = rewire("../../../lib/handlers/pageHandler");
    const createdSessionListener = pageHandler.__get__(
      "createdSessionListener",
    );
    pageHandler
      .__get__("eventHandler")
      .removeListener("createdSession", createdSessionListener);
    const page = {
      bringToFront: async () => {},
      domContentEventFired: async () => {},
      frameScheduledNavigation: async () => {},
      frameClearedScheduledNavigation: async () => {},
      frameNavigated: async () => {},
      frameStartedLoading: async () => {},
      frameStoppedLoading: async () => {},
      loadEventFired: async () => {},
      setLifecycleEventsEnabled: async () => {},
      lifecycleEvent: async () => {},
      javascriptDialogOpening: async () => {},
      navigate: async (param) => {
        navigate.called = true;
        navigate.with = param;
        if (param.url.includes("fail")) {
          return { errorText: "failed to navigate" };
        }
        return {};
      },
    };
    pageHandler.__set__("page", page);
    pageHandler.__set__("eventHandler", event);
  });

  after(() => {
    const createdSessionListener = pageHandler.__get__(
      "createdSessionListener",
    );
    pageHandler
      .__get__("eventHandler")
      .removeListener("createdSession", createdSessionListener);
    pageHandler = rewire("../../../lib/handlers/pageHandler");
    pageHandler
      .__get__("eventHandler")
      .removeListener(
        "createdSession",
        pageHandler.__get__("createdSessionListener"),
      );
    event.removeAllListeners();
  });

  it(".handleNavigation should call page.navigate", () => {
    pageHandler.handleNavigation("http://gauge.org");
    expect(navigate.called).to.be.true;
    expect(navigate.with).to.be.eql({ url: "http://gauge.org" });
  });

  it(".handleNavigation should add listeners for xhrRequests", () => {
    pageHandler.handleNavigation("http://gauge.org");
    expect(event.eventNames()).to.be.eql([
      "requestStarted",
      "responseReceived",
    ]);
  });

  it(".handleNavigation should return response with redirection details", async () => {
    pageHandler.__set__("isSameUrl", () => {
      return true;
    });
    const actualResponse = pageHandler.handleNavigation("http://gauge.org");
    event.emit("requestStarted", {
      request: { url: "gauge.org" },
      requestId: 123,
    });
    event.emit("requestStarted", {
      requestId: 123,
      request: {
        url: "gauge.org",
      },
      redirectResponse: {
        url: "http://gauge.org",
        status: 301,
        statusText: "Moved Permanently",
      },
    });
    event.emit("responseReceived", {
      requestId: 123,
      response: {
        url: "http://gauge.org",
        status: 301,
        statusText: "Moved Permanently",
      },
    });
    expect(await actualResponse).to.deep.equal({
      redirectedResponse: [
        {
          status: {
            code: 301,
            text: "Moved Permanently",
          },
          url: "http://gauge.org",
        },
      ],
      url: "http://gauge.org",
      status: {
        code: 301,
        text: "Moved Permanently",
      },
    });
  });

  it(".handleNavigation should fail if navigation fails", async () => {
    try {
      await pageHandler.handleNavigation("http://gauge.fail");
    } catch (error) {
      expect(error.message).to.be.eql(
        "Navigation to url http://gauge.fail failed. REASON: failed to navigate",
      );
    }
  });
});
