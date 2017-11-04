#! /usr/bin/env node

const fs = require('fs');
const util = require('util');
const { aEval } = require('./awaitEval');
const taiko = require('./taiko');

try {
    const figlet = require('figlet');
    const fonts = ['Graffiti', '3D Diagonal', 'Acrobatic', 'Avatar', 'Big Money-ne', 'Big Money-nw', 'Big Money-se', 'Graffiti', 'Big Money-sw', 'Big', 'Blocks', 'Bulbhead', 'Cards', 'Chiseled', 'Crawford2', 'Crazy', 'Dancing Font', 'Doh', 'Doom', 'Epic', 'Graffiti', 'Fire Font-k', 'Fire Font-s', 'Flower Power', 'Ghost', 'Graceful', 'Graffiti', 'Impossible', 'Isometric1', 'Isometric2', 'Graffiti', 'Isometric3', 'Isometric4', 'JS Bracket Letters', 'Lil Devil', 'Merlin1', 'Modular', 'Ogre', 'Patorjk\'s Cheese', 'Patorjk-HeX', 'Rectangles', 'Slant', 'Slant Relief', 'Small', 'Small Slant', 'Small Isometric1', 'Soft', 'Standard', 'Star Wars', 'Sub-Zero', 'Swamp Land', 'Sweet', 'Train', 'Twisted', 'Wet Letter', 'Varsity', '3D-ASCII', 'ANSI Shadow', 'Bloody', 'Calvin S', 'Delta Corps Priest 1', 'Electronic', 'Elite', 'Stronger Than All', 'THIS', 'The Edge', '4Max', '5 Line Oblique', 'AMC 3 Line', 'AMC AAA01', 'AMC Neko', 'AMC Razor', 'AMC Razor2', 'AMC Slash', 'AMC Slider', 'AMC Thin', 'AMC Tubes', 'AMC Untitled', 'ASCII New Roman', 'Alligator', 'Alligator2', 'Alphabet', 'Arrows', 'Banner', 'Banner3-D', 'Banner3', 'Banner4', 'Basic', 'Bear', 'Bell', 'Bigfig', 'Block', 'Bolger', 'Braced', 'Bright', 'Broadway KB', 'Broadway', 'Bubble', 'Caligraphy', 'Caligraphy2', 'Chunky', 'Coinstak', 'Cola', 'Colossal', 'Computer', 'Contessa', 'Contrast', 'Cosmike', 'Crawford', 'Cricket', 'Cursive', 'Cyberlarge', 'Cybermedium', 'Cybersmall', 'Cygnet', 'Def Leppard', 'Diamond', 'Diet Cola', 'Digital', 'Dot Matrix', 'Double Shorts', 'Double', 'Dr Pepper', 'Efti Font', 'Efti Italic', 'Efti Robot', 'Efti Water', 'Fender', 'Flipped', 'Four Tops', 'Fraktur', 'Fuzzy', 'Georgi16', 'Georgia11', 'Ghoulish', 'Glenyn', 'Goofy', 'Gothic', 'Greek', 'Heart Left', 'Heart Right', 'Henry 3D', 'Hollywood', 'Horizontal Left', 'Horizontal Right', 'Invita', 'Italic', 'Ivrit', 'JS Block Letters', 'JS Capital Curves', 'JS Cursive', 'JS Stick Letters', 'Jacky', 'Jazmine', 'Kban', 'Keyboard', 'Knob', 'LCD', 'Larry 3D', 'Lean', 'Letters', 'Line Blocks', 'Linux', 'Lockergnome', 'Madrid', 'Marquee', 'Maxfour', 'Mini', 'Muzzle', 'NScript', 'NT Greek', 'NV Script', 'Nancyj-Fancy', 'Nancyj-Underlined', 'Nancyj', 'Nipples', 'O8', 'OS2', 'Old Banner', 'Pawp', 'Peaks', 'Pebbles', 'Poison', 'Puffy', 'Puzzle', 'Pyramid', 'Rammstein', 'Roman', 'Rounded', 'Rowan Cap', 'Rozzo', 'S Blood', 'Santa Clara', 'Script', 'Serifcap', 'Shadow', 'Shimrod', 'Short', 'Small Caps', 'Small Keyboard', 'Small Poison', 'Small Script', 'Graffiti', 'Small Shadow', 'Speed', 'Spliff', 'Stacey', 'Stampate', 'Graffiti', 'Stampatello', 'Star Strips', 'Stellar', 'Graffiti', 'Stforek', 'Stick Letters', 'Stop', 'Graffiti', 'Straight', 'Swan', 'Tanja', 'Thick', 'Thin', 'Graffiti', 'Thorned', 'Three Point', 'Tiles', 'Tinker-Toy', 'Tombstone', 'Tubular', 'Two Point', 'Univers', 'Graffiti', 'Weird', 'Whimsy'];
    console.log(figlet.textSync('Taiko', {
        font: fonts[Math.floor(Math.random() * fonts.length)],
        horizontalLayout: 'default',
        verticalLayout: 'default'
    }).trimRight() + '\n');
} catch (e) {}

const repl = require('repl').start({ prompt: '> ', ignoreUndefined: true });
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