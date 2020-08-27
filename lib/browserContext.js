let _target;

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

  async closeBrowserContext(targetId) {
    await _target.closeTarget({ targetId });
  }

  async switchBrowserContext(callback, targetId) {
    await _target.activateTarget({ targetId: targetId.toString() });
    await callback(targetId);
  }
}

module.exports = {
  BrowserContext,
};
