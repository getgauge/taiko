const { handleUrlRedirection, isElement, isSelector } = require('../helper');
const { eventHandler, eventRegexMap } = require('../eventBus');
const { logEvent } = require('../logger');
const { findElements } = require('../elementSearch');
const nodeURL = require('url');
const path = require('path');
const { isSameUrl } = require('../util');
let page, framePromises, frameNavigationPromise;

const createdSessionListener = async (client) => {
  let resolve;
  eventHandler.emit(
    'handlerActingOnNewSession',
    new Promise((r) => {
      resolve = r;
    }),
  );
  page = client.Page;
  framePromises = {};
  frameNavigationPromise = {};
  await page.bringToFront();
  page.frameScheduledNavigation(emitFrameNavigationEvent);
  page.frameClearedScheduledNavigation(resolveFrameNavigationEvent);
  page.frameNavigated(resolveFrameNavigationEvent);
  page.frameStartedLoading(emitFrameEvent);
  page.frameStoppedLoading(resolveFrameEvent);
  page.loadEventFired((p) => {
    logEvent('LoadEventFired');
    eventHandler.emit('loadEventFired', p);
  });
  page.navigatedWithinDocument(() => {
    logEvent('LoadEventFired from NavigatedWithinPage');
    eventHandler.emit('loadEventFired');
    // Navigating within document will always succeed
    eventHandler.emit('responseReceived', {
      samePageNavigation: true,
      response: {
        status: 200,
        statusText: '',
      },
    });
  });
  await page.setLifecycleEventsEnabled({ enabled: true });
  page.lifecycleEvent((p) => {
    logEvent('Lifecyle event: ' + p.name);
    eventHandler.emit(p.name, p);
  });
  addJavascriptDialogOpeningListener();
  resolve();
};
eventHandler.on('createdSession', createdSessionListener);

const getJsDialogEventName = (message, type) => {
  if (eventRegexMap.size) {
    for (let [key, value] of eventRegexMap.entries()) {
      if (key.startsWith(type) && value.test(message)) {
        return key;
      }
    }
  }
  if (eventHandler.listenerCount(type)) {
    return type;
  }
};

const addJavascriptDialogOpeningListener = () => {
  page.javascriptDialogOpening((data) => {
    const eventName = getJsDialogEventName(data.message, data.type);
    if (eventName) {
      eventHandler.emit(eventName, data);
      eventRegexMap.delete(eventName);
    } else {
      throw new Error(
        `There is no handler registered for ${data.type} popup displayed on the page ${data.url}.
          This might interfere with your test flow. You can use Taiko's ${data.type} API to handle this popup.
          Please visit https://docs.taiko.dev/#${data.type} for more details`,
      );
    }
  });
};

const handleJavaScriptDialog = async (accept, promptText) => {
  await page.handleJavaScriptDialog({
    accept,
    promptText,
  });
};

const resetPromises = () => {
  frameNavigationPromise = {};
  framePromises = {};
};

const emitFrameNavigationEvent = (p) => {
  if (!(frameNavigationPromise && frameNavigationPromise[p.frameId])) {
    logEvent('Frame navigation started: ' + p.frameId);
    let resolve;
    eventHandler.emit(
      'frameNavigationEvent',
      new Promise((r) => {
        resolve = r;
      }),
    );
    frameNavigationPromise[p.frameId] = resolve;
  }
};

const resolveFrameNavigationEvent = (p) => {
  const frameId = p.frameId ? p.frameId : p.frame.frameId;
  if (frameNavigationPromise && frameNavigationPromise[frameId]) {
    logEvent('Frame navigation resolved: ' + frameId);
    frameNavigationPromise[frameId]();
    delete frameNavigationPromise[frameId];
  }
};

const emitFrameEvent = (p) => {
  if (!(framePromises && framePromises[p.frameId])) {
    logEvent('Frame load started: ' + p.frameId);
    let resolve;
    eventHandler.emit(
      'frameEvent',
      new Promise((r) => {
        resolve = r;
      }),
    );
    framePromises[p.frameId] = resolve;
  }
};

