// Custom Typings for Taiko - https://docs.taiko.dev/api/reference

declare module 'taiko' {
  export type BrowserEvent =
    | 'DOMContentLoaded'
    | 'loadEventFired'
    | 'networkAlmostIdle'
    | 'networkIdle'
    | 'firstPaint'
    | 'firstContentfulPaint'
    | 'firstMeaningfulPaint';

  /**
   * Options
   */

  export interface BrowserOptions {
    headless?: boolean;
    args?: string[];
    host?: string;
    port?: number;
    ignoreCertificateErrors?: boolean;
    observe?: boolean;
    observeTime?: number;
    dumpio?: boolean;
  }

  export interface EventOptions {
    waitForEvents?: BrowserEvent[];
  }

  export interface BasicNavigationOptions {
    waitForNavigation?: boolean;
    navigationTimeout?: number;
  }

  export interface NavigationOptions extends BasicNavigationOptions, EventOptions {
    headers?: object;
    waitForStart?: boolean;
  }

  export interface ClickOptions extends NavigationOptions {
    button?: 'left' | 'right' | 'middle';
    clickCount?: number;
    elementsToMatch?: number;
  }

  export interface GlobalConfigurationOptions extends BasicNavigationOptions {
    observeTime?: number;
    retryInterval?: number;
    retryTimeout?: number;
  }

  export interface TapOptions extends BasicNavigationOptions, EventOptions {}

  export interface KeyOptions extends NavigationOptions {
    text?: string;
    delay?: number;
  }

  export interface WriteOptions extends NavigationOptions {
    delay?: number;
    hideText?: boolean;
  }

  export interface ScreenshotOptions {
    path?: string;
    fullPage?: boolean;
    encoding?: string;
  }

  export interface ViewPortOptions {
    width: number;
    height: number;
    deviceScaleFactor?: number;
    mobile?: boolean;
    scale?: number;
    screenWidth?: number;
    screenHeight?: number;
    positionX?: number;
    positionY?: number;
    dontSetVisibleSize?: boolean;
    screenOrientation?: ViewPortScreenOrientation;
    viewport?: ViewPort;
  }

  export interface CookieOptions {
    url?: string;
    domain?: string;
    path?: string;
  }

  export interface CookieDetailOptions extends CookieOptions {
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: string;
    expires?: number;
  }

  export interface LocationOptions {
    latitude: number;
    longitude: number;
    accuracy?: number;
  }

  export interface ProximitySelectorNearOptions {
    offset: number;
  }

  export interface EvaluateElementOptions {
    [key: string]: any;
  }

  export interface SelectionOptions {
    selectHiddenElements: boolean;
  }

  export interface MatchingOptions {
    exactMatch: boolean;
  }

  export interface OpenWindowOptions extends NavigationOptions {
    name: string;
  }

  export interface BasicResponse {
    url: string;
    status: { code: number; text: string };
  }

  export interface Response extends BasicResponse {
    redirectedResponse?: BasicResponse[];
  }

  /**
   * Elements, Selectors and Searches
   */

  export interface Element {
    objectId: string;
    description?: string;
    runtimeHandler?: any;
    get(): string;
    text(): Promise<string>;
    isVisible?(): Promise<boolean>;
    create?(objectIds: string[], runtimeHandler?: any);
    isDisabled?(): Promise<boolean>;
  }

  export interface ElementWrapper {
    description: string;
    get(selector: SearchElement): ElementWrapper;
    text(): Promise<string>;
    value(): Promise<string>;
    select(value?: string | number): Promise<void>;
    check(): Promise<void>;
    uncheck(): Promise<void>;
    isChecked(): Promise<boolean>;
    deselect(): Promise<void>;
    isSelected(): Promise<boolean>;
    exists(retryInterval?: number, retryTimeout?: number): Promise<boolean>;
  }

  // BasicSelector mimics isSelector
  export interface BasicSelector {
    elements: Element[] | Node[] | string[];
    exists(retryInterval?: number, retryTimeout?: number): Promise<boolean>;
    [key: string]: any;
  }

  export interface MatchingNode {
    elem: Element;
    dist: number;
  }

  /**
   * a relative search element is returned by proximity methods such as near,
   */
  export interface RelativeSearchElement {
    desc: string;
    condition(element: Element, value: number): boolean;
    findProximityElementRects(): { elem: Element; result: any }; // result is wrapped in a callback
    validNodes(objectId: Element): MatchingNode;
  }

