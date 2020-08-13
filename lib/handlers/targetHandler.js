const cri = require('chrome-remote-interface');
const url = require('url');
const path = require('path');
const { handleUrlRedirection } = require('../helper');
const { eventHandler } = require('../eventBus');
const { trimCharLeft, escapeHtml } = require('../util');
const { logEvent } = require('../logger');
const { defaultConfig } = require('../config');

let criTarget;
let targetRegistry = {};
const createdSessionListener = async (client) => {
  let resolve;
  eventHandler.emit(
    'handlerActingOnNewSession',
    new Promise((r) => {
      resolve = r;
    }),
  );
  criTarget = client.Target;
  await criTarget.setDiscoverTargets({ discover: true });
  criTarget.targetCreated((target) => {
    if (target.targetInfo.type === 'page') {
      if (target.targetInfo.openerId || defaultConfig.firefox) {
        logEvent(`Target Created: Target id: ${target.targetInfo.targetId}`);
        eventHandler.emit('targetCreated', target);
      }
    }
  });
  resolve();
};

eventHandler.on('createdSession', createdSessionListener);

const isMatchingRegex = function (target, targetRegex) {
  if (!(targetRegex instanceof RegExp)) {
    return false;
  }
  const parsedUrl = url.parse(target.url, true);
  const host = parsedUrl.host ? parsedUrl.host : '';
  const urlPath = path.join(host, trimCharLeft(parsedUrl.pathname, '/'));
  const urlHrefPath = parsedUrl.protocol.concat('//').concat(trimCharLeft(host, '/'));

  return (
    target.title.match(targetRegex) ||
    urlPath.match(targetRegex) ||
    parsedUrl.href.match(targetRegex) ||
    urlHrefPath.match(targetRegex)
  );
};

const prependHttp = function (targetUrl) {
  if (targetUrl && url.parse(targetUrl).host === null) {
    targetUrl = 'http://' + targetUrl;
  }
  return targetUrl;
};

const isMatchingUrl = function (target, targetUrl) {
  if (targetUrl instanceof RegExp) {
    return false;
  }

  targetUrl = prependHttp(targetUrl);
  const parsedUrl = url.parse(target.url, true);
  const parsedTargetUrl = url.parse(targetUrl, true);

  const host = parsedUrl.host ? parsedUrl.host : '';
  const targetHost = parsedTargetUrl.host ? parsedTargetUrl.host : '';

  const pathname = parsedUrl.pathname ? parsedUrl.pathname : '';
  const targetPathname = parsedTargetUrl.pathname ? parsedTargetUrl.pathname : '';

  const urlPath = path.join(host, pathname);
  const targetUrlPath = path.join(targetHost, targetPathname);

  target.url = handleUrlRedirection(target.url);
  return (
    target.title === escapeHtml(targetUrl) ||
    urlPath === (targetUrlPath || targetUrl) ||
    parsedUrl.href === targetUrl
  );
};

const isMatchingName = function (target, targetUrl) {
  if (targetUrl instanceof RegExp) {
    return false;
  }

  targetUrl = prependHttp(targetUrl);
  const parsedUrl = url.parse(target.url, true);
  const parsedTargetUrl = url.parse(targetUrl, true);

  const host = parsedUrl.host ? parsedUrl.host : '';
  const targetHost = parsedTargetUrl.host ? parsedTargetUrl.host : '';

  const pathname = parsedUrl.pathname ? parsedUrl.pathname : '';
  const targetPathname = parsedTargetUrl.pathname ? parsedTargetUrl.pathname : '';

  const urlPath = path.join(host, pathname);
  const targetUrlPath = path.join(targetHost, targetPathname);

  target.url = handleUrlRedirection(target.url);
  return (
    target.title === escapeHtml(targetUrl) ||
    urlPath === (targetUrlPath || targetUrl) ||
    parsedUrl.href === targetUrl
  );
};

const register = function (name, target) {
  if (name && target) {
    if (targetRegistry[name]) {
      throw new Error(
        `There is a tab/page already registered with the name '${name}' please use another name.`,
      );
    }
    targetRegistry[name] = target;
  } else {
    return targetRegistry[name];
  }
};

const getCriTargets = async function (targetObject, host, port) {
  let targets = await cri.List({ host: host, port: port });
  let pages = targets.filter((target) => target.type === 'page');
  let response = {
    matching: pages.slice(0, 1),
    others: pages.slice(1),
  };
  if (targetObject) {
    response = { matching: [], others: [] };
    for (const target of pages) {
      if (isMatchingUrl(target, targetObject) || isMatchingRegex(target, targetObject)) {
        response.matching.push(target);
      } else {
        response.others.push(target);
      }
    }
  }
  return response;
};

module.exports = { getCriTargets, isMatchingUrl, isMatchingRegex, register };
