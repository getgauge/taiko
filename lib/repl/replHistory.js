const fs = require("node:fs");
module.exports = (repl, file) => {
  try {
    fs.statSync(file);
    repl.history = fs.readFileSync(file, "utf-8").split("\n").reverse();
    repl.history.shift();
    repl.historyIndex = -1; // will be incremented before pop
  } catch (e) {}

  const fd = fs.openSync(file, "a");
  const wstream = fs.createWriteStream(file, {
    fd: fd,
  });
  wstream.on("error", (err) => {
    throw err;
  });

  repl.addListener("line", (code) => {
    if (code && code !== ".history") {
      wstream.write(`${code}\n`);
    } else {
      repl.historyIndex++;
      repl.history.pop();
    }
  });

  process.on("exit", () => {
    fs.closeSync(fd);
  });

  repl.commands.history = {
    help: "Show the history",
    action: () => {
      const out = [];
      for (const v of repl.history) {
        out.push(v);
      }
      repl.outputStream.write(`${out.reverse().join("\n")}\n`);
      repl.displayPrompt();
    },
  };
};
