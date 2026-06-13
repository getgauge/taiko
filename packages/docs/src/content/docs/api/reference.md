---
title: "API Reference"
description: "Index of Taiko's public browser automation APIs."
---

Taiko APIs can be used in the recorder and in JavaScript test scripts.

```js
const { openBrowser, goto, click } = require("taiko");

(async () => {
  await openBrowser();
  await goto("google.com");
  await click("Google search");
})();
```

## Browser actions

- [`openBrowser`](/api/openbrowser/)
- [`closeBrowser`](/api/closebrowser/)
- [`client`](/api/client/)
- [`switchTo`](/api/switchto/)
- [`intercept`](/api/intercept/)
- [`emulateNetwork`](/api/emulatenetwork/)
- [`emulateDevice`](/api/emulatedevice/)
- [`setViewPort`](/api/setviewport/)
- [`resizeWindow`](/api/resizewindow/)
- [`openTab`](/api/opentab/)
- [`closeTab`](/api/closetab/)
- [`openIncognitoWindow`](/api/openincognitowindow/)
- [`closeIncognitoWindow`](/api/closeincognitowindow/)
- [`overridePermissions`](/api/overridepermissions/)
- [`clearPermissionOverrides`](/api/clearpermissionoverrides/)
- [`setCookie`](/api/setcookie/)
- [`deleteCookies`](/api/deletecookies/)
- [`getCookies`](/api/getcookies/)
- [`setLocation`](/api/setlocation/)
- [`clearIntercept`](/api/clearintercept/)

## Page actions

- [`goto`](/api/goto/)
- [`reload`](/api/reload/)
- [`goBack`](/api/goback/)
- [`goForward`](/api/goforward/)
- [`currentURL`](/api/currenturl/)
- [`title`](/api/title/)
- [`click`](/api/click/)
- [`doubleClick`](/api/doubleclick/)
- [`rightClick`](/api/rightclick/)
- [`dragAndDrop`](/api/draganddrop/)
- [`hover`](/api/hover/)
- [`focus`](/api/focus/)
- [`write`](/api/write/)
- [`clear`](/api/clear/)
- [`attach`](/api/attach/)
- [`press`](/api/press/)
- [`highlight`](/api/highlight/)
- [`clearHighlights`](/api/clearhighlights/)
- [`mouseAction`](/api/mouseaction/)
- [`scrollTo`](/api/scrollto/)
- [`scrollRight`](/api/scrollright/)
- [`scrollLeft`](/api/scrollleft/)
- [`scrollUp`](/api/scrollup/)
- [`scrollDown`](/api/scrolldown/)
- [`screenshot`](/api/screenshot/)
- [`tap`](/api/tap/)
- [`emulateTimezone`](/api/emulatetimezone/)

## Selectors

- [`$`](/api/$/)
- [`image`](/api/image/)
- [`link`](/api/link/)
- [`listItem`](/api/listitem/)
- [`button`](/api/button/)
- [`fileField`](/api/filefield/)
- [`timeField`](/api/timefield/)
- [`textBox`](/api/textbox/)
- [`dropDown`](/api/dropdown/)
- [`checkBox`](/api/checkbox/)
- [`radioButton`](/api/radiobutton/)
- [`text`](/api/text/)
- [`tableCell`](/api/tablecell/)
- [`color`](/api/color/)
- [`range`](/api/range/)

## Proximity selectors

- [`toLeftOf`](/api/toleftof/)
- [`toRightOf`](/api/torightof/)
- [`above`](/api/above/)
- [`below`](/api/below/)
- [`near`](/api/near/)
- [`within`](/api/within/)

## Events

- [`alert`](/api/alert/)
- [`prompt`](/api/prompt/)
- [`confirm`](/api/confirm/)
- [`beforeunload`](/api/beforeunload/)

## Helpers

- [`evaluate`](/api/evaluate/)
- [`to`](/api/to/)
- [`into`](/api/into/)
- [`accept`](/api/accept/)
- [`dismiss`](/api/dismiss/)
- [`setConfig`](/api/setconfig/)
- [`getConfig`](/api/getconfig/)
- [`waitFor`](/api/waitfor/)
- [`repl`](/api/repl/)
