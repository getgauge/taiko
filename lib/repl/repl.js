const fs = require('fs-extra');
const path = require('path');
const util = require('util');
const { aEval } = require('./awaitEval');
const { initSearch } = require('./repl-search');
const { defaultConfig } = require('../config');
const { removeQuotes, symbols, taikoInstallationLocation } = require('../util');
const { EOL } = require('os');
const funcs = {};
let commands = [];
const stringColor = util.inspect.styles.string;
let taikoCommands = [];
let lastStack = '';
let version = '';
let browserVersion = '';
let doc = '';

module.exports.initialize = async (taiko, previousSessionFile, recordedSession) => {
  await setVersionInfo();
  const repl = require('repl').start({
    prompt: '> ',
    ignoreUndefined: true,
    preview: false,
  });
  repl.writer = writer(repl.writer);
  if (!recordedSession) {
    var eventEmitter = taiko.emitter;
    eventEmitter.on('success', (desc) => {
      repl.setPrompt('');
      process.nextTick(() => {
        desc = symbols.pass + desc;
        desc = removeQuotes(util.inspect(desc, { colors: true }), desc);
        console.log(desc);
        repl.setPrompt('> ');
        repl.prompt();
      });
    });
  }
  aEval(repl, (cmd, res) => !util.isError(res) && commands.push(cmd.trim()));
  initTaiko(taiko, repl);
  initCommands(taiko, repl, previousSessionFile);
  initSearch(repl);
  return repl;
};

async function setVersionInfo() {
  try {
    version = require('../../package.json').version;
    doc = require('../api.json');
    browserVersion = require('../../package.json').taiko.chromium_version;
  } catch (_) {}
  displayTaiko();
}

const writer = (w) => (output) => {
  if (util.isError(output)) {
    return output.message;
  } else {
    return ' value: ' + w(output);
  }
};

function initCommands(taiko, repl, previousSessionFile) {
  repl.defineCommand('highlight', {
    help: 'Customize highlight actions for current session.',
    async action(arg) {
      switch (arg) {
        case 'enable':
          defaultConfig.highlightOnAction = true;
          break;
        case 'disable':
          defaultConfig.highlightOnAction = false;
          break;
        case 'clear':
          await taiko.clearHighlights();
          break;
        default:
          break;
      }
      this.displayPrompt();
    },
  });
  repl.defineCommand('trace', {
    help: 'Show last error stack trace',
    action() {
      console.log(lastStack ? lastStack : util.inspect(undefined, { colors: true }));
      this.displayPrompt();
    },
  });
  repl.defineCommand('code', {
    help: 'Prints or saves the code for all evaluated commands in this REPL session',
    action(file) {
      if (!file) {
        console.log(code());
      } else {
        writeCode(file, previousSessionFile);
      }
      this.displayPrompt();
    },
  });
  repl.defineCommand('step', {
    help:
      'Generate gauge steps from recorded script. (openBrowser and closeBrowser are not recorded as part of step)',
    action(file) {
      if (!file) {
        console.log(step());
      } else {
        writeStep(file);
      }
      this.displayPrompt();
    },
  });
  repl.defineCommand('version', {
    help: 'Prints version info',
    action() {
      console.log(`${version} (${browserVersion})`);
      this.displayPrompt();
    },
  });
  repl.defineCommand('api', {
    help: 'Prints api info',
    action(name) {
      if (!doc) {
        console.log('API usage not available.');
      } else if (name) {
        displayUsageFor(name);
      } else {
        displayUsage(taiko);
      }
      this.displayPrompt();
    },
  });
  repl.on('reset', () => {
    commands.length = 0;
    taikoCommands = [];
    lastStack = '';
  });
  repl.on('exit', async () => {
    if (taiko.client()) {
      await taiko.closeBrowser();
      process.exit();
    }
  });
}

