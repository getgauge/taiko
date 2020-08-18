let _target;
const targetHandler = require('./handlers/targetHandler');

let openWindowOptions;

class BrowserContext {
  constructor(browser, instance) {
    this.browser = browser;
    this.instance = instance;
  }

  async createBrowserContext(url) {
    _target = this.browser.Target;
    const { browserContextId } = await _target.createBrowserContext();
    openWindowOptions = {
      url,
      browserContextId,
    };
    const createdTarget = await _target.createTarget(openWindowOptions);
    return createdTarget.targetId;
  }

  async closeBrowserContext(arg) {
    if (targetHandler.register(arg) === undefined) {
      console.warn('Browser context with name ${arg} not available.');
      return;
    }
    const targetId = targetHandler.register(arg).targetId;
    if (targetId === undefined) {
      throw new Error(`Could not find Window with name ${arg} to close.`);
    }
    await _target.closeTarget({ targetId });
    targetHandler.unregister(arg);
  }

  async switchBrowserContext(callback, arg) {
    const targetId = targetHandler.register(arg.name).targetId;
    if (targetId === undefined) {
      throw new Error(`Could not find Window with name ${arg.name} to switch.`);
    }
    await _target.activateTarget({ targetId: targetId.toString() });
    await callback(targetId);
  }
}

const isIncognito = (arg) => {
  return targetHandler.register(arg.name).incognito;
};

module.exports = {
  isIncognito,
  BrowserContext,
};
