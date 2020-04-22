import { openBrowser, setConfig, screenshot, closeBrowser } from 'taiko';
import { AfterSuite, BeforeSuite, AfterScenario, BeforeScenario, CustomScreenGrabber } from 'gauge-ts';
import { startServer, stopServer } from './server';
const headless = process.env.headless.toLowerCase() === 'true';

export default class Hooks {

  @BeforeScenario()
  public async beforeScenario() {
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
  };

  // @CustomScreenGrabber()
  // public async takeScreenshot():Promise<Uint8Array>{
  //   const screenshotGrabbed = await screenshot({ encoding: 'base64' });
  //   return screenshotGrabbed;
  // }

  @AfterScenario()
  public async afterScenario() { await closeBrowser() };

  @BeforeSuite()
  public async beforeSuite() {
    await startServer();
  };

  @AfterSuite()
  public async afterSuite(){
    await stopServer();
  };
}
