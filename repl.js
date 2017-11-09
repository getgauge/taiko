#! /usr/bin/env node

const fs = require('fs');
const util = require('util');
const path = require('path');
const puppeteer = require('puppeteer');
const { spawnSync } = require('child_process');
const { aEval } = require('./awaitEval');
const taiko = require('./taiko');

let version = '';
let browserVersion = '';
let doc = '';
try {
    version = 'Version: ' + JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'))).version;
    browserVersion = spawnSync(puppeteer.executablePath(), ['--version']).stdout.toString().trim();
    doc = JSON.parse(fs.readFileSync(path.join(__dirname, 'docs', 'api.json')));
} catch (_) {}

displayTaiko();

const repl = require('repl').start({ prompt: '> ', ignoreUndefined: true });
const dWrite = repl.writer;
const funcs = {};
const commands = [];
const stringColor = util.inspect.styles.string;
const openBrowser = taiko.openBrowser;
let taikoCommands = {};
let lastStack = '';

repl.writer = output => {
    if (util.isError(output)) return output.message;
    else if (typeof(output) === 'object' && 'description' in output)
        return removeQuotes(util.inspect(' ✔ ' + output.description, { colors: true }), ' ✔ ' + output.description);
    else return dWrite(output);
};

aEval(repl, (cmd, res) => !util.isError(res) && commands.push(cmd.trim()));

taiko.openBrowser = async (options = {}) => {
    if (!options.headless) options.headless = false;
    return await openBrowser(options);
};

for (let func in taiko) {
    repl.context[func] = async function() {
        try {
            lastStack = '';
            const args = await Promise.all(Object.values(arguments));
            taikoCommands[func] = true;
            return taiko[func].constructor.name === 'AsyncFunction' ?
                await taiko[func].apply(this, args) : taiko[func].apply(this, args);
        } catch (e) {
            delete taikoCommands[func];
            return handleError(e);
        } finally {
            util.inspect.styles.string = stringColor;
        }
    };
    funcs[func] = true;
}

repl.defineCommand('trace', {
    help: 'Show last error stack trace',
    action() {
        console.log(lastStack ? lastStack : util.inspect(undefined, { colors: true }));
        this.displayPrompt();
    }
});

repl.on('reset', () => {
    commands.length = 0;
    taikoCommands = {};
    lastStack = '';
});

repl.defineCommand('code', {
    help: 'Prints or saves the code for all evaluated commands in this REPL session',
    action(file) {
        const text = commands.map(e => {
            if (!e.endsWith(';')) e += ';';
            return isTaikoFunc(e) ? '\tawait ' + e : '\t' + e;
        }).join('\n');
        const cmds = Object.keys(taikoCommands);
        const importTaiko = cmds.length > 0 ? `const { ${cmds.join(', ')} } = require('taiko');\n\n` : '';
        const content = importTaiko + `(async () => {\n${text}\n})();`;
        if (!file) console.log(content);
        else fs.writeFileSync(file, content);
        this.displayPrompt();
    }
});

repl.defineCommand('version', {
    help: 'Prints version info',
    action() {
        displayTaiko();
        this.displayPrompt();
    }
});

repl.defineCommand('api', {
    help: 'Prints api info',
    action(name) {
        if (!doc) console.log('API usage not available.');
        else if (name) displayUsageFor(name);
        else displayUsage();
        this.displayPrompt();
    }
});

function displayTaiko() {
    console.log('___________      .__ __             Interactive browser automation.');
    console.log('\\__    ___/____  |__|  | ______     ');
    console.log('  |    |  \\__  \\ |  |  |/ /  _ \\    ' + version);
    console.log('  |    |   / __ \\|  |    <  <_> )   ' + browserVersion);
    console.log('  |____|  (____  /__|__|_ \\____/    Documentation: https://getgauge.github.io/Taiko/');
    console.log('               \\/        \\/         Type .api for help and .exit to quit');
    console.log();
}

const removeQuotes = (textWithQuotes, textWithoutQuotes) => textWithQuotes.replace(`'${textWithoutQuotes}'`, () => textWithoutQuotes);

const handleError = (e) => {
    util.inspect.styles.string = 'red';
    lastStack = removeQuotes(util.inspect(e.stack, { colors: true }).replace(/\\n/g, '\n'), e.stack);
    e.message = ' ✘ Error: ' + e.message + ', run `.trace` for more info.';
    return new Error(removeQuotes(util.inspect(e.message, { colors: true }), e.message));
};

const displayUsageFor = name => {
    const e = doc.find(e => e.name === name);
    if (!e) {
        console.log(`Function ${name} doesn't exist.`);
        return;
    }
    console.log();
    console.log(desc(e.description));
    if (e.examples.length > 0) {
        console.log();
        console.log(e.examples.length > 1 ? 'Examples:' : 'Example:');
        console.log(e.examples
            .map(e => e.description.split('\n').map(e => '\t' + e).join('\n'))
            .join('\n'));
        console.log();
    }
};

const displayUsage = () => {
    const max = Math.max(...(doc.map(e => e.name.length))) + 4;
    doc.forEach(e => {
        const api = e.name + ' '.repeat(max - e.name.length);
        let description = desc(e.description);
        if (e.summary) description = e.tags.find(t => t.title === 'summary').description;
        console.log(removeQuotes(util.inspect(api, { colors: true }), api) + description);
    });
    console.log('\nRun `.api <name>` for more info on a specific function. For Example: `.api click`.');
};

const desc = d => d.children
    .map(c => (c.children || [])
        .map((c1) => (c1.type === 'link' ? c1.children[0].value : c1.value).trim())
        .join(' '))
    .join(' ');

const isTaikoFunc = (keyword) => keyword.split('(')[0] in funcs;