let _target;
let activeTargetId;
let contexts = new Map();

const createBrowserContext = async (browser, profileName) => {
  _target = browser.Target;
  const { browserContextId } = await _target.createBrowserContext();
  const { targetId } = await _target.createTarget({
    url: 'about:blank',
    browserContextId,
  });
  activeTargetId = targetId;
  contexts.set(profileName, activeTargetId);
  return activeTargetId;
};

const closeBrowserContext = async profileName => {
  const targetId = contexts.get(profileName);
  await _target.closeTarget({ targetId });
};

const switchBrowserContext = async (callback, profileName) => {
  const targetId = contexts.get(profileName);
  const { sessionId } = await _target.attachToTarget({
    targetId: targetId.toString(),
  });
  return sessionId;
};

module.exports = {
  createBrowserContext,
  closeBrowserContext,
  switchBrowserContext,
};
