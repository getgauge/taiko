import {
  $,
  attach,
  below,
  clear,
  clearHighlights,
  click,
  currentURL,
  doubleClick,
  dragAndDrop,
  emulateTimezone,
  focus,
  goBack,
  goForward,
  goto,
  highlight,
  hover,
  into,
  link,
  mouseAction,
  press,
  reload,
  rightClick,
  screenshot,
  scrollDown,
  scrollLeft,
  scrollRight,
  scrollTo,
  scrollUp,
  tap,
  text,
  textBox,
  title,
  to,
  toRightOf,
  write,
} from "..";

// ------------------------------------------
// goto
// https://docs.taiko.dev/api/goto
// ------------------------------------------
goto("https://google.com"); // $ExpectType Promise<Response>
goto("google.com"); // $ExpectType Promise<Response>
// $ExpectType Promise<Response>
goto("example.com", {
  navigationTimeout: 10000,
  headers: { Authorization: "Basic cG9zdG1hbjpwYXNzd29y2A==" },
});
async () => {
  const response = await goto("gauge.org");
  if (response.status.code === 200) {
    console.log("Success!!");
  }
};

// ------------------------------------------
// reload
// https://docs.taiko.dev/api/reload
// ------------------------------------------
reload("https://google.com"); // $ExpectType Promise<void>
reload("https://google.com", { navigationTimeout: 10000 }); // $ExpectType Promise<void>
// $ExpectType Promise<void>
reload("https://google.com", {
  waitForNavigation: true,
  waitForEvents: [
    "DOMContentLoaded",
    "loadEventFired",
    "networkAlmostIdle",
    "networkIdle",
    "firstPaint",
    "firstContentfulPaint",
    "firstMeaningfulPaint",
    "targetNavigated",
  ],
  navigationTimeout: 30000,
  waitForStart: 100,
  ignoreCache: false,
});

// ------------------------------------------
// goBack
// https://docs.taiko.dev/api/goBack
// ------------------------------------------
goBack(); // $ExpectType Promise<void>
// $ExpectType Promise<void>
goBack({
  waitForNavigation: true,
  waitForEvents: [
    "DOMContentLoaded",
    "loadEventFired",
    "networkAlmostIdle",
    "networkIdle",
    "firstPaint",
    "firstContentfulPaint",
    "firstMeaningfulPaint",
    "targetNavigated",
  ],
  navigationTimeout: 30000,
  waitForStart: 100,
});

// ------------------------------------------
// goForward
// https://docs.taiko.dev/api/goForward
// ------------------------------------------
goForward(); // $ExpectType Promise<void>
// $ExpectType Promise<void>
goForward({
  waitForNavigation: true,
  waitForEvents: [
    "DOMContentLoaded",
    "loadEventFired",
    "networkAlmostIdle",
    "networkIdle",
    "firstPaint",
    "firstContentfulPaint",
    "firstMeaningfulPaint",
    "targetNavigated",
  ],
  navigationTimeout: 30000,
  waitForStart: 100,
});

// ------------------------------------------
// currentURL
// https://docs.taiko.dev/api/currentURL
// ------------------------------------------
currentURL(); // $ExpectType Promise<string>

// ------------------------------------------
// title
// https://docs.taiko.dev/api/title
// ------------------------------------------
title(); // $ExpectType Promise<string>

// ------------------------------------------
// click
// https://docs.taiko.dev/api/click
// ------------------------------------------
click("Get Started"); // $ExpectType Promise<void>
click(link("Get Started")); // $ExpectType Promise<void>
click({ x: 170, y: 567 }); // $ExpectType Promise<void>
click("Get Started", { navigationTimeout: 60000 }); // $ExpectType Promise<void>
click("Get Started", { navigationTimeout: 60000 }, below("text")); // $ExpectType Promise<void>
// $ExpectType Promise<void>
click(
  { x: 170, y: 567 },
  {
    waitForNavigation: true,
    navigationTimeout: 30000,
    button: "middle",
    clickCount: 1,
    elementsToMatch: 10,
    waitForEvents: [
      "DOMContentLoaded",
      "loadEventFired",
      "networkAlmostIdle",
      "networkIdle",
      "firstPaint",
      "firstContentfulPaint",
      "firstMeaningfulPaint",
      "targetNavigated",
    ],
    waitForStart: 100,
    force: false,
  },
);
click(
  { x: 170, y: 567 },
  {
    waitForNavigation: true,
    navigationTimeout: 30000,
    button: "middle",
    clickCount: 1,
    elementsToMatch: 10,
    waitForEvents: [
      "DOMContentLoaded",
      "loadEventFired",
      "networkAlmostIdle",
      "networkIdle",
      "firstPaint",
      "firstContentfulPaint",
      "firstMeaningfulPaint",
      "targetNavigated",
    ],
    waitForStart: 100,
    force: false,
  },
  below("text"),
);
// ------------------------------------------
// doubleClick
// https://docs.taiko.dev/api/doubleClick
// ------------------------------------------
doubleClick("Get Started"); // $ExpectType Promise<void>
doubleClick(link("Get Started")); // $ExpectType Promise<void>
doubleClick("Get Started", { waitForNavigation: true }); // $ExpectType Promise<void>
doubleClick("Get Started", { waitForNavigation: false }, below("text")); // $ExpectType Promise<void>
doubleClick("Get Started", {
  waitForNavigation: true,
  force: false,
  navigationTimeout: 30000, // $ExpectError
});