function code() {
  if (commands[commands.length - 1].includes('closeBrowser()')) {
    commands.pop();
  }
  const text = commands
    .map((e) => {
      if (!e.endsWith(';')) {
        e += ';';
      }
      return isTaikoFunc(e) ? '        await ' + e : '\t' + e;
    })
    .join('\n');

  const cmds = taikoCommands;
  if (!cmds.includes('closeBrowser')) {
    cmds.push('closeBrowser');
  }
  const importTaiko = cmds.length > 0 ? `const { ${cmds.join(', ')} } = require('taiko');\n` : '';
  return (
    importTaiko +
    `(async () => {
    try {
${text}
    } catch (error) {
        console.error(error);
    } finally {
        await closeBrowser();
    }
})();
`
  );
}

function step(withImports = false, actions = commands) {
  if (actions[0].includes('openBrowser(')) {
    actions = actions.slice(1);
  }
  if (actions.length && actions[actions.length - 1].includes('closeBrowser()')) {
    actions = actions.slice(0, -1);
  }
  const actionsString = actions
    .map((e) => {
      if (!e.endsWith(';')) {
        e += ';';
      }
      return isTaikoFunc(e) ? '\tawait ' + e : '\t' + e;
    })
    .join('\n');

  const cmds = taikoCommands.filter((c) => {
    return c !== 'openBrowser' && c !== 'closeBrowser';
  });
  const importTaiko = cmds.length > 0 ? `const { ${cmds.join(', ')} } = require('taiko');\n` : '';
  const step = !actionsString
    ? ''
    : `\n// Insert step text below as first parameter\nstep("", async function() {\n${actionsString}\n});\n`;
  return !withImports ? step : `${importTaiko}${step}`;
}

function writeStep(file) {
  if (fs.existsSync(file)) {
    fs.appendFileSync(file, step());
  } else {
    fs.ensureFileSync(file);
    fs.writeFileSync(file, step(true));
  }
}

function writeCode(file, previousSessionFile) {
  try {
    if (fs.existsSync(file)) {
      fs.appendFileSync(file, code());
    } else {
      fs.ensureFileSync(file);
      fs.writeFileSync(file, code());
    }
    if (previousSessionFile) {
      console.log(`Recorded session to ${file}.`);
      if (path.resolve(file) === path.resolve(previousSessionFile)) {
        console.log(
          `Please update contents of ${previousSessionFile} before running it with taiko.`,
        );
      } else {
        console.log(`The previous session was recorded in ${previousSessionFile}.`);
        console.log(
          `Please merge contents of ${previousSessionFile} and ${file} before running it with taiko.`,
        );
      }
    }
  } catch (error) {
    console.log(`Failed to write to ${file}.`);
    console.log(error.stacktrace);
  }
}

function initTaiko(taiko, repl) {
  const openBrowser = taiko.openBrowser;
  taiko.openBrowser = async (options = {}) => {
    if (!options.headless) {
      options.headless = false;
    }
    return await openBrowser(options);
  };
  addFunctionToRepl(taiko, repl);
}

function addFunctionToRepl(target, repl) {
  for (let func in target) {
    if (target[func].constructor.name === 'AsyncFunction') {
      repl.context[func] = async function () {
        try {
          lastStack = '';
          let args = await Promise.all(Object.values(arguments));
          const res = await target[func].apply(this, args);
          if (!taikoCommands.includes(func)) {
            taikoCommands.push(func);
          }
          return res;
        } catch (e) {
          return handleError(e);
        } finally {
          util.inspect.styles.string = stringColor;
        }
      };
    } else if (target[func].constructor.name === 'Function') {
      repl.context[func] = function () {
        if (!taikoCommands.includes(func)) {
          taikoCommands.push(func);
        }
        const res = target[func].apply(this, arguments);
        return res;
      };
    } else if (Object.prototype.hasOwnProperty.call(target[func], 'init')) {
      repl.context[func] = target[func];
      if (!taikoCommands.includes(func)) {
        taikoCommands.push(func);
      }
    }
    funcs[func] = true;
  }
}

