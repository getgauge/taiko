let _target;
let activeTargetId;
let contexts = new Map();
let openWindowOptions;

const createBrowserContext = async (browser, url, options) => {
  _target = browser.Target;

  if (options.incognito) {
    const { browserContextId } = await _target.createBrowserContext();
    openWindowOptions = {
      url,
      browserContextId,
    };
  } else {
    openWindowOptions = {
      url,
    };
  }
  const { targetId } = await _target.createTarget(openWindowOptions);
  activeTargetId = targetId;
  contexts.set(options.name, activeTargetId);
  return activeTargetId;
};

const closeBrowserContext = async arg => {
  const targetId = contexts.get(arg);
  if (targetId === undefined) {
    throw new Error(
      `Couldnt find Incognito Browser with ${arg} to close.`,
    );
  }
  await _target.closeTarget({ targetId });
  contexts.delete(arg);
};

const getBrowserContexts = () => {
  return contexts;
};

const isIncognito = () => {
  return !!openWindowOptions.browserContextId;
};

const getTargets = async () => {
  return await _target.getTargets();
};

const switchBrowserContext = async (callback, arg) => {
  const targetId = contexts.get(arg.name);
  await _target.activateTarget({ targetId: targetId.toString() });
  await callback(targetId);
};

module.exports = {
  createBrowserContext,
  closeBrowserContext,
  switchBrowserContext,
  getBrowserContexts,
  getTargets,
  isIncognito,
};