// ------------------------------------------
// rightClick
// https://docs.taiko.dev/api/rightClick
// ------------------------------------------
rightClick("Get Started"); // $ExpectType Promise<void>
rightClick(link("Get Started")); // $ExpectType Promise<void>
rightClick("Get Started", { waitForNavigation: true }); // $ExpectType Promise<void>
rightClick("Get Started", { waitForNavigation: false }, below("text")); // $ExpectType Promise<void>
rightClick("Get Started", {
  waitForNavigation: true,
  force: false,
  navigationTimeout: 30000, // $ExpectError
});

// ------------------------------------------
// dragAndDrop
// https://docs.taiko.dev/api/dragAndDrop
// ------------------------------------------
dragAndDrop($("work"), into($("work done"))); // $ExpectType Promise<void>
dragAndDrop($("work"), { up: 10, down: 10, left: 10, right: 10 }); // $ExpectType Promise<void>
dragAndDrop($("work")); // $ExpectError
dragAndDrop($("work"), into($("work done")), {
  up: 10,
  down: 10,
  left: 10,
  right: 10,
}); // $ExpectError

// ------------------------------------------
// hover
// https://docs.taiko.dev/api/hover
// ------------------------------------------
hover("Get Started"); // $ExpectType Promise<void>
hover(link("Get Started")); // $ExpectType Promise<void>
hover(link("Get Started"), {
  force: false,
  waitForEvents: ["firstMeaningfulPaint"],
}); // $ExpectType Promise<void>

// ------------------------------------------
// focus
// https://docs.taiko.dev/api/focus
// ------------------------------------------
focus(textBox("Username:")); // $ExpectType Promise<void>
focus(textBox("Username:"), {
  force: false,
  waitForEvents: ["firstMeaningfulPaint"],
}); // $ExpectType Promise<void>

// ------------------------------------------
// write
// https://docs.taiko.dev/api/write
// ------------------------------------------
write("admin"); // $ExpectType Promise<void>
write("admin", into(textBox("Username"))); // $ExpectType Promise<void>
// $ExpectType Promise<void>
write("admin", into(textBox("Username")), {
  delay: 0,
  waitForNavigation: true,
  waitForStart: 100,
  navigationTimeout: 30000,
  hideText: false,
  force: false,
  waitForEvents: ["firstMeaningfulPaint"],
});

// ------------------------------------------
// clear
// https://docs.taiko.dev/api/clear
// ------------------------------------------
clear(); // $ExpectType Promise<void>
clear(textBox({ placeholder: "Email" })); // $ExpectType Promise<void>
clear(textBox({ placeholder: "Email" }), { waitForNavigation: true }); // $ExpectType Promise<void>
// $ExpectType Promise<void>
clear(textBox({ placeholder: "Email" }), {
  waitForNavigation: true,
  waitForStart: 100,
  navigationTimeout: 10000,
  force: false,
  waitForEvents: ["firstMeaningfulPaint"],
});

// ------------------------------------------
// attach
// https://docs.taiko.dev/api/attach
// -----------------------------------------
attach("c:/abc.txt", to("Please select a file:")); // $ExpectType Promise<void>
attach("c:/abc.txt", "Please select a file:"); // $ExpectType Promise<void>
attach("c:/abc.txt"); // $ExpectError

// ------------------------------------------
// press
// https://docs.taiko.dev/api/press
// ------------------------------------------
press("Enter"); // $ExpectType Promise<void>
press("a"); // $ExpectType Promise<void>
press(["Shift", "ArrowLeft", "ArrowLeft"]); // $ExpectType Promise<void>
press("a", { waitForNavigation: false }); // $ExpectType Promise<void>
// $ExpectType Promise<void>
press("a", {
  text: "abcde",
  delay: 100,
  waitForNavigation: false,
  waitForStart: 100,
  navigationTimeout: 10000,
  waitForEvents: ["firstMeaningfulPaint"],
});

// ------------------------------------------
// highlight
// https://docs.taiko.dev/api/highlight
// ------------------------------------------
highlight("Get Started"); // $ExpectType Promise<void>
highlight(link("Get Started")); // $ExpectType Promise<void>
highlight("Get Started", below("Welcome")); // $ExpectType Promise<void>

