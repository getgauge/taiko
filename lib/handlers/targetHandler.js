const cri = require('chrome-remote-interface');
const url = require('url');
const path = require('path');
const { handleUrlRedirection } = require('../helper');
const { eventHandler } = require('../eventBus');
const { trimCharLeft, escapeHtml } = require('../util');
const { logEvent } = require('../logger');
const { defaultConfig } = require('../config');

let criTarget;
let targetRegistry = new Map();

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

const isMatchingUrl = function (target, identifier) {
  if (identifier instanceof RegExp) {
    return false;
  }

  identifier = prependHttp(identifier);
  const parsedUrl = url.parse(target.url, true);
  const parsedTargetUrl = url.parse(identifier, true);

  const host = parsedUrl.host ? parsedUrl.host : '';
  const targetHost = parsedTargetUrl.host ? parsedTargetUrl.host : '';

  const pathname = parsedUrl.pathname ? parsedUrl.pathname : '';
  const targetPathname = parsedTargetUrl.pathname ? parsedTargetUrl.pathname : '';

  const urlPath = path.join(host, pathname);
  const identifierPath = path.join(targetHost, targetPathname);

  target.url = handleUrlRedirection(target.url);
  return (
    target.title === escapeHtml(identifier) ||
    urlPath === (identifierPath || identifier) ||
    parsedUrl.href === identifier
  );
};

const isMatchingTarget = function (target, identifier) {
  let storedTarget = register(identifier.name);
  return storedTarget && storedTarget.id === target.id;
};

const register = function (name, target) {
  if (name && target) {
    targetRegistry.set(name, target);
  } else {
    return targetRegistry.get(name);
  }
};

const unregister = function (name) {
  targetRegistry.delete(name);
};

const clearRegister = function () {
  targetRegistry.clear();
};

const getCriTargets = async function (identifier, host, port) {
  let targets = await cri.List({ host: host, port: port });
  let pages = targets.filter((target) => target.type === 'page');
  let response = {
    matching: pages.slice(0, 1),
    others: pages.slice(1),
  };
  if (identifier) {
    response = { matching: [], others: [] };
    for (const target of pages) {
      if (
        isMatchingUrl(target, identifier) ||
        isMatchingRegex(target, identifier) ||
        isMatchingTarget(target, identifier)
      ) {
        response.matching.push(target);
      } else {
        response.others.push(target);
      }
    }
  }
  return response;
};

module.exports = {
  getCriTargets,
  isMatchingUrl,
  isMatchingRegex,
  isMatchingTarget,
  register,
  unregister,
  clearRegister,
};
