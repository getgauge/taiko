const cri = require('chrome-remote-interface');
const url = require('url');
const path = require('path');
const { handleUrlRedirection } = require('../helper');
const eventHandler = require('../eventBus');
const { trimCharLeft, escapeHtml } = require('../util');

let criTarget;

eventHandler.on('createdSession', async client => {
  criTarget = client.Target;
  await criTarget.setDiscoverTargets({ discover: true });
  criTarget.targetCreated(target => {
    if (target.targetInfo.type === 'page') {
      eventHandler.emit('targetCreated', target);
    }
  });
});

const isMatchingUrl = function(target, targetUrl) {
  const parsedUrl = url.parse(target.url, true);
  const parsedTargetUrl = url.parse(targetUrl, true);

  const targetHost = parsedTargetUrl.host ? parsedTargetUrl.host : '';
  const host = parsedUrl.host ? parsedUrl.host : '';

  const targetUrlPath = path.join(
    targetHost,
    trimCharLeft(parsedTargetUrl.pathname, '/'),
  );
  const urlPath = path.join(
    host,
    trimCharLeft(parsedUrl.pathname, '/'),
  );

  target.url = handleUrlRedirection(target.url);
  return (
    target.title === escapeHtml(targetUrl) ||
    urlPath === (targetUrlPath || targetUrl) ||
    parsedUrl.href === targetUrl
  );
};

const getCriTargets = async function(targetUrl, host, port) {
  let targets = await cri.List({ host: host, port: port });
  let pages = targets.filter(target => target.type === 'page');
  let response = {
    matching: pages.slice(0, 1),
    others: pages.slice(1),
  };
  if (targetUrl) {
    response = { matching: [], others: [] };
    for (const target of targets) {
      if (isMatchingUrl(target, targetUrl)) {
        response.matching.push(target);
      } else {
        response.others.push(target);
      }
    }
  }
  return response;
};

module.exports = { getCriTargets, isMatchingUrl };
