/**
 * TEST SEAM UTILITIES — not shipped in production (excluded via .npmignore).
 *
 * This module is only loaded when TAIKO_ENABLE_TEST_HOOKS=1.
 * It is required from within production modules (taiko.js, util.js, repl.js)
 * because the injected variables are module-private and closures must live
 * in the same module scope. The require() calls are guarded by
 * process.env.TAIKO_ENABLE_TEST_HOOKS so this file is never loaded in
 * production environments.
 */

const defineTestHooks = (target, accessors, defaults) => {
  Object.defineProperties(target, {
    __set__: {
      enumerable: false,
      value: (key, value) => {
        if (!Object.hasOwn(accessors, key)) {
          throw new Error(`Unsupported test override: ${key}`);
        }
        accessors[key].set(value);
      },
    },
    __get__: {
      enumerable: false,
      value: (key) => {
        if (!Object.hasOwn(accessors, key)) {
          throw new Error(`Unsupported test lookup: ${key}`);
        }
        return accessors[key].get();
      },
    },
    __reset__: {
      enumerable: false,
      value: () => {
        for (const [key, value] of Object.entries(defaults)) {
          accessors[key].set(value);
        }
      },
    },
  });
};

const defineHiddenTestProperty = (target, key, value) => {
  Object.defineProperty(target, key, {
    enumerable: false,
    value,
  });
};

module.exports = {
  defineTestHooks,
  defineHiddenTestProperty,
};
