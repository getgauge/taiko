/* eslint-disable no-undef */
(async () => {
  try {
    await openBrowser({
      headless: true,
      args: [
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-first-run',
        '--no-sandbox',
        '--no-zygote',
      ],
    });
    console.log((await client().Browser.getVersion()).product.split('/')[1]);
  } catch (error) {
    console.error(error);
  } finally {
    await closeBrowser();
  }
})();
