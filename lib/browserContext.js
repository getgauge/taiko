let _target;
let activeTargetId;
let contexts = new Map();

const createBrowserContext = async (browser, url) => {
  _target = browser.Target;
  const { browserContextId } = await _target.createBrowserContext();
  const { targetId } = await _target.createTarget({
    url,
    browserContextId,
  });
  activeTargetId = targetId;
  contexts.set(url, activeTargetId);
  return activeTargetId;
};

const closeBrowserContext = async url => {
  const targetId = contexts.get(url);
  if (targetId === undefined) {
    throw new Error(
      `Couldnt find Incognito Browser with url ${url} to close.`,
    );
  }
  await _target.closeTarget({ targetId });
  contexts.delete(url);
};

const getBrowserContexts = () => {
  return contexts;
};

const switchBrowserContext = async (callback, url) => {
  const targetId = contexts.get(url);
  await _target.activateTarget({ targetId: targetId.toString() });
  await callback(targetId);
};

module.exports = {
  createBrowserContext,
  closeBrowserContext,
  switchBrowserContext,
  getBrowserContexts,
};
