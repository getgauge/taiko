const { build } = require('documentation');
const { writeFileSync } = require('fs');
const { execSync } = require('child_process');

const keysToIgnore = ['lineNumber', 'position', 'code', 'loc', 'context', 'path', 'loose', 'checked', 'todos', 'errors'];

function removeLocation(comments) {
    const stringified = JSON.stringify(comments, (k, v) => {
        return (keysToIgnore.includes(k)) ? void 0 : v;
    }, 0);
    return stringified;
}

async function updateDoc() {
    const comments = await build('./lib/taiko.js', { shallow: true });
    const jsonDocString = removeLocation(comments);
    writeFileSync('./lib/api.json', jsonDocString);
    console.log('Successfully save json docs to lib/api.json.');
}


async function main() {
    try {
        await updateDoc();
        execSync('git add lib/api.json');
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
}
main();
