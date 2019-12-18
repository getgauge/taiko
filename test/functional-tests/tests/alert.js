const { alert, accept } = require('taiko');
const assert = require('assert');

step('Alert <text> and await accept', async function(text) {
  alert(text, async () => {
    await accept();
    gauge.dataStore.scenarioStore.put('alert-text', true);
  });
});

step('Check if alert <text> was accepted', function() {
  assert.ok(gauge.dataStore.scenarioStore.get('alert-text'));
});
