const { build, formats } = require('documentation');
const { writeFileSync } = require('fs');
const {execSync} = require('child_process');
function removeLocation(comments) {
    comments.forEach(function (comment) {
        if (comment.context) {
            delete comment.context.file;
        }
        if (comment.constructorComment) {
            delete comment.constructorComment.context.file;
        }
    });
}

async function updateDoc() {
    const comments = await build('./lib/taiko.js', { shallow: true });
    removeLocation(comments);
    const jsonDocString = await formats.json(comments);
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
