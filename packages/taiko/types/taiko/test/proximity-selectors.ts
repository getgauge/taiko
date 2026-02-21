/* eslint-disable no-undef */
import { above, below, near, textBox, toLeftOf, toRightOf } from "..";

// ------------------------------------------
// toLeftOf
// https://docs.taiko.dev/api/toLeftOf
// ------------------------------------------
toLeftOf("name"); // $ExpectType RelativeSearchElement
toLeftOf(textBox("name")); // $ExpectType RelativeSearchElement

// ------------------------------------------
// toRightOf
// https://docs.taiko.dev/api/toRightOf
// ------------------------------------------
toRightOf("name"); // $ExpectType RelativeSearchElement
toRightOf(textBox("name")); // $ExpectType RelativeSearchElement

// ------------------------------------------
// above
// https://docs.taiko.dev/api/above
// ------------------------------------------
above("name"); // $ExpectType RelativeSearchElement
above(textBox("name")); // $ExpectType RelativeSearchElement

// ------------------------------------------
// below
// https://docs.taiko.dev/api/below
// ------------------------------------------
below("name"); // $ExpectType RelativeSearchElement
below(textBox("name")); // $ExpectType RelativeSearchElement

// ------------------------------------------
// near
// https://docs.taiko.dev/api/near
// ------------------------------------------
near("name"); // $ExpectType RelativeSearchElement
near(textBox("name")); // $ExpectType RelativeSearchElement
