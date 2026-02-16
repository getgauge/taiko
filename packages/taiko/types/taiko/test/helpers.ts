/* eslint-disable no-undef */
import {
  $,
  // eslint-disable-next-line no-unused-vars
  type EvaluateOptions,
  accept,
  dismiss,
  evaluate,
  getConfig,
  into,
  link,
  setConfig,
  to,
  waitFor,
} from "..";

// ------------------------------------------
// evaluate
// https://docs.taiko.dev/api/evaluate
// ------------------------------------------
evaluate(link("something"), () => "hello"); // $ExpectType Promise<string>
// $ExpectType Promise<void>
evaluate(link("something"), (element) => {
  element.style.backgroundColor = "red";
});
// $ExpectType Promise<void>
evaluate("something", (element) => {
  element.style.backgroundColor = "red";
});
// $ExpectType Promise<void>
evaluate((element) => {
  element.style.backgroundColor = "red";
});
evaluate(() => {
  return document.title;
});
let evalOptions: EvaluateOptions;
evalOptions = { args: [".main-content", { backgroundColor: "red" }] };
evaluate(
  link("something"),
  (element, args) => {
    element.style.backgroundColor = args![1].backgroundColor;
    element.querySelector(args![0]).innerText = "Some thing";
  },
  evalOptions,
);
evalOptions = {
  waitForNavigation: true,
  waitForStart: 100,
  navigationTimeout: 3000,
  waitForEvents: ["firstMeaningfulPaint"],
  headers: [["accept-content", "aaaa"]], // $ExpectError
};

// ------------------------------------------
// to
// https://docs.taiko.dev/api/to
// ------------------------------------------
to("Please select a file:" as string); // $ExpectType string
to(link("Please select a file:")); // $ExpectType LinkWrapper

// ------------------------------------------
// into
// https://docs.taiko.dev/api/into
// ------------------------------------------
into("Please select a file:" as string); // $ExpectType string
into(link("Please select a file:")); // $ExpectType LinkWrapper

// ------------------------------------------
// waitFor
// https://docs.taiko.dev/api/waitFor
// ------------------------------------------
waitFor(5000); // $ExpectType Promise<void>
waitFor("1 item in cart"); // $ExpectType Promise<void>
waitFor("Order Created", 2000); // $ExpectType Promise<void>
waitFor(async () => !(await $("loading-text").exists())); // $ExpectType Promise<void>

// ------------------------------------------
// accept
// https://docs.taiko.dev/api/accept
// ------------------------------------------
accept("Something"); // $ExpectType Promise<void>
accept(); // $ExpectType Promise<void>

// ------------------------------------------
// dismiss
// https://docs.taiko.dev/api/dismiss
// ------------------------------------------
dismiss("Something"); // $ExpectError
dismiss(); // $ExpectType Promise<void>

// ------------------------------------------
// getConfig
// https://docs.taiko.dev/api/getConfig
// ------------------------------------------
getConfig(); // $ExpectType GlobalConfigurationOptions
getConfig("navigationTimeout"); // $ExpectType number
getConfig("observeTime"); // $ExpectType number
getConfig("retryInterval"); // $ExpectType number
getConfig("retryTimeout"); // $ExpectType number
getConfig("observe"); // $ExpectType boolean
getConfig("waitForNavigation"); // $ExpectType boolean
getConfig("ignoreSSLErrors"); // $ExpectType boolean
getConfig("headful"); // $ExpectType boolean
getConfig("highlightOnAction"); // $ExpectType "true" | "false"
getConfig("should not accept any string"); // $ExpectError

// ------------------------------------------
// setConfig
// https://docs.taiko.dev/api/setConfig
// ------------------------------------------
setConfig({ observeTime: 3000 });
setConfig({
  navigationTimeout: 10000,
  observeTime: 3000,
  retryInterval: 100,
  retryTimeout: 10000,
  observe: false,
  waitForNavigation: true,
  ignoreSSLErrors: true,
  headful: false,
  highlightOnAction: false,
});
setConfig({});
setConfig({ other: true }); // $ExpectError

// ------------------------------------------
// TODO: repl
// https://docs.taiko.dev/api/repl
// ------------------------------------------
