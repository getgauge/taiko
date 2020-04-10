const { eventHandler } = require('../eventBus');
let _browser;

eventHandler.on('createdSession', (client) => {
  _browser = client.Browser;
});

const overridePermissions = async (origin, permissions) => {
  _browser.grantPermissions({ origin, permissions });
};

const clearPermissionOverrides = async () => {
  await _browser.resetPermissions();
};

module.exports = { clearPermissionOverrides, overridePermissions };
