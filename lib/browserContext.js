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
    return { targetId: createdTarget.targetId, browserContextId };
  }

  async closeBrowserContext(targetHandler, callback) {
    await callback(targetHandler.targetId);
    await _target.disposeBrowserContext({ browserContextId: targetHandler.browserContextId });
  }

  async switchBrowserContext(callback, targetId) {
    await _target.activateTarget({ targetId: targetId.toString() });
    await callback(targetId);
  }
}

module.exports = {
  BrowserContext,
};
