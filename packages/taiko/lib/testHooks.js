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