  // isSelector also allows ElementWrapper instances
  export type Selector = BasicSelector | ElementWrapper;

  // SearchElement mimics isSelector, isString, isElement and also allows relative search elements
  export type SearchElement = string | Selector | Element | RelativeSearchElement | object;

  /**
   * Intercept
   */

  export type InterceptRedirectUrl = string;

  export interface InterceptMockData {
    [key: string]: any;
  }
  export interface InterceptRequest {
    continue(url: string);
    respond(response: InterceptMockData);
  }
  export type interceptRequestHandler = (request: InterceptRequest) => Promise<void>;

  /**
   * Viewport
   */

  export interface ViewPortScreenOrientation {
    type: 'portraitPrimary' | 'portraitSecondary' | 'landscapePrimary' | 'landscapeSecondary';
    angle: number;
  }
  export interface ViewPort {
    x: number;
    y: number;
    width: number;
    height: number;
    scale: number;
  }

  /**
   * Distances
   */

  export interface DragAndDropDistance {
    up: number;
    down: number;
    left: number;
    right: number;
  }

  /**
   * Coordinates
   */

  export interface MouseCoordinates {
    x: number;
    y: number;
  }

  /**
   * Browser Actions
   **/

  // https://docs.taiko.dev/api/openbrowser
  export function openBrowser(options?: BrowserOptions): Promise<void>;
  // https://docs.taiko.dev/api/closebrowser
  export function closeBrowser(): Promise<void>;
  // https://docs.taiko.dev/api/client
  export function client(): any; // TODO: no TS Bindings available: https://github.com/cyrus-and/chrome-remote-interface/issues/112
  // https://docs.taiko.dev/api/switchto
  export function switchTo(targetUrl: string): Promise<void>;
  // https://docs.taiko.dev/api/intercept
  // https://github.com/getgauge/taiko/issues/98#issuecomment-42024186
  export function intercept(
    requestUrl: string,
    options?: InterceptMockData | interceptRequestHandler | InterceptRedirectUrl,
  ): Promise<void>;
  // https://docs.taiko.dev/api/emulatenetwork
  export function emulateNetwork(
    networkType:
      | 'GPRS'
      | 'Regular2G'
      | 'Good2G'
      | 'Good3G'
      | 'Regular3G'
      | 'Regular4G'
      | 'DSL'
      | 'WiFi'
      | 'Offline'
      | {
          offline?: boolean;
          downloadThroughput?: number;
          uploadThroughput?: number;
          latency?: number;
        },
  ): Promise<void>;
  // https://docs.taiko.dev/api/emulatedevice
  export function emulateDevice(deviceModel: string);
  // https://docs.taiko.dev/api/setviewport
  export function setViewPort(options: ViewPortOptions): Promise<void>;
  // https://docs.taiko.dev/api/emulateTimezone
  export function emulateTimezone(timezoneId: string): Promise<void>;
  // https://docs.taiko.dev/api/opentab
  export function openTab(targetUrl: string, options?: NavigationOptions): Promise<void>;
  // https://docs.taiko.dev/api/closetab
  export function closeTab(targetUrl?: string): Promise<void>;
  // https://docs.taiko.dev/api/openincognitowindow
  export function openIncognitoWindow(
    url?: string | OpenWindowOptions,
    options?: OpenWindowOptions,
  ): Promise<void>;
  // https://docs.taiko.dev/api/closeincognitowindow
  export function closeIncognitoWindow(name: string): Promise<void>;
  // https://docs.taiko.dev/api/overridepermissions
  export function overridePermissions(origin: string, permissions: string[]): Promise<void>;
  // https://docs.taiko.dev/api/clearpermissionoverrides
  export function clearPermissionOverrides(): Promise<void>;
  // https://docs.taiko.dev/api/setcookie
  export function setCookie(
    name: string,
    value: string,
    options?: CookieDetailOptions,
  ): Promise<void>;
  // https://docs.taiko.dev/api/deletecookies
  export function deleteCookies(cookieName?: string, options?: CookieOptions): Promise<void>;
  // https://docs.taiko.dev/api/getcookies
  export function getCookies(options?: { urls: string[] }): Promise<Record<string, any>[]>;
  // https://docs.taiko.dev/api/setlocation
  export function setLocation(options: LocationOptions): Promise<void>;

  /**
   * Page Actions
   */

