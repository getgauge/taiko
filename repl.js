#! /usr/bin/env node

const { aEval, commands } = require('./awaitEval');
const taiko = require('./taiko');

const repl = require('repl').start({ prompt: '>> ' });
const funcs = [];

for (let func in taiko) {
    repl.context[func] = taiko[func];
    funcs.push(func);
}

aEval(repl);

repl.defineCommand('code', {
    help: 'Prints code for all evaluated commands in this REPL session',
    /*eslint-disable no-unused-vars*/
    action(name) {
        const text = commands().map(e => '\t' + e.trim()).map(e => e.endsWith(';') ? e : e + ';').join('\n');
        console.log(`const { ${funcs.join(', ')} } = require('taiko');\n\n(async => {\n${text}\n})();`);
        this.displayPrompt();
    }
});