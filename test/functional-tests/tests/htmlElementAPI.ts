'use strict';
import assert = require('assert');
import _path = require('path');
import {
  goto,
  $,
  fileField,
  textBox,
  button,
  dropDown,
  checkBox,
  radioButton,
  range,
  click,
  write,
  attach,
  focus,
  scrollTo,
  scrollRight,
  scrollLeft,
  scrollUp,
  scrollDown,
  to,
  into,
  dismiss,
  accept,
  intercept,
  toRightOf,
  alert,
  clearIntercept,
  SearchElement,
  DialogHandler,
} from 'taiko';

import { Step, ContinueOnFailure } from 'gauge-ts';
export default class HtmlElementAPI {
  @Step('Navigate to <url>')
  public async navigate(url: string) {
    await goto(url);
  }

  @Step('Navigate to <url> with basic auth <username> and <password>')
  public async navigateWithBasicAuth(url: string, username: any, password: any) {
    const encodedCredentials = Buffer.from(`${username}:${password}`).toString('base64');
    await goto(url, {
      headers: { Authorization: `Basic ${encodedCredentials}` },
    });
  }

  @Step('Ensure Drop down <dropDownName> exists')
  public async dropdownExists(dropDownName: string) {
    const box = dropDown(dropDownName);
    assert.ok(await box.exists());
  }

  @Step('Select <value> of Drop down <dropDownName>. The value now should be <fieldValue>')
  public async selectDropDownValue(value: string | number, dropDownName: string, fieldValue: any) {
    const box = dropDown(dropDownName);
    await box.select(value);
    assert.equal(await box.value(), fieldValue);
  }

  @Step('Ensure Check Box <checkBoxName> exists')
  public async checkboxExists(checkBoxName: string) {
    const box = checkBox(checkBoxName);
    assert.ok(await box.exists());
  }

  @Step('Check the value of Check Box <checkBoxName>')
  public async checkboxValue(checkBoxName: string) {
    const box = checkBox(checkBoxName);
    await box.check();
    assert.ok(await box.isChecked());
  }

  @Step('Radio Button <label>')
  public async radioButton(label: SearchElement) {
    const button = radioButton(label);
    assert.ok(await button.exists());
    await button.select();
    assert.ok(await button.isSelected());
  }

  @Step('Assert radioButton <label> selected')
  public async isRadioButtonChecked(label: SearchElement) {
    const button = radioButton(label);
    assert.ok(await button.isSelected());
  }

  @Step('Ensure Range <rangeName> exists')
  public async rangeExists(rangeName: string) {
    const rangeInput = range(rangeName);
    assert.ok(await rangeInput.exists());
  }

  @Step('Select the value of Range <rangeName> to <rangeValue>')
  public async rangeValue(rangeName: string, rangeValue: string) {
    const rangeInput = range(rangeName);
    await rangeInput.select(rangeValue);
    assert.equal(await rangeInput.value(), rangeValue);
  }

  @Step('Attach file <fileName> to file field <FileFieldName>')
  public async attachFile(fileName: string, FileFieldName: SearchElement) {
    const field = fileField(FileFieldName);
    await attach(fileName, to(field));
    assert.ok((await field.value()).endsWith(fileName));
  }

  @Step('Get value <text> of Text Box <textBoxName>')
  public async getTextboxValue(text: any, textBoxName: string) {
    const field = textBox(textBoxName);
    assert.equal(await field.value(), text);
  }

  @Step('An existing Text Box <textBoxName> value should give exists true')
  public async textBoxExists(textBoxName: string) {
    const field = textBox(textBoxName);
    assert.ok(await field.exists());
  }

  @Step('Write <text> into Text Box <textBoxName>')
  public async writeInto(text: string, textBoxName: any) {
    await write(text, into(textBoxName));
  }

  @Step('Write <text> into TextBox with name <textboxName>')
  public async writeWithName(text: string, textBoxName: any) {
    await write(text, into(textBox({ name: textBoxName })));
  }

  @Step('Write <text> to Text Box <textBoxName>')
  public async writeTo(text: string, textBoxName: any) {
    await write(text, to(textBoxName));
  }

  @Step('Focus on Text Box to right of <textBoxName>')
  public async focusToRightOf(textBoxName: SearchElement) {
    await focus(textBox(toRightOf(textBoxName)));
  }

