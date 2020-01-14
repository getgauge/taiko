const { generateRandomString } = require('../lib/helper');

let _target;
let activeTargetId;
let contexts = new Map();
let openWindowOptions;

const createBrowserContext = async (browser, url, runtimeHandler, options) => {
  _target = browser.Target;
  let name = options.name;
  if (contexts.get(options.name) !== undefined) {
    console.warn(`Instance of window with name ${options.name} found`);
    const windowName = generateRandomString();
    name = windowName;
    options.name = name;
  }
  if (options.incognito) {
    const { browserContextId } = await _target.createBrowserContext();
    openWindowOptions = {
      url,
      browserContextId,
    };
    const { targetId } = await _target.createTarget(openWindowOptions);
    activeTargetId = targetId;
  } else {
    await runtimeHandler.runtimeEvaluate(`window.open("${url}", '', 'resizable')`);
    const targets = await _target.getTargets();
    activeTargetId = targets.targetInfos[0].targetId;
  }
  contexts.set(options.name, { activeTargetId, incognito: options.incognito ? true : false });
  return activeTargetId;
};

const closeBrowserContext = async arg => {
  const targetId = contexts.get(arg).activeTargetId;
  if (targetId === undefined) {
    throw new Error(`Couldnt find Window with name ${arg} to close.`);
  }
  await _target.closeTarget({ targetId });
  contexts.delete(arg);
};

const getBrowserContexts = () => {
  return contexts;
};

const isIncognito = () => {
  return !openWindowOptions;
};

const getTargets = async () => {
  return await _target.getTargets();
};

const switchBrowserContext = async (callback, arg) => {
  const targetId = contexts.get(arg.name).activeTargetId;
  if (targetId === undefined) {
    throw new Error(`Couldnt find Window with name ${arg.name} to switch.`);
  }
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
