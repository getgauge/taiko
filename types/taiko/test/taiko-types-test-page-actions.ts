import {
  $,
  goto,
  reload,
  goBack,
  goForward,
  currentURL,
  title,
  click,
  link,
  below,
  doubleClick,
  rightClick,
  dragAndDrop,
  into,
  hover,
  focus,
  textBox,
  write,
} from '..';

// ------------------------------------------
// goto
// https://docs.taiko.dev/api/goto
// ------------------------------------------
goto('https://google.com'); // $ExpectType Promise<Response>
goto('google.com'); // $ExpectType Promise<Response>
// $ExpectType Promise<Response>
goto('example.com', {
  navigationTimeout: 10000,
  headers: { Authorization: 'Basic cG9zdG1hbjpwYXNzd29y2A==' },
});
async () => {
  const response = await goto('gauge.org');
  if (response.status.code === 200) {
    console.log('Success!!');
  }
};

// ------------------------------------------
// reload
// https://docs.taiko.dev/api/reload
// ------------------------------------------
reload('https://google.com'); // $ExpectType Promise<void>
reload('https://google.com', { navigationTimeout: 10000 }); // $ExpectType Promise<void>
// $ExpectType Promise<void>
reload('https://google.com', {
  waitForNavigation: true,
  waitForEvents: [
    'DOMContentLoaded',
    'loadEventFired',
    'networkAlmostIdle',
    'networkIdle',
    'firstPaint',
    'firstContentfulPaint',
    'firstMeaningfulPaint',
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
    'DOMContentLoaded',
    'loadEventFired',
    'networkAlmostIdle',
    'networkIdle',
    'firstPaint',
    'firstContentfulPaint',
    'firstMeaningfulPaint',
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
    'DOMContentLoaded',
    'loadEventFired',
    'networkAlmostIdle',
    'networkIdle',
    'firstPaint',
    'firstContentfulPaint',
    'firstMeaningfulPaint',
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
click('Get Started'); // $ExpectType Promise<void>
click(link('Get Started')); // $ExpectType Promise<void>
click({ x: 170, y: 567 }); // $ExpectType Promise<void>
click('Get Started', { navigationTimeout: 60000 }); // $ExpectType Promise<void>
click('Get Started', { navigationTimeout: 60000 }, below('text')); // $ExpectType Promise<void>
// $ExpectType Promise<void>
click(
  { x: 170, y: 567 },
  {
    waitForNavigation: true,
    navigationTimeout: 30000,
    button: 'middle',
    clickCount: 1,
    elementsToMatch: 10,
    waitForEvents: [
      'DOMContentLoaded',
      'loadEventFired',
      'networkAlmostIdle',
      'networkIdle',
      'firstPaint',
      'firstContentfulPaint',
      'firstMeaningfulPaint',
    ],
    waitForStart: 100,
  },
);
click(
  { x: 170, y: 567 },
  {
    waitForNavigation: true,
    navigationTimeout: 30000,
    button: 'middle',
    clickCount: 1,
    elementsToMatch: 10,
    waitForEvents: [
      'DOMContentLoaded',
      'loadEventFired',
      'networkAlmostIdle',
      'networkIdle',
      'firstPaint',
      'firstContentfulPaint',
      'firstMeaningfulPaint',
    ],
    waitForStart: 100,
  },
  below('text'),
);
// ------------------------------------------
// doubleClick
// https://docs.taiko.dev/api/doubleClick
// ------------------------------------------
doubleClick('Get Started'); // $ExpectType Promise<void>
doubleClick(link('Get Started')); // $ExpectType Promise<void>
doubleClick('Get Started', { waitForNavigation: true }); // $ExpectType Promise<void>
doubleClick('Get Started', { waitForNavigation: false }, below('text')); // $ExpectType Promise<void>
doubleClick('Get Started', {
  waitForNavigation: true,
  navigationTimeout: 30000, // $ExpectError
});

// ------------------------------------------
// rightClick
// https://docs.taiko.dev/api/rightClick
// ------------------------------------------
rightClick('Get Started'); // $ExpectType Promise<void>
rightClick(link('Get Started')); // $ExpectType Promise<void>
rightClick('Get Started', { waitForNavigation: true }); // $ExpectType Promise<void>
rightClick('Get Started', { waitForNavigation: false }, below('text')); // $ExpectType Promise<void>
rightClick('Get Started', {
  waitForNavigation: true,
  navigationTimeout: 30000, // $ExpectError
});

// ------------------------------------------
// dragAndDrop
// https://docs.taiko.dev/api/dragAndDrop
// ------------------------------------------
dragAndDrop($('work'), into($('work done'))); // $ExpectType Promise<void>
dragAndDrop($('work'), { up: 10, down: 10, left: 10, right: 10 }); // $ExpectType Promise<void>
dragAndDrop($('work')); // $ExpectError
dragAndDrop($('work'), into($('work done')), { up: 10, down: 10, left: 10, right: 10 }); // $ExpectError

// ------------------------------------------
// hover
// https://docs.taiko.dev/api/hover
// ------------------------------------------
hover('Get Started'); // $ExpectType Promise<void>
hover(link('Get Started')); // $ExpectType Promise<void>
hover(link('Get Started'), { waitForEvents: ['firstMeaningfulPaint'] }); // $ExpectType Promise<void>

// ------------------------------------------
// focus
// https://docs.taiko.dev/api/focus
// ------------------------------------------
focus(textBox('Username:')); // $ExpectType Promise<void>
focus(textBox('Username:'), { waitForEvents: ['firstMeaningfulPaint'] }); // $ExpectType Promise<void>

// ------------------------------------------
// write
// https://docs.taiko.dev/api/write
// ------------------------------------------
write('admin'); // $ExpectType Promise<void>
write('admin', into(textBox('Username'))); // $ExpectType Promise<void>
// $ExpectType Promise<void>
write('admin', into(textBox('Username')), {
  delay: 0,
  waitForNavigation: true,
  waitForStart: 100,
  navigationTimeout: 30000,
  hideText: false,
  waitForEvents: ['firstMeaningfulPaint'],
});

// ------------------------------------------
// clear
// https://docs.taiko.dev/api/aaa
// ------------------------------------------

// ------------------------------------------
// attach
// https://docs.taiko.dev/api/aaa
// ------------------------------------------

// ------------------------------------------
// press
// https://docs.taiko.dev/api/aaa
// ------------------------------------------

// ------------------------------------------
// highlight
// https://docs.taiko.dev/api/aaa
// ------------------------------------------

// ------------------------------------------
// clearHighlights
// https://docs.taiko.dev/api/aaa
// ------------------------------------------

// ------------------------------------------
// mouseAction
// https://docs.taiko.dev/api/aaa
// ------------------------------------------

// ------------------------------------------
// scrollTo
// https://docs.taiko.dev/api/aaa
// ------------------------------------------

// ------------------------------------------
// scrollRight
// https://docs.taiko.dev/api/aaa
// ------------------------------------------

// ------------------------------------------
// scrollLeft
// https://docs.taiko.dev/api/aaa
// ------------------------------------------

// ------------------------------------------
// scrollUp
// https://docs.taiko.dev/api/aaa
// ------------------------------------------

// ------------------------------------------
// scrollDown
// https://docs.taiko.dev/api/aaa
// ------------------------------------------

// ------------------------------------------
// screenshot
// https://docs.taiko.dev/api/aaa
// ------------------------------------------

// ------------------------------------------
// tap
// https://docs.taiko.dev/api/aaa
// ------------------------------------------

// ------------------------------------------
// emulateTimezone
// https://docs.taiko.dev/api/aaa
// ------------------------------------------
