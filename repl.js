#! /usr/bin/env node

const fs = require('fs');
const util = require('util');
const { aEval } = require('./awaitEval');
const taiko = require('./taiko');

const repl = require('repl').start({ prompt: '>> ', ignoreUndefined: true });
const dWrite = repl.writer;
const funcs = {};
const commands = [];
const stringColor = util.inspect.styles.string;
const openBrowser = taiko.openBrowser;

taiko.openBrowser = async (options = {}) => {
    if (!options.headless) options.headless = false;
    return await openBrowser(options);
};

let lastStack = '';

for (let func in taiko) {
    if (taiko[func].constructor.name === 'AsyncFunction') {
        repl.context[func] = async function(...args) {
            lastStack = '';
            try {
                return await taiko[func].call(this, ...args);
            } catch (e) {
                return handleError(e);
            } finally {
                util.inspect.styles.string = stringColor;
            }
        };
    } else {
        repl.context[func] = function(...args) {
            lastStack = '';
            try {
                return taiko[func].call(this, ...args);
            } catch (e) {
                return handleError(e);
            } finally {
                util.inspect.styles.string = stringColor;
            }
        };
    }
    funcs[func] = true;
}

aEval(repl, (cmd, res) => {
    if (!util.isError(res)) commands.push(cmd.trim());
});

const handleError = (e) => {
    util.inspect.styles.string = 'red';
    lastStack = removeQuotes(util.inspect(e.stack, { colors: true }).replace(/\\n/g, '\n'), e.stack);
    e.message = ' ✘ Error: ' + e.message + ', run `.trace` for more info.';
    return new Error(removeQuotes(util.inspect(e.message, { colors: true }), e.message));
};

const isTaikoFunc = (keyword) => keyword.split('(')[0] in funcs;


repl.defineCommand('trace', {
    help: 'Show last error stack trace',
    action() {
        console.log(lastStack ? lastStack : util.inspect(undefined, { colors: true }));
        this.displayPrompt();
    }
});

repl.on('reset', () => {
    commands.length = 0;
    lastStack = '';
});

repl.defineCommand('code', {
    help: 'Prints or saves the code for all evaluated commands in this REPL session',
    action(file) {
        const text = commands.map(e => {
            if (!e.endsWith(';')) e += ';';
            return isTaikoFunc(e) ? '\tawait ' + e : '\t' + e;
        }).join('\n');
        const content = `const { ${Object.keys(funcs).join(', ')} } = require('taiko');\n\n(async () => {\n${text}\n})();`;
        if (!file) console.log(content);
        else fs.writeFileSync(file, content);
        this.displayPrompt();
    }
});

repl.writer = output => {
    if (util.isError(output)) return output.message;
    else if (typeof(output) === 'object' && 'description' in output)
        return removeQuotes(util.inspect(' ✔ ' + output.description, { colors: true }), ' ✔ ' + output.description);
    else return dWrite(output);
};

const removeQuotes = (textWithQuotes, textWithoutQuotes) => textWithQuotes.replace(`'${textWithoutQuotes}'`, textWithoutQuotes);