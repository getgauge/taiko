// Must run before any production module is required. CommonJS caches modules
// after the first require(), so TAIKO_ENABLE_TEST_HOOKS must be set before
// any require('taiko/lib/taiko') or require('taiko/lib/util') occurs.
process.env.TAIKO_ENABLE_TEST_HOOKS = "1";
