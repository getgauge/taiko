#! /usr/bin/env node

const { aEval, commands } = require('./awaitEval');
const taiko = require('./taiko');

const repl = require('repl').start({ prompt: '>> ' });
const funcs = {};

for (let func in taiko) {
    repl.context[func] = taiko[func];
    funcs[func] = true;
}

aEval(repl);

repl.defineCommand('code', {
    help: 'Prints code for all evaluated commands in this REPL session',
    /*eslint-disable no-unused-vars*/
    action(name) {
        const text = commands.get()
            .map(e => {
                if (!e.endsWith(';')) e += ';';
                return funcs[e.split('(')[0]] ? '\tawait ' + e : '\t' + e;
            }).join('\n');
        console.log(`const { ${Object.keys(funcs).join(', ')} } = require('taiko');\n\n(async => {\n${text}\n})();`);
        this.displayPrompt();
    }
});

repl.defineCommand('del', {
    help: 'Delete previously evaluated commands from the buffer',
    action(name) {
        commands.clear();
        this.displayPrompt();
    }
});