function displayTaiko() {
  console.log(`\nVersion: ${version} (Chromium:${browserVersion})`);
  if (doc) {
    console.log('Type .api for help and .exit to quit\n');
  } else {
    console.log(
      `\x1b[33mCould not load documentation, please re-generate it by running [node lib/documentation.js] in the directory ${taikoInstallationLocation()}`,
    );
  }
}

function displayUsageFor(name) {
  const e = doc.find((e) => e.name === name);
  if (!e) {
    console.log(`Function ${name} doesn't exist.${EOL}`);
    return;
  }
  if (e.deprecated) {
    console.log(`${EOL}DEPRECATED ${desc(e.deprecated)}${EOL}`);
  }
  console.log(`${desc(e.description)}${EOL}`);
  if (e.params.length > 0) {
    console.log(e.params.length > 1 ? 'Parameters:' : 'Parameter:');
    console.log(`${EOL}${params(e.params)}${EOL}`);
  }
  if (e.returns) {
    e.returns.map((e) => {
      console.log(
        `Returns: ${type(e.type)} ${
          e.description.type ? desc(e.description) : e.description
        }${EOL}`,
      );
    });
  }
  if (e.examples.length > 0) {
    console.log(e.examples.length > 1 ? 'Examples:' : 'Example:');
    console.log(
      e.examples
        .map((e) =>
          e.description
            .split('\n')
            .map((e) => '\t' + e)
            .join('\n'),
        )
        .join('\n'),
    );
  }
}

function displayUsage(taiko) {
  taiko.metadata.Helpers = taiko.metadata.Helpers.filter((item) => item !== 'repl');
  for (let k in taiko.metadata) {
    console.log(`
${removeQuotes(util.inspect(k, { colors: true }), k)}
    ${taiko.metadata[k].join(', ')}`);
  }
  console.log(`
Run \`.api <name>\` for more info on a specific function. For Example: \`.api click\`.
Complete documentation is available at https://docs.taiko.dev
`);
}

function handleError(e) {
  util.inspect.styles.string = 'red';
  lastStack = removeQuotes(util.inspect(e.stack, { colors: true }), e.stack);
  e.message = symbols.fail + 'Error: ' + e.message + ', run `.trace` for more info.';
  return new Error(removeQuotes(util.inspect(e.message, { colors: true }), e.message));
}

const desc = (d) =>
  d.children
    .map((c) =>
      (c.children || [])
        .map((c1, i) => {
          if (c1.type === 'listItem') {
            return (
              (i === 0 ? '\n\n* ' : '\n* ') + c1.children[0].children.map((c2) => c2.value).join('')
            );
          }
          return (c1.type === 'link' ? c1.children[0].value : c1.value || '').trim();
        })
        .join(' '),
    )
    .join(' ');

const type = (t) => {
  switch (t.type) {
    case 'NameExpression':
      return t.name;
    case 'OptionalType':
      return type(t.expression);
    case 'RestType':
      return '...' + type(t.expression);
    case 'TypeApplication':
      return `${type(t.expression)}<${t.applications.map((a) => type(a)).join(',')}>`;
    case 'UnionType':
      return `${t.elements.map((t) => type(t)).join('|')}`;
  }
};

const param = (p) => {
  const name = p.name || '';
  const t = p.type ? type(p.type) + ' - ' : '';
  const d = (p.description ? desc(p.description) : p.description) || '';
  const dft = p.default ? `(optional, default ${p.default})` : '';

  return `${name} - ${t}${d} ${dft}${EOL}`;
};

const params = (p) => {
  return p
    .map(
      (p) =>
        '* ' + param(p) + (p.properties ? p.properties.map((p) => `  * ${param(p)}`).join('') : ''),
    )
    .join('');
};

const isTaikoFunc = (keyword) => keyword.split('(')[0].trim() in funcs;