// ------------------------------------------
// clearHighlights
// https://docs.taiko.dev/api/clearHighlights
// ------------------------------------------
clearHighlights(); // $ExpectType Promise<void>

// ------------------------------------------
// mouseAction
// https://docs.taiko.dev/api/mouseAction
// ------------------------------------------
mouseAction("press", { x: 0, y: 0 }); // $ExpectType Promise<void>
mouseAction("move", { x: 9, y: 9 }); // $ExpectType Promise<void>
mouseAction("release", { x: 9, y: 9 }); // $ExpectType Promise<void>
mouseAction($("#elementID"), "press", { x: 0, y: 0 }); // $ExpectType Promise<void>
mouseAction($(".elementClass"), "move", { x: 9, y: 9 }); // $ExpectType Promise<void>
mouseAction($("testxpath"), "release", { x: 9, y: 9 }); // $ExpectType Promise<void>
// $ExpectType Promise<void>
mouseAction(
  "release",
  { x: 9, y: 9 },
  {
    navigationTimeout: 30000,
  },
);
// $ExpectType Promise<void>
mouseAction(
  $("testxpath"),
  "release",
  { x: 9, y: 9 },
  {
    waitForNavigation: true,
    navigationTimeout: 30000,
    waitForEvents: ["firstMeaningfulPaint"],
    waitForStart: 100,
    force: false,
  },
);

// ------------------------------------------
// scrollTo
// https://docs.taiko.dev/api/scrollTo
// ------------------------------------------
scrollTo("Get Started"); // $ExpectType Promise<void>
scrollTo(link("Get Started")); // $ExpectType Promise<void>
scrollTo(link("Get Started"), { waitForEvents: ["firstMeaningfulPaint"] }); // $ExpectType Promise<void>

// ------------------------------------------
// scrollRight
// https://docs.taiko.dev/api/scrollRight
// ------------------------------------------
scrollRight(); // $ExpectType Promise<void>
scrollRight(1000); // $ExpectType Promise<void>
scrollRight("Element containing text"); // $ExpectType Promise<void>
scrollRight("Element containing text", 1000); // $ExpectType Promise<void>

// ------------------------------------------
// scrollLeft
// https://docs.taiko.dev/api/scrollLeft
// ------------------------------------------
scrollLeft(); // $ExpectType Promise<void>
scrollLeft(1000); // $ExpectType Promise<void>
scrollLeft("Element containing text"); // $ExpectType Promise<void>
scrollLeft("Element containing text", 1000); // $ExpectType Promise<void>

// ------------------------------------------
// scrollUp
// https://docs.taiko.dev/api/scrollUp
// ------------------------------------------
scrollUp(); // $ExpectType Promise<void>
scrollUp(1000); // $ExpectType Promise<void>
scrollUp("Element containing text"); // $ExpectType Promise<void>
scrollUp("Element containing text", 1000); // $ExpectType Promise<void>

// ------------------------------------------
// scrollDown
// https://docs.taiko.dev/api/scrollDown
// ------------------------------------------
scrollDown(); // $ExpectType Promise<void>
scrollDown(1000); // $ExpectType Promise<void>
scrollDown("Element containing text"); // $ExpectType Promise<void>
scrollDown("Element containing text", 1000); // $ExpectType Promise<void>

// ------------------------------------------
// screenshot
// https://docs.taiko.dev/api/screenshot
// ------------------------------------------
screenshot(); // $ExpectType Promise<Buffer | undefined>
screenshot({ path: "screenshot.png" }); // $ExpectType Promise<Buffer | undefined>
screenshot({ fullPage: true }); // $ExpectType Promise<Buffer | undefined>
screenshot(text("Images", toRightOf("gmail"))); // $ExpectType Promise<Buffer | undefined>
// $ExpectType Promise<Buffer | undefined>
screenshot(text("Images", toRightOf("gmail")), {
  fullPage: true,
  path: "shot.png",
  encoding: "base64",
});

// ------------------------------------------
// tap
// https://docs.taiko.dev/api/tap
// ------------------------------------------
tap("Gmail"); // $ExpectType Promise<void>
tap(link("Gmail")); // $ExpectType Promise<void>
tap(link("Gmail"), {
  waitForNavigation: true,
  waitForEvents: ["firstMeaningfulPaint"],
}); // $ExpectType Promise<void>
tap(link("Gmail"), {}, below("title")); // $ExpectType Promise<void>

// ------------------------------------------
// emulateTimezone
// https://docs.taiko.dev/api/emulateTimezone
// ------------------------------------------
emulateTimezone("America/Jamaica"); // $ExpectType Promise<void>
