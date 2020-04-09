const runtimeHandler = require('./handlers/runtimeHandler');

let _target;
let contexts = new Map();
let openWindowOptions;

class BrowserContext {
  constructor(browser, instance) {
    this.browser = browser;
    this.instance = instance;
  }

  async createBrowserContext(url, options) {
    _target = this.browser.Target;
    let targetId;
    if (contexts.get(options.name) !== undefined) {
      console.warn(
        `Instance of window with name ${options.name} found, switching window to ${options.name}`,
      );
      return await this.instance.switchTo({ name: options.name });
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
      /* Remove the else loop once openWindow API is deleted */
      await runtimeHandler.runtimeEvaluate(`window.open("${url}", '', 'resizable')`);
      const targets = await _target.getTargets();
      targetId = targets.targetInfos[0].targetId;
      contexts.set(options.name, { targetId, incognito: false });
    }
    return targetId;
  }

  async closeBrowserContext(arg) {
    const targetId = contexts.get(arg).targetId;
    if (targetId === undefined) {
      throw new Error(`Could not find Window with name ${arg} to close.`);
    }
    await _target.closeTarget({ targetId });
    contexts.delete(arg);
  }

  async switchBrowserContext(callback, arg) {
    const targetId = contexts.get(arg.name).targetId;
    if (targetId === undefined) {
      throw new Error(`Could not find Window with name ${arg.name} to switch.`);
    }
    await _target.activateTarget({ targetId: targetId.toString() });
    await callback(targetId);
  }
}

const getBrowserContexts = () => {
  return contexts;
};

const isIncognito = (arg) => {
  return contexts.get(arg.name).incognito;
};

const getTargets = async () => {
  return await _target.getTargets();
};

module.exports = {
  getBrowserContexts,
  getTargets,
  isIncognito,
  BrowserContext,
};
