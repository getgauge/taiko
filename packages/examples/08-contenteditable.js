const { goto, below, textBox, write, into } = require("taiko"),
  {
    openBrowserAndStartScreencast,
    closeBrowserAndStopScreencast,
  } = require("./browser/launcher"),
  path = require("path"),
  expect = require("chai").expect;
const cwd = process.cwd();

(async () => {
  try {
    await openBrowserAndStartScreencast(
      path.join("captures", "contenteditable", "contenteditable.gif"),
    );
    // a local file with simple `contenteditable`
    await goto("file:///" + cwd + "/data/contenteditable.html");
    var text = "Taiko writes into a contenteditable field!";
    await write(text, into(textBox(below("Editable Demo"))));
    var content = await textBox(below("Editable Demo")).text();
    expect(content).to.have.string(text);

    // a rich text editor
    await goto("http://localhost:3000/tinymce");
    text = "Taiko writes into a tinyMCE editor";
    await write(text, into(textBox(below("An iFrame"))));
    content = await into(textBox(below("An iFrame"))).text();
    expect(content).to.have.string(text);
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await closeBrowserAndStopScreencast();
  }
})();
