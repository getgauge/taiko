#! /usr/bin/env node

const fs = require('fs');
const util = require('util');
const { aEval, commands } = require('./awaitEval');
const taiko = require('./taiko');

const repl = require('repl').start({ prompt: '>> ', ignoreUndefined: true });
const funcs = {};

let lastStack = '';

for (let func in taiko) {
    repl.context[func] = taiko[func];
    funcs[func] = true;
}

repl.context['openBrowser'] = (options = {}) => {
    if (!options.headless) options.headless = false;
    return taiko.openBrowser(options);
};

const isTaikoFunc = (keyword) => keyword.split('(')[0] in funcs;

aEval(repl);

const dWriter = repl.writer;

repl.writer = (output) => {
    return typeof(output) === 'object' && 'description' in output ?
        util.inspect(output.description, { colors: true }).replace(`'${output.description}'`, output.description) :
        dWriter(output);
};

repl.defineCommand('trace', {
    help: 'Show last error stack trace',
    action() {
        console.log(lastStack);
        this.displayPrompt();
    }
});

repl.on('reset', () => commands.clear());

repl.defineCommand('code', {
    help: 'Prints or saves the code for all evaluated commands in this REPL session',
    action(file) {
        const text = commands.get()
            .map(e => {
                if (!e.endsWith(';')) e += ';';
                return isTaikoFunc(e) ? '\tawait ' + e : '\t' + e;
            }).join('\n');
        const content = `const { ${Object.keys(funcs).join(', ')} } = require('taiko');\n\n(async () => {\n${text}\n})();`;
        if (!file) console.log(content);
        else fs.writeFileSync(file, content);
        this.displayPrompt();
    }
});