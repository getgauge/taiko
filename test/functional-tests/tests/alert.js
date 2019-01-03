const {
    alert,accept
} = require('taiko');

step("Alert <text> and await accept", async function(text) {
    alert(text, async () => await accept());
});