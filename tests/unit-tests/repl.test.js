const chai = require("chai");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const repl = require("node:repl");
const { PassThrough } = require("node:stream");

const expect = chai.expect;
const taikoRepl = require("taiko/lib/repl/repl");

const waitForRepl = (delay = 50) =>
  new Promise((resolve) => {
    setTimeout(resolve, delay);
  });

async function createReplSession() {
  const input = new PassThrough();
  const output = new PassThrough();
  const logs = [];
  let renderedOutput = "";
  const originalStart = repl.start;
  const originalLog = console.log;

  output.on("data", (chunk) => {
    renderedOutput += chunk.toString();
  });

  repl.start = (options) =>
    originalStart({ ...options, input, output, terminal: false });
  console.log = (...args) => {
    logs.push(args.join(" "));
  };

  const fakeTaiko = {
    emitter: { on() {} },
    metadata: { Helpers: [] },
    client: () => null,
    openBrowser: async () => {},
    goto: async () => {},
    write: async () => {},
    press: async () => {},
    closeBrowser: async () => {},
  };

  const session = await taikoRepl.initialize(fakeTaiko);
  await waitForRepl();

  return {
    input,
    logs,
    session,
    renderedOutput: () => renderedOutput,
    restore: () => {
      repl.start = originalStart;
      console.log = originalLog;
    },
  };
}

async function runCommands(input, commands) {
  for (const command of commands) {
    input.write(`${command}\n`);
    await waitForRepl();
  }
}

describe("repl", function () {
  this.timeout(5000);

  let replSession;

  afterEach(async () => {
    if (replSession) {
      replSession.session.close();
      await waitForRepl();
      replSession.restore();
      replSession = null;
    }
  });

  describe(".code", () => {
    it("should print generated code when commands were recorded", async () => {
      replSession = await createReplSession();

      await runCommands(replSession.input, [
        'openBrowser()',
        'goto("search.brave.com")',
        'write("Hello World")',
        'press("Enter")',
        "closeBrowser()",
        ".code",
      ]);

      await waitForRepl(100);

      const output = replSession.logs.join("\n");
      expect(output).to.contain(
        "const { openBrowser, goto, write, press, closeBrowser } = require('taiko');",
      );
      expect(output).to.contain('await goto("search.brave.com");');
      expect(output).to.contain('await write("Hello World");');
      expect(output).to.contain('await press("Enter");');
      expect(output).to.contain("await closeBrowser();");
    });

    it("should print generated code when no commands were recorded", async () => {
      taikoRepl.__test__.resetState();
      const output = taikoRepl.__test__.code();
      expect(output).to.contain(
        "const { closeBrowser } = require('taiko');",
      );
      expect(output).to.contain("await closeBrowser();");
    });

    it("should save generated code to the given file", async () => {
      replSession = await createReplSession();
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "taiko-repl-"));
      const filePath = path.join(tempDir, "session.js");

      try {
        await runCommands(replSession.input, [
          "openBrowser()",
          'goto("search.brave.com")',
          'write("Hello World")',
          'press("Enter")',
          "closeBrowser()",
          `.code ${filePath}`,
        ]);

        await waitForRepl(100);

        expect(fs.existsSync(filePath)).to.equal(true);

        const savedCode = fs.readFileSync(filePath, "utf8");
        expect(savedCode).to.contain(
          "const { openBrowser, goto, write, press, closeBrowser } = require('taiko');",
        );
        expect(savedCode).to.contain('await goto("search.brave.com");');
        expect(savedCode).to.contain("await closeBrowser();");
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });
});
