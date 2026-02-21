var glob = require("glob"),
  path = require("path"),
  cp = require("child_process");
// var app = require("the-internet-express");

console.log("Note: Test server disabled for workspace setup testing");

var server = { listen: (port, cb) => cb() }; // Mock server
var mockServer = server.listen(3000, async () => {
  var args = process.argv;
  var run = (f) =>
    new Promise((resolve, reject) => {
      console.log(path.parse(f).name);
      var a = args.includes("--observe") ? f + " --observe" : f;
      var env = process.env;
      env["SCREENCAST_ENABLED"] = args.includes("--screencast");
      var p = cp.exec("taiko " + a, { env: env }, (error) => {
        if (error) {
          reject(error);
        }
        resolve();
      });
      p.stdout.pipe(process.stdout);
      p.stderr.pipe(process.stderr);
    });

  var prefix =
    args.filter((a) => !["--observe", "--screencast"].includes(a))[2] || "";
  var examples = glob
    .sync("*.js")
    .filter(
      (f) =>
        __filename !== path.resolve(f) &&
        "browser/launcher.js" !== f &&
        f.startsWith(prefix),
    )
    .map((f) => {
      return { file: f, task: () => run(f) };
    });
  var failed = false;
  for (const example of examples) {
    try {
      await example.task();
    } catch (e) {
      console.error("Unable to run " + example.file);
      failed = true;
    }
  }
  console.log("Shutting down mock server");
  if (server.close) server.close((e) => {
    if (e) {
      console.error("Failed to close the Internet Express", e);
      failed = true;
    }
  });
  if (failed) {
    process.exit(1);
  }
});
