import { basename, join } from "node:path";
import {
  AfterScenario,
  AfterSuite,
  BeforeScenario,
  BeforeSuite,
  CustomScreenshotWriter,
} from "gauge-ts";
import {
  closeBrowser,
  closeIncognitoWindow,
  openBrowser,
  openIncognitoWindow,
  screenshot,
  setConfig,
} from "taiko";
import { startServer, stopServer } from "./server";
const headless = process.env.headless.toLowerCase() === "true";

export default class Hooks {
  @BeforeScenario()
  public async beforeScenario() {
    await openIncognitoWindow({ name: "admin" });
  }

  @CustomScreenshotWriter()
  public async takeScreenshot(): Promise<string> {
    const fileName = join(
      process.env.gauge_screenshots_dir,
      `screenshot${Date.now()}.png`,
    );
    await screenshot({ path: fileName });
    return basename(fileName);
  }

  @AfterScenario()
  public async afterScenario() {
    await closeIncognitoWindow("admin");
  }

  @BeforeSuite()
  public async beforeSuite() {
    await startServer();
    await openBrowser({
      headless: headless,
      args: [
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--disable-setuid-sandbox",
        "--no-first-run",
        "--no-sandbox",
        "--no-zygote",
        "--window-size=1440,900",
      ],
    });
    setConfig({ navigationTimeout: 60000 });
  }

  @AfterSuite()
  public async afterSuite() {
    await closeBrowser();
    await stopServer();
  }
}
