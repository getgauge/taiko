const { openBrowser, setConfig, screenshot, closeBrowser } = require('taiko');
const { startServer, stopServer } = require('./server');
const headless = process.env.headless.toLowerCase() === 'true';

beforeScenario(async () => {
  await openBrowser({
    headless: headless,
    args: [
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
      '--no-first-run',
      '--no-sandbox',
      '--no-zygote',
      '--window-size=1440,900',
    ],
  });
  setConfig({ navigationTimeout: 60000 });
});

gauge.screenshotFn = async function() {
  return await screenshot({ encoding: 'base64' });
};

afterScenario(async () => await closeBrowser());

beforeSuite(async () => {
  await startServer();
});

afterSuite(async () => {
  await stopServer();
});
