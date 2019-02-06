const { alert, accept } = require('../../../lib/taiko');

step('Alert <text> and await accept', async function(text) {
  alert(text, async () => await accept());
});
