const { eventHandler } = require('../eventBus');
let _browser;

eventHandler.on('createdSession', client => {
  _browser = client.Browser;
});

const overridePermissions = async (origin, permissions) => {
  const permissionToProcotol = new Map([
    ['geolocation', 'geolocation'],
    ['midi', 'midi'],
    ['notifications', 'notifications'],
    ['push', 'push'],
    ['camera', 'videoCapture'],
    ['microphone', 'audioCapture'],
    ['background-sync', 'backgroundSync'],
    ['ambient-light-sensor', 'sensors'],
    ['accelerometer', 'sensors'],
    ['gyroscope', 'sensors'],
    ['magnetometer', 'sensors'],
    ['accessibility-events', 'accessibilityEvents'],
    ['clipboard-read', 'clipboardRead'],
    ['clipboard-write', 'clipboardWrite'],
    ['payment-handler', 'paymentHandler'],
    ['midi-sysex', 'midiSysex'],
  ]);
  permissions = permissions.map(permission => {
    const protocolPermission = permissionToProcotol.get(permission);
    if (!protocolPermission) {
      throw new Error('Unknown permission: ' + permission);
    }
    return protocolPermission;
  });
  _browser.grantPermissions({ origin, permissions });
};

const clearPermissionOverrides = async () => {
  await _browser.resetPermissions();
};

module.exports = { clearPermissionOverrides, overridePermissions };
