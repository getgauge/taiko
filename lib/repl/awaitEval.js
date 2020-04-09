const os = require('os');
const path = require('path');
const recast = require('recast');
const parser = require('babylon');
const history = require('./replHistory');
const hFile = path.join(os.homedir(), '.taiko_repl_history');

const leakLocals = (nodes) => {
  return nodes.map((node) => {
    if (node.type !== 'VariableDeclaration') {
      return node;
    }
    return {
      type: 'ExpressionStatement',
      expression: {
        type: 'SequenceExpression',
        expressions: node.declarations.map((declaration) => ({
          type: 'AssignmentExpression',
          operator: '=',
          left: declaration.id,
          right: declaration.init,
        })),
      },
    };
  });
};

const rewrite = (code) => {
  let ast = recast.parse(`(async () => { ${code} })()`, { parser });
  let userBlock = ast.program.body[0].expression.callee.body;
  let userCode = userBlock.body;
  if (userCode.length > 0 && userCode[userCode.length - 1].type === 'ExpressionStatement') {
    userCode[userCode.length - 1] = {
      type: 'ReturnStatement',
      argument: userCode[userCode.length - 1],
    };
  }
  userBlock.body = leakLocals(userCode);
  return recast.print(ast).code;
};

const aEval = (oEval, cmdCallback) => (cmd, context, filename, callback) => {
  const oCmd = cmd.trim();
  try {
    cmd = rewrite(cmd);
  } catch (err) {
    callback(err);
  }
  oEval.call(this, cmd, context, filename, async function (err, value) {
    if (err) {
      callback.call(this, err, null);
    } else {
      try {
        value = await value;
        callback.call(this, err, value);
        cmdCallback(oCmd, value);
      } catch (error) {
        callback.call(this, error, null);
      }
    }
  });
};

module.exports = {
  aEval: (repl, callback) => {
    const oEval = repl.eval;
    history(repl, hFile);
    repl.eval = aEval(oEval, callback);
  },
};
