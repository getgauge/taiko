const { eventHandler } = require("../eventBus");
let _browser, _target;

const createdSessionListener = (client) => {
  _browser = client.Browser;
  _target = client.Target;
};

eventHandler.on("createdSession", createdSessionListener);

const overridePermissions = async (origin, permissions) => {
  await _browser.grantPermissions({ origin, permissions });

  const { targetInfos } = await _target.getTargets();
  const browserContextIds = [
    ...new Set(targetInfos.map((target) => target.browserContextId)),
  ];
  for (const browserContextId of browserContextIds) {
    await _browser
      .grantPermissions({ origin, permissions, browserContextId })
      .catch((error) => {
        //browsercontexts from targets does not match available contexts
        //Need to update using Target.getBrowserContexts() once fixed
        if (error.message.includes("Failed to find browser context for id")) {
          return;
        } else {
          throw error;
        }
      });
  }
};

const setWindowBounds = async (targetId, height, width) => {
  const { windowId } = await _browser.getWindowForTarget({ targetId });
  await _browser.setWindowBounds({
    bounds: { height, width },
    windowId,
  });
};

const clearPermissionOverrides = async () => {
  await _browser.resetPermissions();
};

module.exports = {
  clearPermissionOverrides,
  overridePermissions,
  setWindowBounds,
};
