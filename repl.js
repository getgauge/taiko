#! /usr/bin/env node

const fs = require('fs');
const util = require('util');
const puppeteer = require('puppeteer');
const { aEval } = require('./awaitEval');
const taiko = require('./taiko');

const funcs = {};
const commands = [];
const stringColor = util.inspect.styles.string;
let taikoCommands = {};
let lastStack = '';
let version = '';
let browserVersion = '';
let doc = '';

module.exports.initiaize = async () => {
    await displayVersion();
    const repl = require('repl').start({ prompt: '> ', ignoreUndefined: true });
    repl.writer = writer(repl.writer);
    aEval(repl, (cmd, res) => !util.isError(res) && commands.push(cmd.trim()));
    initTaiko(repl);
    initCommands(repl);
    return repl;
};

async function displayVersion() {
    try {
        version = 'Version: ' + require('./package.json').version;
        const browser = await puppeteer.launch();
        const puppeteerVersion = require('./node_modules/puppeteer/package.json').version;
        browserVersion = `Puppeteer: ${puppeteerVersion} ${await browser.version()}`;
        browser.close();
        doc = require('./docs/api.json');
    } catch (_) {}
    displayTaiko();
}

const writer = w => output => {
    if (util.isError(output)) return output.message;
    else if (typeof(output) === 'object' && 'description' in output)
        return removeQuotes(util.inspect(' ✔ ' + output.description, { colors: true }), ' ✔ ' + output.description);
    else return w(output);
};

function initCommands(repl) {
    repl.defineCommand('trace', {
        help: 'Show last error stack trace',
        action() {
            console.log(lastStack ? lastStack : util.inspect(undefined, { colors: true }));
            this.displayPrompt();
        }
    });
    repl.defineCommand('code', {
        help: 'Prints or saves the code for all evaluated commands in this REPL session',
        action(file) {
            if (!file) console.log(code());
            else fs.writeFileSync(file, code());
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
    repl.on('reset', () => {
        commands.length = 0;
        taikoCommands = {};
        lastStack = '';
    });
    repl.on('exit', () => {
        try {
            taiko.browser();
            taiko.closeBrowser();
        } catch (_) {}
    });
}

function code() {
    const text = commands.map(e => {
        if (!e.endsWith(';')) e += ';';
        return isTaikoFunc(e) ? '        await ' + e : '\t' + e;
    }).join('\n');
    const cmds = Object.keys(taikoCommands);
    const importTaiko = cmds.length > 0 ? `const { ${cmds.join(', ')} } = require('taiko');\n\n` : '';
    return importTaiko + `(async () => {
    try {
${ text }
    } catch (e) {
        console.error(e);
        closeBrowser();
    }
})();`;
}

function initTaiko(repl) {
    const openBrowser = taiko.openBrowser;
    taiko.openBrowser = async (options = {}) => {
        if (!options.headless) options.headless = false;
        return await openBrowser(options);
    };
    for (let func in taiko) {
        repl.context[func] = async function() {
            try {
                lastStack = '';
                const args = await Promise.all(Object.values(arguments));
                const res = taiko[func].constructor.name === 'AsyncFunction' ?
                    await taiko[func].apply(this, args) : taiko[func].apply(this, args);
                taikoCommands[func] = true;
                return res;
            } catch (e) {
                return handleError(e);
            } finally {
                util.inspect.styles.string = stringColor;
            }
        };
        funcs[func] = true;
    }
}

function displayTaiko() {
    console.log('___________      .__ __             Interactive browser automation.');
    console.log('\\__    ___/____  |__|  | ______     ');
    console.log('  |    |  \\__  \\ |  |  |/ /  _ \\    ' + version);
    console.log('  |    |   / __ \\|  |    <  <_> )   ' + browserVersion);
    console.log('  |____|  (____  /__|__|_ \\____/    Documentation: https://getgauge.github.io/taiko/');
    console.log('               \\/        \\/         Type .api for help and .exit to quit');
    console.log();
}

function displayUsageFor(name) {
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
}

function displayUsage() {
    const max = Math.max(...(doc.map(e => e.name.length))) + 4;
    doc.forEach(e => {
        const api = e.name + ' '.repeat(max - e.name.length);
        const description = e.summary ? e.tags.find(t => t.title === 'summary').description : desc(e.description);
        console.log(removeQuotes(util.inspect(api, { colors: true }), api) + description);
    });
    console.log('\nRun `.api <name>` for more info on a specific function. For Example: `.api click`.');
}

function handleError(e) {
    util.inspect.styles.string = 'red';
    lastStack = removeQuotes(util.inspect(e.stack, { colors: true }).replace(/\\n/g, '\n'), e.stack);
    e.message = ' ✘ Error: ' + e.message + ', run `.trace` for more info.';
    return new Error(removeQuotes(util.inspect(e.message, { colors: true }), e.message));
}

function removeQuotes(textWithQuotes, textWithoutQuotes) {
    return textWithQuotes.replace(`'${textWithoutQuotes}'`, () => textWithoutQuotes);
}

const desc = d => d.children
    .map(c => (c.children || [])
        .map((c1, i) => {
            if (c1.type === 'listItem')
                return (i === 0 ? '\n\n* ' : '\n* ') + c1.children[0].children.map(c2 => c2.value).join('');
            return (c1.type === 'link' ? c1.children[0].value : (c1.value || '')).trim();
        })
        .join(' '))
    .join(' ');

const isTaikoFunc = keyword => keyword.split('(')[0] in funcs;