  // https://docs.taiko.dev/api/goto
  export function goto(url: string, options?: NavigationOptions): Promise<Response>;
  // https://docs.taiko.dev/api/reload
  export function reload(url?: string, options?: NavigationOptions): Promise<void>;
  // https://docs.taiko.dev/api/goback
  export function goBack(options?: NavigationOptions): Promise<void>;
  // https://docs.taiko.dev/api/goforward
  export function goForward(options?: NavigationOptions): Promise<void>;
  // https://docs.taiko.dev/api/title
  export function title(): Promise<string>;
  // https://docs.taiko.dev/api/click
  export function click(
    selector: SearchElement | MouseCoordinates,
    options?: ClickOptions,
    ...args: RelativeSearchElement[]
  ): Promise<void>;
  // https://docs.taiko.dev/api/doubleclick
  export function doubleClick(
    selector: SearchElement | MouseCoordinates,
    options?: BasicNavigationOptions,
    ...args: RelativeSearchElement[]
  ): Promise<void>;
  // https://docs.taiko.dev/api/rightclick
  export function rightClick(
    selector: SearchElement | MouseCoordinates,
    options?: BasicNavigationOptions,
    ...args: RelativeSearchElement[]
  ): Promise<void>;
  // https://docs.taiko.dev/api/draganddrop
  export function dragAndDrop(
    source: SearchElement,
    destination?: SearchElement,
    distance?: DragAndDropDistance,
  ): Promise<void>;
  // https://docs.taiko.dev/api/hover
  export function hover(selector: SearchElement, options?: NavigationOptions): Promise<void>;
  // https://docs.taiko.dev/api/focus
  export function focus(selector: SearchElement, options?: NavigationOptions): Promise<void>;
  // https://docs.taiko.dev/api/write
  export function write(text: string, into?: SearchElement, options?: WriteOptions): Promise<void>;
  // https://docs.taiko.dev/api/clear
  export function clear(selector: SearchElement, options?: NavigationOptions): Promise<void>;
  // https://docs.taiko.dev/api/attach
  export function attach(filepath: string, to: SearchElement): Promise<void>;
  // https://docs.taiko.dev/api/press
  export function press(keys: string | string[], options?: KeyOptions): Promise<void>;
  // https://docs.taiko.dev/api/highlight
  export function highlight(
    selector: SearchElement,
    ...args: RelativeSearchElement[]
  ): Promise<void>;
  // https://docs.taiko.dev/api/mouseaction
  export function mouseAction(
    selector: SearchElement | 'press' | 'move' | 'release',
    action?: 'press' | 'move' | 'release' | MouseCoordinates,
    coordinates?: MouseCoordinates | NavigationOptions,
    options?: NavigationOptions,
  ): Promise<void>;
  // https://docs.taiko.dev/api/scrollto
  export function scrollTo(selector: SearchElement, options?: NavigationOptions): Promise<void>;
  // https://docs.taiko.dev/api/scrollright
  export function scrollRight(selector?: SearchElement | number, px?: number): Promise<void>;
  // https://docs.taiko.dev/api/scrollleft
  export function scrollLeft(selector?: SearchElement | number, px?: number): Promise<void>;
  // https://docs.taiko.dev/api/scrollup
  export function scrollUp(selector?: SearchElement | number, px?: number): Promise<void>;
  // https://docs.taiko.dev/api/scrolldown
  export function scrollDown(selector?: SearchElement | number, px?: number): Promise<void>;
  // https://docs.taiko.dev/api/screenshot
  export function screenshot(
    options?: ScreenshotOptions,
    ...args: SearchElement[]
  ): Promise<Buffer>;
  // https://docs.taiko.dev/api/tap
  export function tap(
    selector: SearchElement,
    options?: TapOptions,
    ...args: SearchElement[]
  ): Promise<void>;

  /**
   * Selectors
   */

