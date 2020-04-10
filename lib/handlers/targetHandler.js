const cri = require('chrome-remote-interface');
const url = require('url');
const path = require('path');
const { handleUrlRedirection } = require('../helper');
const { eventHandler } = require('../eventBus');
const { trimCharLeft, escapeHtml } = require('../util');
const { logEvent } = require('../logger');

let criTarget;

eventHandler.on('createdSession', async (client) => {
  criTarget = client.Target;
  await criTarget.setDiscoverTargets({ discover: true });
  criTarget.targetCreated((target) => {
    if (target.targetInfo.type === 'page') {
      if (target.targetInfo.openerId) {
        logEvent(`Target Created: Target id: ${target.targetInfo.targetId}`);
        eventHandler.emit('targetCreated', target);
      }
    }
  });
});

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

const isMatchingUrl = function (target, targetUrl) {
  if (targetUrl instanceof RegExp) {
    return false;
  }
  const parsedUrl = url.parse(target.url, true);
  const parsedTargetUrl = url.parse(targetUrl, true);

  const targetHost = parsedTargetUrl.host ? parsedTargetUrl.host : '';
  const host = parsedUrl.host ? parsedUrl.host : '';

  const targetUrlPath = path.join(targetHost, trimCharLeft(parsedTargetUrl.pathname, '/'));
  const urlPath = path.join(host, trimCharLeft(parsedUrl.pathname, '/'));

  target.url = handleUrlRedirection(target.url);
  return (
    target.title === escapeHtml(targetUrl) ||
    urlPath === (targetUrlPath || targetUrl) ||
    parsedUrl.href === targetUrl
  );
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
    for (const target of targets) {
      if (isMatchingUrl(target, targetObject) || isMatchingRegex(target, targetObject)) {
        response.matching.push(target);
      } else {
        response.others.push(target);
      }
    }
  }
  return response;
};

module.exports = { getCriTargets, isMatchingUrl, isMatchingRegex };
