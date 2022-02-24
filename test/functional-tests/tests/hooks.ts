import {
  openBrowser,
  setConfig,
  screenshot,
  closeBrowser,
  openIncognitoWindow,
  closeIncognitoWindow,
} from 'taiko';
import {
  AfterSuite,
  BeforeSuite,
  AfterScenario,
  BeforeScenario,
  CustomScreenshotWriter,
} from 'gauge-ts';
import { startServer, stopServer } from './server';
import { join, basename } from 'path';
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
  }

  @CustomScreenshotWriter()
  public async takeScreenshot(): Promise<string> {
    const fileName = join(process.env['gauge_screenshots_dir'], `screenshot${Date.now()}.png`);
    await screenshot({ path: fileName });
    return basename(fileName);
  }

  @AfterScenario()
  public async afterScenario() {
    await closeBrowser();
  }

  @BeforeSuite()
  public async beforeSuite() {
    await startServer();
    setConfig({ navigationTimeout: 60000 });
  }

  @AfterSuite()
  public async afterSuite() {
    await stopServer();
  }
}
