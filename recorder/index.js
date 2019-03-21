/**
* This is a placeholder method to start a repl from script.
* When taiko is invoked as a runner with `--load` option this method
* gets overwritten to start REPL server.
*
* @example
* import { openREPL } from 'taiko/recorder';
* await openREPL();
*/

module.exports.repl = async () => {
    console.warn('[WARNING]: The "openREPL" api works only when the script is executed via taiko runner.');
};