  // https://docs.taiko.dev/api/$
  export function $(selector: string, ...args: RelativeSearchElement[]): Selector;
  // https://docs.taiko.dev/api/image
  export function image(
    selector: SearchElement,
    options?: SelectionOptions | RelativeSearchElement,
    ...args: RelativeSearchElement[]
  ): SearchElement;
  // https://docs.taiko.dev/api/link
  export function link(
    selector: SearchElement,
    options?: SelectionOptions | RelativeSearchElement,
    ...args: SearchElement[]
  ): SearchElement;
  // https://docs.taiko.dev/api/listitem
  export function listItem(
    selector: SearchElement,
    ...args: RelativeSearchElement[]
  ): SearchElement;
  // https://docs.taiko.dev/api/button
  export function button(
    selector: SearchElement,
    options?: SelectionOptions | RelativeSearchElement,
    ...args: RelativeSearchElement[]
  ): SearchElement;
  // https://docs.taiko.dev/api/filefield
  export function fileField(
    selector: SearchElement,
    options?: SelectionOptions | RelativeSearchElement,
    ...args: RelativeSearchElement[]
  ): ElementWrapper;
  // https://docs.taiko.dev/api/textbox
  export function textBox(
    selector: SearchElement,
    ...args: RelativeSearchElement[]
  ): ElementWrapper;
  // https://docs.taiko.dev/api/dropdown
  export function dropDown(
    selector: SearchElement,
    options?: SelectionOptions | RelativeSearchElement,
    ...args: RelativeSearchElement[]
  ): ElementWrapper;
  // https://docs.taiko.dev/api/checkbox
  export function checkBox(
    selector: SearchElement,
    options?: SelectionOptions | RelativeSearchElement,
    ...args: RelativeSearchElement[]
  ): ElementWrapper;
  // https://docs.taiko.dev/api/radiobutton
  export function radioButton(
    selector: SearchElement,
    options?: SelectionOptions | RelativeSearchElement,
    ...args: RelativeSearchElement[]
  ): ElementWrapper;
  // https://docs.taiko.dev/api/text
  export function text(
    selector: string,
    options?: MatchingOptions | RelativeSearchElement,
    ...args: RelativeSearchElement[]
  ): ElementWrapper;

  /**
   * Proximity Selectors
   */

  // https://docs.taiko.dev/api/toleftof
  export function toLeftOf(selector: SearchElement | ElementWrapper): RelativeSearchElement;
  // https://docs.taiko.dev/api/torightof
  export function toRightOf(selector: SearchElement | ElementWrapper): RelativeSearchElement;
  // https://docs.taiko.dev/api/above
  export function above(selector: SearchElement | ElementWrapper): RelativeSearchElement;
  // https://docs.taiko.dev/api/below
  export function below(selector: SearchElement | ElementWrapper): RelativeSearchElement;
  // https://docs.taiko.dev/api/near
  export function near(
    selector: SearchElement | ElementWrapper,
    opts?: ProximitySelectorNearOptions,
  ): RelativeSearchElement;

  /**
   * Events
   */
  export interface DialogValue {
    message: string;
    type: string;
    url: string;
    defaultPrompt: string;
  }

  export type DialogHandler = (value: DialogValue) => void;

  // https://docs.taiko.dev/api/alert
  export function alert(
    messageOrCallback: string | RegExp | DialogHandler,
    callback?: DialogHandler,
  ): void;
  // https://docs.taiko.dev/api/prompt
  export function prompt(
    messageOrCallback: string | RegExp | DialogHandler,
    callback?: DialogHandler,
  ): void;
  // https://docs.taiko.dev/api/confirm
  export function confirm(
    messageOrCallback: string | RegExp | DialogHandler,
    callback?: DialogHandler,
  ): void;

  // https://docs.taiko.dev/api/beforeunload
  export function beforeunload(message: string, callback: Function): void;

  /**
   * Helpers
   */

  // https://docs.taiko.dev/api/evaluate
  export function evaluate(
    selector?: SearchElement,
    handlerCallback?: (element: HTMLElement, args?: EvaluateElementOptions) => Record<string, any>,
    options?: NavigationOptions,
  ): Promise<Record<string, any>>;
  // https://docs.taiko.dev/api/intervalsecs
  export function intervalSecs(secs: number): number;
  // https://docs.taiko.dev/api/timeoutsecs
  export function timeoutSecs(secs: number): number;
  // https://docs.taiko.dev/api/to
  export function to(value: SearchElement): SearchElement;
  // https://docs.taiko.dev/api/into
  export function into(value: SearchElement): SearchElement;
  // https://docs.taiko.dev/api/accept
  export function accept(text?: string): Promise<void>;
  // https://docs.taiko.dev/api/dismiss
  export function dismiss(text?: string): Promise<void>;
  // https://docs.taiko.dev/api/setconfig
  export function setConfig(options: GlobalConfigurationOptions): void;
  // https://docs.taiko.dev/api/currenturl
  export function currentURL(): Promise<string>;
  // https://docs.taiko.dev/api/waitfor
  export function waitFor(time: number): Promise<void>;
  export function waitFor(element: SearchElement, time: number): Promise<void>;
  export function waitFor(condition: () => Promise<boolean>, time: number): Promise<void>;
  export function clearIntercept(requestUrl?: string): void;
}
