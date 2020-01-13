const rewire = require('rewire');
const EventEmitter = require('events').EventEmitter;
const expect = require('chai').expect;
let pageHandler = rewire('../../../lib/handlers/pageHandler');

describe('pageHandler', () => {
  let navigate = {};
  let event = new EventEmitter();

  beforeEach(() => {
    let page = {
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
      navigate: async param => {
        navigate.called = true;
        navigate.with = param;
        if (param.url.includes('fail')) {
          return { errorText: 'failed to navigate' };
        }
        return {};
      },
    };
    pageHandler.__set__('page', page);
    pageHandler.__set__('eventHandler', event);
  });

  it('.handleNavigation should call page.navigate', () => {
    pageHandler.handleNavigation('http://gauge.org');
    expect(navigate.called).to.be.true;
    expect(navigate.with).to.be.eql({ url: 'http://gauge.org' });
  });

  it('.handleNavigation should add listeners for xhrRequests', () => {
    pageHandler.handleNavigation('http://gauge.org');
    expect(event.eventNames()).to.be.eql(['requestStarted', 'responseReceived']);
  });

  it('.handleNavigation should fail if navigation fails', async () => {
    try {
      await pageHandler.handleNavigation('http://gauge.fail');
    } catch (error) {
      expect(error.message).to.be.eql(
        'Navigation to url http://gauge.fail failed.\n REASON: failed to navigate',
      );
    }
  });
});
