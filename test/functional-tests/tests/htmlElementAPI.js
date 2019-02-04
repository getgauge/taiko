'use strict';
const assert = require('assert');
var _path = require('path');
const {
  openBrowser,
  closeBrowser,
  goto,
  $,
  link,
  listItem,
  inputField,
  fileField,
  textField,
  button,
  comboBox,
  checkBox,
  radioButton,
  alert,
  text,
  click,
  write,
  press,
  attach,
  highlight,
  focus,
  scrollTo,
  scrollRight,
  scrollLeft,
  scrollUp,
  scrollDown,
  hover,
  screenshot,
  timeoutSecs,
  intervalSecs,
  to,
  into,
  dismiss,
  accept,
  intercept
} = require('../../../lib/taiko');

beforeScenario(
  async () =>
    await openBrowser({
      args: [
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-first-run',
        '--no-sandbox',
        '--no-zygote'
      ]
    })
);

gauge.screenshotFn = async function() {
  return await screenshot({ encoding: 'base64' });
};

afterScenario(async () => await closeBrowser());

step('Navigate to <url>', async url => {
  await goto(url);
});

step(
  'Navigate to <url> with timeout <timeout> ms',
  async (url, timeout) => await goto(url, { timeout: timeout })
);

step('Display the Gauge logo', async () =>
  assert.ok(await link('Gauge').exists())
);

step('Go to Gauge get started page', async () => await click('Get Started'));

step('Click on Quick Install', async () =>
  assert.ok(await click('Quick Install'))
);

step('Check <heading> exists', async heading =>
  assert.ok(await text(heading).exists())
);

step(
  'Go to Gauge documentation page',
  async () => await click($(`//*[text()='Documentation']`))
);

step('Display quick start', async () =>
  assert.ok(await text('quick start').exists())
);

step('Go to plugins page', async () => {
  assert.ok(await link('Get Started').exists());
  assert.ok(await link(text('Get Started')).exists());
  assert.ok(await $(`//a[contains(text(),'Get Started')]`).exists());

  await hover('Get Started');
  await click('Plugins');
});

step('Display the language plugins', async () => {
  assert.ok(await text('Plugins').exists(intervalSecs(1), timeoutSecs(10)));

  assert.ok(await text('Java Runner').exists());
  await highlight(text('Java Runner'));

  assert.ok(await text('Ruby runner').exists());
});

step('Search for Hooks', async () => {
  const field = inputField({ placeholder: 'Search Docs' });
  await write('Hooks', into(field), { delay: 100 });
  assert.equal(await field.value(), 'Hooks');
  await press('Enter');
  assert.ok(await link('CSharp').exists());
});

step('Click on IDE plugins', async () => {
  assert.ok(await listItem('IDE Plugins').exists());
  assert.ok(await click('IDE Plugins'));
});

step('Display the IDE plugins', async () => {
  assert.ok(await link('IntelliJ').exists());
  assert.ok(await link('Visual Studio Code').exists());
});

step('Ensure Combo Box <comboBoxName> exists', async comboBoxName => {
  const box = comboBox(comboBoxName);
  assert.ok(await box.exists());
});

step(
  'Select <value> of Combo Box <comboBoxName>. The value now should be <fieldValue>',
  async (value, comboBoxName, fieldValue) => {
    const box = comboBox(comboBoxName);
    await box.select(value);
    assert.equal(await box.value(), fieldValue);
  }
);

step('Ensure Check Box <checkBoxName> exists', async checkBoxName => {
  const box = checkBox(checkBoxName);
  assert.ok(await box.exists());
});
step('Check the value of Check Box <checkBoxName>', async checkBoxName => {
  const box = checkBox(checkBoxName);
  await box.check();
  assert.ok(await box.isChecked());
});

step('Radio Button <label>', async label => {
  const button = radioButton(label);
  assert.ok(await button.exists());
  await button.select();
  assert.ok(await button.isSelected());
});

