const { generateRandomString } = require('../lib/helper');

let _target;
let contexts = new Map();
let openWindowOptions;

const createBrowserContext = async (browser, url, runtimeHandler, options) => {
  _target = browser.Target;
  let targetId;
  if (contexts.get(options.name) !== undefined) {
    console.warn(`Instance of window with name ${options.name} found`);
    const name = generateRandomString();
    options.name = name;
  }
  if (options.incognito) {
    const { browserContextId } = await _target.createBrowserContext();
    openWindowOptions = {
      url,
      browserContextId,
    };
    const createdTarget = await _target.createTarget(openWindowOptions);
    targetId = createdTarget.targetId;
    contexts.set(options.name, { targetId, incognito: true });
  } else {
    await runtimeHandler.runtimeEvaluate(`window.open("${url}", '', 'resizable')`);
    const targets = await _target.getTargets();
    targetId = targets.targetInfos[0].targetId;
    contexts.set(options.name, { targetId, incognito: false });
  }
  return targetId;
};

const closeBrowserContext = async arg => {
  const targetId = contexts.get(arg).targetId;
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
  const targetId = contexts.get(arg.name).targetId;
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