  @ContinueOnFailure()
  @Step('Scroll the page right by pixels <pixels>')
  public async scrollPageByPixel(pixels: string) {
    await scrollRight(parseInt(pixels, 10));
  }

  @ContinueOnFailure()
  @Step('Scroll element <element> right by pixels <pixels>')
  public async scrollElement(element: string, pixels: string) {
    await scrollRight($(element), parseInt(pixels, 10));
  }

  @ContinueOnFailure()
  @Step('Scroll the page left')
  public async scrollLeft() {
    await scrollLeft();
  }

  @Step('Wait for Accept message <message> on click of button <buttonName>')
  public async waitForAccept(message: string | RegExp | DialogHandler, buttonName: SearchElement) {
    alert(message, async () => await accept());

    await click(button(buttonName));
  }

  @Step('Wait for dismiss message <message> on click of button <buttonName>')
  public async waitForDismiss(message: string | RegExp | DialogHandler, buttonName: SearchElement) {
    alert(message, async () => await dismiss());

    await click(button(buttonName));
  }

  @Step('Respond to <url> with <responseBody>')
  public async interceptResponse(url: string, responseBody: any) {
    await intercept(url, { body: responseBody });
  }

  @Step('Respond to <url> with json <jsonString>')
  public async respondJSON(url: string, jsonString: string) {
    await intercept(url, { body: JSON.parse(jsonString) });
  }

  @Step('Intercept <url> and continue with postData <mockData>')
  public async interceptRequest(url: string, mockData: any) {
    await intercept(url, (request) => {
      request.continue({ postData: mockData });
    });
  }

  @Step('Intercept <url> and continue')
  public async interceptRequestAndContinue(url: string) {
    await intercept(url, (request) => {
      request.continue();
    });
  }

  @Step('Navigate to relative path <relativePath>')
  public async navigateToPath(relativePath: string) {
    const absolutePath = _path.resolve(relativePath);
    await goto('file:///' + absolutePath);
  }

  @ContinueOnFailure()
  @Step('Scroll to element <div>')
  public async ScrollToElement(div: string) {
    await scrollTo($(div));
  }

  @ContinueOnFailure()
  @Step('Scroll the page left by pixels <pixels>')
  public async scrollPageLeftByPixel(pixels: string) {
    await scrollLeft(parseInt(pixels, 10));
  }

  @ContinueOnFailure()
  @Step('Scroll element <element> left by pixels <pixels>')
  public async scrollElementLeftByPixel(element: string, pixels: string) {
    await scrollLeft($(element), parseInt(pixels, 10));
  }

  @ContinueOnFailure()
  @Step('Scroll the page right')
  public async scrollRight() {
    await scrollRight();
  }

  @ContinueOnFailure()
  @Step('Scroll the page up by pixels <pixels>')
  public async scrollUp(pixels: string) {
    await scrollUp(parseInt(pixels, 10));
  }

  @Step('Scroll element <element> up by pixels <pixels>')
  public async scrollElementUp(element: string, pixels: string) {
    await scrollUp($(element), parseInt(pixels, 10));
  }

  @ContinueOnFailure()
  @Step('Scroll the page up')
  public async scrollPageUp() {
    await scrollUp();
  }

  @ContinueOnFailure()
  @Step('Scroll the page down by pixels <pixels>')
  public async scrollPageDownByPixel(pixels: string) {
    await scrollDown(parseInt(pixels, 10));
  }

  @ContinueOnFailure()
  @Step('Scroll element <element> down by pixels <pixels>')
  public async scrollElementDown(element: string, pixels: string) {
    await scrollDown($(element), parseInt(pixels, 10));
  }

  @ContinueOnFailure()
  @Step('Scroll the page down')
  public async scrollPageDown() {
    await scrollDown();
  }

  @Step('Navigate to relative path <path> with timeout <timeout> ms')
  public async navigateToPathWithTimeout(path: string, timeout: any) {
    const absolutePath = _path.resolve(path);
    await goto('file:///' + absolutePath, {
      navigationTimeout: timeout,
    });
  }

  @Step('Navigate to <url> with timeout <timeout> ms')
  public async navigateToURLWithTimeout(url: string, timeout: any) {
    await goto(url, { navigationTimeout: timeout });
  }

  @Step('Reset intercept for <url>')
  public async resetInterceptForURL(url: string) {
    clearIntercept(url);
  }

  @Step('Reset all intercept')
  public async resetAllIntercept() {
    clearIntercept();
  }
}
