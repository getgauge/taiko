module.exports.initSearch = (repl) => {
  let searching = false;
  let query = "";
  const listeners = repl.inputStream.listeners("keypress");

  repl.inputStream.on("keypress", function onKeypress(char, key) {
    if (!isCtrlR(key)) {
      if (!searching) {
        return;
      }
      if (key && key.name === "backspace") {
        if (query.length > 0) {
          query = query.slice(0, -1);
        }
        setPrompt(repl, query);
      } else if (char && !isControlChar(char)) {
        query += char;
        setPrompt(repl, query);
        repl.line = search(query, repl);
      } else {
        searching = false;
        repl._refreshLine();
        for (const f of listeners) {
          repl.inputStream.on("keypress", f);
          f(char, key);
        }
        resetPrompt(repl);
      }
    } else {
      if (!searching) {
        setPrompt(repl, query);
        searching = true;
        query = "";
        for (const f of listeners) {
          repl.inputStream.removeListener("keypress", f);
        }
      }
      if (query) {
        repl.line = search(query, repl, true);
      }
    }
  });
};

function isCtrlR(k) {
  return k?.ctrl && !k.meta && !k.shift && k.name === "r";
}

function isControlChar(c) {
  const code = c.charCodeAt(0);
  return code >= 0 && code <= 31;
}

function search(query, repl, next) {
  const currentHit = repl.historyIndex;
  const start = currentHit === -1 ? 0 : next ? currentHit + 1 : currentHit;

  for (let i = start; i < repl.history.length; i++) {
    const hit = repl.history[i].indexOf(query);
    if (hit !== -1 && (!next || repl.history[i] !== repl.line)) {
      repl.historyIndex = i;
      repl.cursor = hit;
      break;
    }
  }
  if (repl.historyIndex !== -1) {
    return repl.history[repl.historyIndex];
  }
}

function setPrompt(repl, query) {
  repl.setPrompt(`(reverse-i-search)\`'${query}': "`);
  repl.prompt();
}

function resetPrompt(repl) {
  repl.setPrompt("> ");
  repl.prompt();
}