step(
  'Attach file <fileName> to file field <FileFieldName>',
  async (fileName, FileFieldName) => {
    const field = fileField(FileFieldName);
    await attach(fileName, to(field));
    assert.ok((await field.value()).endsWith(fileName));
  }
);

step(
  'Get value <text> of text field <textFieldName>',
  async (text, textFieldName) => {
    const field = textField(textFieldName);
    assert.equal(await field.value(), text);
  }
);

step(
  'An existing text field <textFieldName> value should give exists true',
  async textFieldName => {
    const field = textField(textFieldName);
    assert.ok(await field.exists());
  }
);

step(
  'Write <text> into Text Field <textFieldName>',
  async (text, textFieldName) => {
    await write(text, into(textFieldName));
  }
);

step(
  'Write <text> to Text Field <textFieldName>',
  async (text, textFieldName) => {
    await write(text, to(textFieldName));
  }
);

step('Focus on Text Field <textFieldName>', async textFieldName => {
  await focus(textFieldName);
});

step(
  'Scroll the page right by pixels <pixels>',
  { continueOnFailure: true },
  async pixels => {
    await scrollRight(parseInt(pixels, 10));
  }
);

step(
  'Scroll element <element> right by pixels <pixels>',
  { continueOnFailure: true },
  async (element, pixels) => {
    await scrollRight($(element), parseInt(pixels, 10));
  }
);

step('Scroll the page left', { continueOnFailure: true }, async () => {
  await scrollLeft();
});

step(
  'Wait for Accept message <message> on click of button <buttonName>',
  async (message, buttonName) => {
    alert(message, async () => await accept());

    await click(button(buttonName));
  }
);

step(
  'Wait for dismiss message <message> on click of button <buttonName>',
  async (message, buttonName) => {
    alert(message, async () => await dismiss());

    await click(button(buttonName));
  }
);

step('Intercept Google Analytics', async function() {
  await intercept('https://www.googletagmanager.com/gtm.js?id=GTM-5C33ML2');
  await intercept('https://www.google-analytics.com/analytics.js');
});

step('Respond to <url> with <respomnseBody>', async function(
  url,
  respomnseBody
) {
  await intercept(url, { body: respomnseBody });
});

step('Respond to <url> with json <jsonString>', async function(
  url,
  jsonString
) {
  await intercept(url, { body: JSON.parse(jsonString) });
});

step('Navigate to relative path <relativePath>', async function(relativePath) {
  var absolutePath = _path.resolve(relativePath);
  await goto('file:///' + absolutePath);
});

step('Scroll to element <arg0>', { continueOnFailure: true }, async function() {
  await scrollTo($('#myDIV'));
});

step(
  'Scroll the page left by pixels <pixels>',
  { continueOnFailure: true },
  async pixels => {
    await scrollLeft(parseInt(pixels, 10));
  }
);

step(
  'Scroll element <element> left by pixels <pixels>',
  { continueOnFailure: true },
  async function(element, pixels) {
    await scrollLeft($(element), parseInt(pixels, 10));
  }
);

step('Scroll the page right', { continueOnFailure: true }, async () => {
  await scrollRight();
});

step(
  'Scroll the page up by pixels <pixels>',
  { continueOnFailure: true },
  async pixels => {
    await scrollUp(parseInt(pixels, 10));
  }
);

step(
  'Scroll element <element> up by pixels <pixels>',
  { continueOnFailure: true },
  async function(element, pixels) {
    await scrollUp($(element), parseInt(pixels, 10));
  }
);

step('Scroll the page up', { continueOnFailure: true }, async () => {
  await scrollUp();
});

step(
  'Scroll the page down by pixels <pixels>',
  { continueOnFailure: true },
  async pixels => {
    await scrollDown(parseInt(pixels, 10));
  }
);

step(
  'Scroll element <element> down by pixels <pixels>',
  { continueOnFailure: true },
  async function(element, pixels) {
    await scrollDown($(element), parseInt(pixels, 10));
  }
);

step('Scroll the page down', { continueOnFailure: true }, async () => {
  await scrollDown();
});
