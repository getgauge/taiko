/* eslint-disable no-undef */
import { accept, alert, beforeunload, confirm, dismiss, prompt } from "..";

// ------------------------------------------
// alert
// https://docs.taiko.dev/api/alert
// ------------------------------------------
alert("Are you sure", async () => await accept()); // $ExpectType void
alert("Are you sure", async () => await dismiss()); // $ExpectType void
alert(/^Close.*$/, async () => await accept()); // $ExpectType void
// $ExpectType void
alert(async ({ message }) => {
  if (message === "Are you sure?") {
    await accept();
  }
});

// ------------------------------------------
// prompt
// https://docs.taiko.dev/api/prompt
// ------------------------------------------
prompt("Message", async () => await accept("something")); // $ExpectType void
prompt("Message", async () => await dismiss()); // $ExpectType void
prompt(/^Please.+$name/, async () => await accept("NAME")); // $ExpectType void
// $ExpectType void
prompt(async ({ message }) => {
  if (message === "Please enter your age?") {
    await accept("20");
  }
});

// ------------------------------------------
// confirm
// https://docs.taiko.dev/api/confirm
// ------------------------------------------
confirm("Message", async () => await accept()); // $ExpectType void
confirm("Message", async () => await dismiss()); // $ExpectType void
confirm(/^Are.+$sure/, async () => await accept()); // $ExpectType void
// $ExpectType void
confirm(async ({ message }) => {
  if (message === "Continue?") {
    await accept();
  } else {
    await dismiss();
  }
});

// ------------------------------------------
// beforeunload
// https://docs.taiko.dev/api/beforeunload
// ------------------------------------------
beforeunload(async () => await accept()); // $ExpectType void
beforeunload(async () => await dismiss()); // $ExpectType void
