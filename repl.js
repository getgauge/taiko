#! /usr/bin/env node

const fs = require('fs');
const { aEval, commands } = require('./awaitEval');
const taiko = require('./taiko');

const repl = require('repl').start({ prompt: '>> ' });
const funcs = {};

for (let func in taiko) {
    repl.context[func] = taiko[func];
    funcs[func] = true;
}

repl.context['openBrowser'] = (options = {}) => {
    if (!options.headless) options.headless = false;
    return taiko.openBrowser(options);
};

aEval(repl);

repl.defineCommand('code', {
    help: 'Prints or saves the code for all evaluated commands in this REPL session',
    /*eslint-disable no-unused-vars*/
    action(file) {
        const text = commands.get()
            .map(e => {
                if (!e.endsWith(';')) e += ';';
                return funcs[e.split('(')[0]] ? '\tawait ' + e : '\t' + e;
            }).join('\n');
        const content = `const { ${Object.keys(funcs).join(', ')} } = require('taiko');\n\n(async () => {\n${text}\n})();`;
        if (!file) console.log(content);
        else fs.writeFileSync(file, content);
        this.displayPrompt();
    }
});

repl.defineCommand('del', {
    help: 'Delete previously evaluated commands from the buffer',
    action() {
        commands.clear();
        this.displayPrompt();
    }
});