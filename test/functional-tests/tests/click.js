'use strict';
const assert = require('assert');
var _selectors = require('./selectors')

const {
    link, click,below,image,above,toRightOf,toLeftOf,button,rightClick
} = require('taiko');

step("Click link <userlink> below <table>", async function (userlink,table) {
    await click(link(userlink,below(_selectors.getElement(table))));
});

step("Click an element that contains <text>", async function (text) {
    await click(text);
});

step("Click link <userlink>", async function(userlink) {
    await click(link(userlink));
});

step("Click <selector> with timeout <timeout>", async function(selector,timeout) {
    await click(link(selector),{timeout:timeout});
});

step("Click <selector>", async function(selector) {
    await click(selector);
});

step("Click image above <table>", async function(table) {
    var element = _selectors.getElement(table);
    await click(image(above(element)));
});

step("Click link to right of <table>", async function(table) {
    await click(link(toRightOf(_selectors.getElement(table))));
});

step("Click link to left of <table>", async function(table){
    await click(link(toLeftOf(_selectors.getElement(table))));
});

step("Click link below <table>", async function(table) {
    await click(link(below(_selectors.getElement(table))));
});

step("Click button <selector>", async function(selector) {
    await click(button(selector));
});

step("Right click <table>", async function(table) {
    await rightClick(_selectors.getElement(table))
});