const resolveFrameEvent = (p) => {
  if (framePromises && framePromises[p.frameId]) {
    logEvent('Frame load resolved: ' + p.frameId);
    framePromises[p.frameId]();
    delete framePromises[p.frameId];
  }
};

const normalizeAndHandleRedirection = (urlString) => {
  let url = nodeURL.parse(urlString);
  url = handleUrlRedirection(url.href);
  if (url.protocol === 'file:') {
    url.path = path.normalize(url.path);
  }
  return url.toString();
};

const handleNavigation = async (gotoUrl) => {
  let resolveResponse,
    requestId,
    response = {};
  let urlToNavigate = normalizeAndHandleRedirection(nodeURL.parse(gotoUrl).href);
  const handleRequest = (request) => {
    if (requestId && request.requestId === requestId && request.redirectResponse) {
      const redirectedResponse = {
        url: request.redirectResponse.url,
        status: {
          code: request.redirectResponse.status,
          text: request.redirectResponse.statusText,
        },
      };
      response['redirectedResponse'] = response['redirectedResponse']
        ? response['redirectedResponse'].concat([redirectedResponse])
        : [redirectedResponse];
    }
    if (!request.request || !request.request.url) {
      return;
    }
    let requestUrl =
      request.request.urlFragment !== undefined && request.request.urlFragment !== null
        ? request.request.url + request.request.urlFragment
        : request.request.url;
    requestUrl = normalizeAndHandleRedirection(requestUrl);
    if (isSameUrl(requestUrl, urlToNavigate)) {
      requestId = request.requestId;
    }
  };
  eventHandler.addListener('requestStarted', handleRequest);

  const handleResponseStatus = (response) => {
    if (requestId === response.requestId) {
      resolveResponse(response.response);
    }
  };
  const responsePromise = new Promise((resolve) => {
    resolveResponse = resolve;
    eventHandler.addListener('responseReceived', handleResponseStatus);
  });

  try {
    const { errorText } = await page.navigate({ url: gotoUrl });
    if (errorText) {
      throw new Error(`Navigation to url ${gotoUrl} failed. REASON: ${errorText}`);
    }
    let { url, status, statusText } = await responsePromise;
    response.url = url;
    response.status = { code: status, text: statusText };
    if (status >= 400) {
      throw new Error(
        `Navigation to url ${gotoUrl} failed.\n STATUS: ${status}, STATUS_TEXT: ${statusText}`,
      );
    }
    return response;
  } finally {
    eventHandler.removeListener('responseReceived', handleResponseStatus);
    eventHandler.removeListener('requestStarted', handleRequest);
  }
};

const captureScreenshot = async function (domHandler, selector, options) {
  let screenShot;
  let clip;
  if (isSelector(selector) || isElement(selector)) {
    if (options.fullPage) {
      console.warn('Ignoring fullPage screenshot as custom selector is found!');
    }
    let padding = options.padding || 0;
    let elems = await findElements(selector);
    const { x, y, width, height } = await domHandler.boundBox(elems[0]);
    clip = {
      x: x - padding,
      y: y - padding,
      width: width + padding * 2,
      height: height + padding * 2,
      scale: 1,
    };
    screenShot = await page.captureScreenshot({ clip });
  } else if (options.fullPage) {
    const metrics = await page.getLayoutMetrics();
    const width = Math.ceil(metrics.contentSize.width);
    const height = Math.ceil(metrics.contentSize.height);
    clip = { x: 0, y: 0, width, height, scale: 1 };
    screenShot = await page.captureScreenshot({ clip });
  } else {
    screenShot = await page.captureScreenshot();
  }
  return screenShot;
};

const closePage = async () => page.close();

const reload = async (value) => page.reload({ ignoreCache: value });

const getNavigationHistory = async () => page.getNavigationHistory();

const navigateToHistoryEntry = async (entryId) => {
  await page.navigateToHistoryEntry({ entryId });
};

module.exports = {
  handleNavigation,
  resetPromises,
  captureScreenshot,
  addJavascriptDialogOpeningListener,
  closePage,
  reload,
  navigateToHistoryEntry,
  handleJavaScriptDialog,
  getNavigationHistory,
};
