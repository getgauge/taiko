const {
  waitForNavigation,
  timeouts,
  wait,
  isString,
  waitUntil,
  isSelector,
} = require('./helper');
const networkHandler = require('./handlers/networkHandler');
const pageHandler = require('./handlers/pageHandler');
const { defaultConfig } = require('./config');
const { eventHandler } = require('./eventBus');
const { match } = require('./elementSearch');
const logEvent = require('./logger');

const doActionAwaitingNavigation = async (options, action) => {
  if (!options.waitForNavigation) {
    return action();
  }
  let promises = [];
  let listenerCallbackMap = {};
  pageHandler.resetPromises();
  networkHandler.resetPromises();
  options.navigationTimeout =
    options.navigationTimeout || defaultConfig.navigationTimeout;
  if (options.waitForEvents) {
    options.waitForEvents.forEach(event => {
      promises.push(
        new Promise(resolve => {
          eventHandler.addListener(event, resolve);
          listenerCallbackMap[event] = resolve;
        }),
      );
    });
  } else {
    if (options.isPageNavigationAction) {
      promises.push(
        new Promise(resolve => {
          eventHandler.addListener('loadEventFired', resolve);
          listenerCallbackMap['loadEventFired'] = resolve;
        }),
      );
    }
    let func = addPromiseToWait(promises);
    listenerCallbackMap['xhrEvent'] = func;
    listenerCallbackMap['frameEvent'] = func;
    listenerCallbackMap['frameNavigationEvent'] = func;
    eventHandler.addListener('xhrEvent', func);
    eventHandler.addListener('frameEvent', func);
    eventHandler.addListener('frameNavigationEvent', func);
    const waitForTargetCreated = () => {
      promises = [
        new Promise(resolve => {
          eventHandler.addListener('targetNavigated', resolve);
          listenerCallbackMap['targetNavigated'] = resolve;
        }),
        new Promise(resolve => {
          eventHandler.addListener('loadEventFired', resolve);
          listenerCallbackMap['loadEventFired'] = resolve;
        }),
      ];
    };
    eventHandler.once('targetCreated', waitForTargetCreated);
    listenerCallbackMap['targetCreated'] = waitForTargetCreated;
    const waitForReconnection = () => {
      promises = [
        new Promise(resolve => {
          eventHandler.addListener('reconnected', resolve);
          listenerCallbackMap['reconnected'] = resolve;
        }),
      ];
    };
    eventHandler.once('reconnecting', waitForReconnection);
    listenerCallbackMap['reconnecting'] = waitForReconnection;
  }
  try {
    await action();
    await waitForPromises(promises, options.waitForStart);
    await waitForNavigation(options.navigationTimeout, promises);
  } catch (e) {
    if (e === 'Timedout') {
      throw new Error(
        `Navigation took more than ${options.navigationTimeout}ms. Please increase the navigationTimeout.`,
      );
    }
    throw e;
  } finally {
    for (var listener in listenerCallbackMap) {
      eventHandler.removeListener(
        listener,
        listenerCallbackMap[listener],
      );
    }
  }
};
const addPromiseToWait = promises => {
  return promise => {
    if (Object.prototype.hasOwnProperty.call(promise, 'request')) {
      let request = promise.request;
      logEvent(
        `Waiting for:\t RequestId : ${request.requestId}\tRequest Url : ${request.request.url}`,
      );
      promise = promise.promise;
    }
    promises.push(promise);
  };
};

const waitForPromises = (promises, waitForStart) => {
  return Promise.race([
    waitFor(waitForStart),
    new Promise(function waitForPromise(resolve) {
      if (promises.length) {
        const timeoutId = setTimeout(resolve, waitForStart / 5);
        timeouts.push(timeoutId);
      } else {
        const timeoutId = setTimeout(() => {
          waitForPromise(resolve);
        }, waitForStart / 5);
        timeouts.push(timeoutId);
      }
    }),
  ]);
};
const waitFor = async (element, time) => {
  let timeout = time || defaultConfig.retryTimeout;
  if (!element || isFinite(element)) {
    time = element;
    return wait(time);
  } else if (isString(element)) {
    let foundElements = await match(element).elements(
      undefined,
      defaultConfig.retryInterval,
      timeout,
    );
    if (!foundElements.length) {
      throw new Error(
        `Waiting Failed: Element '${element}' not found within ${timeout} ms`,
      );
    }
  } else if (isSelector(element)) {
    let foundElements = await element.get(
      undefined,
      defaultConfig.retryInterval,
      timeout,
    );
    if (!foundElements.length) {
      throw new Error(
        `Waiting Failed: Element '${element}' not found within ${timeout} ms`,
      );
    }
  } else {
    await waitUntil(element, defaultConfig.retryInterval, timeout);
  }
};

module.exports = {
  doActionAwaitingNavigation,
};
