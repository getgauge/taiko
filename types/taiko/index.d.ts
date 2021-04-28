// Minimum TypeScript Version: 3.5

// Custom Typings for Taiko - https://docs.taiko.dev/api/reference

// eslint-disable-next-line no-unused-vars
import Protocol from 'devtools-protocol';

export type Cookie = Protocol.Network.Cookie;

export type BrowserEvent =
  | 'DOMContentLoaded'
  | 'loadEventFired'
  | 'networkAlmostIdle'
  | 'networkIdle'
  | 'firstPaint'
  | 'firstContentfulPaint'
  | 'firstMeaningfulPaint'
  | 'targetNavigated';

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

export interface VeryBasicNavigationOptions extends ForceOption {
  waitForNavigation?: boolean;
}

export interface BasicNavigationOptions extends VeryBasicNavigationOptions {
  navigationTimeout?: number;
}

export interface NavigationOptions extends BasicNavigationOptions, EventOptions {
  headers?: object;
  waitForStart?: number;
}

export interface ReloadOptions extends NavigationOptions {
  ignoreCache?: boolean;
}

export interface ClickOptions extends NavigationOptions, ForceOption {
  button?: 'left' | 'right' | 'middle';
  clickCount?: number;
  position: string;
  elementsToMatch?: number;
}

export interface GlobalConfigurationOptions {
  navigationTimeout?: number;
  observeTime?: number;
  retryInterval?: number;
  retryTimeout?: number;
  noOfElementToMatch?: number;
  observe?: boolean;
  waitForNavigation?: boolean;
  waitForEvents?: BrowserEvent[];
  ignoreSSLErrors?: boolean;
  headful?: boolean;
  criConnectionRetries?: number;
  firefox?: boolean;
  highlightOnAction?: 'true' | 'false';
  local?: boolean;
}

export interface TapOptions extends BasicNavigationOptions, EventOptions, ForceOption {}

export interface KeyOptions extends NavigationOptions {
  text?: string;
  delay?: number;
}

export interface WriteOptions extends NavigationOptions, ForceOption {
  delay?: number;
  hideText?: boolean;
}

export interface ScreenshotOptions {
  path?: string;
  fullPage?: boolean;
  encoding?: string;
}

// TODO: remove this type declaration and replace with devtools-protocol Emulation.SetDeviceMetricsOverrideRequest
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

export interface ResizeWindowOptions {
  height?: number;
  width?: number;
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

export interface EvaluateHandlerArgs {
  [key: string]: any;
}

export interface EvaluateOptions extends Omit<NavigationOptions, 'headers'> {
  args?: EvaluateHandlerArgs;
}

export interface DollarOptions {
  args?: any;
}

export interface TableCellOptions {
  row: number;
  col: number;
}

export interface MatchingOptions {
  exactMatch?: boolean;
}

export interface OpenWindowOrTabOptions extends NavigationOptions {
  name: string;
}

export interface BasicResponse {
  url: string;
  status: { code: number; text: string };
}

export interface Response extends BasicResponse {
  redirectedResponse?: BasicResponse[];
}

export interface ForceOption {
  force?: boolean;
}

export interface ForcedNavigationOptions extends NavigationOptions, ForceOption {}

/**
 * Elements, Selectors and Searches
 */

export interface Element {
  objectId: string;
  description?: string;
  runtimeHandler?: any;
  get(): string;
  text(): Promise<string>;
  value(): Promise<string>;
  select(value?: string | number): Promise<void>;
  check(): Promise<void>;
  uncheck(): Promise<void>;
  isChecked(): Promise<boolean>;
  deselect(): Promise<void>;
  isSelected(): Promise<boolean>;
  isVisible(): Promise<boolean>;
  create(objectIds: string[], runtimeHandler?: any): Element[];
  isDisabled(): Promise<boolean>;
  isDraggable(): Promise<boolean>;
}

export interface ElementWrapper {
  get(retryInterval?: number, retryTimeout?: number): Promise<ElementWrapper>;
  readonly description: string;
  exists(retryInterval?: number, retryTimeout?: number): Promise<boolean>;
  text(): Promise<string>;
  isVisible(retryInterval?: number, retryTimeout?: number): Promise<boolean>;
  isDisabled(retryInterval?: number, retryTimeout?: number): Promise<boolean>;
  isDraggable(retryInterval?: number, retryTimeout?: number): Promise<boolean>;
  attribute(name: string): Promise<string>;
  elements(retryInterval?: number, retryTimeout?: number): Promise<Element[]>;
  element(index: number, retryInterval?: number, retryTimeout?: number): Promise<Element>;
}

export interface ValueWrapper extends ElementWrapper {
  value(): Promise<string>;
}

export interface ButtonWrapper extends ElementWrapper {}
export interface DollarWrapper extends ElementWrapper {}
export interface ImageWrapper extends ElementWrapper {}
export interface LinkWrapper extends ElementWrapper {}
export interface ListItemWrapper extends ElementWrapper {}
export interface TableCellWrapper extends ElementWrapper {}
export interface TextWrapper extends ElementWrapper {}

export interface ColorWrapper extends ValueWrapper {
  select(value?: string | number): Promise<void>;
}

export interface FileFieldWrapper extends ValueWrapper {}
export interface TextBoxWrapper extends ValueWrapper {}

export interface DropDownWrapper extends ValueWrapper {
  select(value?: string | number | string[] | number[] | { index: number[] }): Promise<void>;
}
export interface TimeFieldWrapper extends ValueWrapper {
  select(value?: string | number): Promise<void>;
}
export interface RangeWrapper extends ValueWrapper {
  select(value?: string | number): Promise<void>;
}

export interface CheckBoxWrapper extends ElementWrapper {
  check(): Promise<void>;
  uncheck(): Promise<void>;
  isChecked(): Promise<boolean>;
}

export interface RadioButtonWrapper extends ElementWrapper {
  select(value?: string | number): Promise<void>;
  deselect(): Promise<void>;
  isSelected(): Promise<boolean>;
}

// BasicSelector mimics isSelector
export interface BasicSelector {
  elements: Element[] | MatchingNode[] | string[];
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

export interface AttrValuePairs {
  [key: string]: string;
}
/**
 * Intercept
 */

export type InterceptRedirectUrl = string;

export interface InterceptMockData {
  [key: string]: any;
}
export interface InterceptRequest {
  continue(overrides?: {
    url?: string;
    method?: string;
    postData?: string;
    headers?: Record<string, unknown>;
  }): Promise<void>;
  respond(response: InterceptMockData): Promise<void>;
  requestId: string;
  request: {
    url: string;
    method: string;
    headers: { [key: string]: string };
    postData?: string;
    hasPostData: boolean;
    postDataEntries: Array<{ bytes: string }>;
    initialPriority: string;
    referrerPolicy: string;
  };
  frameId: string;
  resourceType: string;
  networkId: string;
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
 */

// https://docs.taiko.dev/api/openbrowser
export function openBrowser(options?: BrowserOptions): Promise<void>;
// https://docs.taiko.dev/api/closebrowser
export function closeBrowser(): Promise<void>;
// https://docs.taiko.dev/api/client
export function client(): any; // TODO: no TS Bindings available: https://github.com/cyrus-and/chrome-remote-interface/issues/112
// https://docs.taiko.dev/api/switchto
// TODO: fix corresponding JSDoc in lib/taiko.js
export function switchTo(target: RegExp | OpenWindowOrTabOptions): Promise<void>;
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
export function emulateDevice(deviceModel: string): Promise<void>;
// https://docs.taiko.dev/api/setviewport
export function setViewPort(options: ViewPortOptions): Promise<void>;
export function resizeWindow(options: ResizeWindowOptions): Promise<void>;
// https://docs.taiko.dev/api/emulateTimezone
export function emulateTimezone(timezoneId: string): Promise<void>;
// https://docs.taiko.dev/api/opentab
export function openTab(
  targetUrl?: string | OpenWindowOrTabOptions,
  options?: OpenWindowOrTabOptions,
): Promise<void>;
// https://docs.taiko.dev/api/closetab
export function closeTab(targetUrl?: string | RegExp): Promise<void>;
// https://docs.taiko.dev/api/openincognitowindow
export function openIncognitoWindow(
  url?: string | OpenWindowOrTabOptions,
  options?: OpenWindowOrTabOptions,
): Promise<void>;
// https://docs.taiko.dev/api/closeincognitowindow
export function closeIncognitoWindow(name: string): Promise<void>;
// https://docs.taiko.dev/api/overridepermissions
// TODO: use the proper type for the second param from devtools-protocol
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
export function getCookies(options?: { urls: string[] }): Promise<Cookie[]>;
// https://docs.taiko.dev/api/setlocation
export function setLocation(options: LocationOptions): Promise<void>;

/**
 * Page Actions
 */

// https://docs.taiko.dev/api/goto
export function goto(url: string, options?: NavigationOptions): Promise<Response>;
// https://docs.taiko.dev/api/reload
export function reload(url?: string, options?: ReloadOptions): Promise<void>;
// https://docs.taiko.dev/api/goback
export function goBack(options?: NavigationOptions): Promise<void>;
// https://docs.taiko.dev/api/goforward
export function goForward(options?: NavigationOptions): Promise<void>;
// https://docs.taiko.dev/api/title
export function title(): Promise<string>;
// https://docs.taiko.dev/api/click
export function click(
  selector: SearchElement | MouseCoordinates,
  options?: ClickOptions | RelativeSearchElement,
  ...args: RelativeSearchElement[]
): Promise<void>;
// https://docs.taiko.dev/api/doubleclick
export function doubleClick(
  selector: SearchElement | MouseCoordinates,
  options?: VeryBasicNavigationOptions | RelativeSearchElement,
  ...args: RelativeSearchElement[]
): Promise<void>;
// https://docs.taiko.dev/api/rightclick
export function rightClick(
  selector: SearchElement | MouseCoordinates,
  options?: VeryBasicNavigationOptions | RelativeSearchElement,
  ...args: RelativeSearchElement[]
): Promise<void>;
// https://docs.taiko.dev/api/draganddrop
export function dragAndDrop(
  source: SearchElement,
  destinationOrDistance: SearchElement | DragAndDropDistance,
  options?: ForceOption,
): Promise<void>;
// https://docs.taiko.dev/api/hover
export function hover(selector: SearchElement, options?: ForcedNavigationOptions): Promise<void>;
// https://docs.taiko.dev/api/focus
export function focus(selector: SearchElement, options?: ForcedNavigationOptions): Promise<void>;
// https://docs.taiko.dev/api/write
export function write(text: string, into?: SearchElement, options?: WriteOptions): Promise<void>;
// https://docs.taiko.dev/api/clear
export function clear(selector?: SearchElement, options?: ForcedNavigationOptions): Promise<void>;
// https://docs.taiko.dev/api/attach
export function attach(filepath: string, to: SearchElement, options?: ForceOption): Promise<void>;
// https://docs.taiko.dev/api/press
export function press(keys: string | string[], options?: KeyOptions): Promise<void>;
// https://docs.taiko.dev/api/highlight
export function highlight(selector: SearchElement, ...args: RelativeSearchElement[]): Promise<void>;
// https://docs.taiko.dev/api/clearHighlights
export function clearHighlights(): Promise<void>;
// https://docs.taiko.dev/api/mouseaction
export function mouseAction(
  selector: SearchElement | 'press' | 'move' | 'release',
  action?: 'press' | 'move' | 'release' | MouseCoordinates,
  coordinates?: MouseCoordinates | NavigationOptions,
  options?: ForcedNavigationOptions,
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
  selector?: SearchElement,
  options?: ScreenshotOptions,
): Promise<Buffer | undefined>;
// https://docs.taiko.dev/api/tap
export function tap(
  selector: SearchElement,
  options?: TapOptions | RelativeSearchElement,
  ...args: SearchElement[]
): Promise<void>;

/**
 * Selectors
 */

// https://docs.taiko.dev/api/$
export function $(
  selector: string | ((args?: any) => any),
  _options?: DollarOptions | RelativeSearchElement,
  ...args: RelativeSearchElement[]
): DollarWrapper;
// https://docs.taiko.dev/api/image
export function image(
  selector: SearchElement,
  options?: RelativeSearchElement,
  ...args: RelativeSearchElement[]
): ImageWrapper;
// https://docs.taiko.dev/api/link
export function link(
  selector: SearchElement,
  options?: RelativeSearchElement,
  ...args: SearchElement[]
): LinkWrapper;
// https://docs.taiko.dev/api/listitem
export function listItem(
  selector: SearchElement,
  options?: RelativeSearchElement,
  ...args: RelativeSearchElement[]
): ListItemWrapper;
// https://docs.taiko.dev/api/button
export function button(
  selector: SearchElement,
  options?: RelativeSearchElement,
  ...args: RelativeSearchElement[]
): ButtonWrapper;
// https://docs.taiko.dev/api/filefield
export function fileField(
  selector: SearchElement,
  options?: RelativeSearchElement,
  ...args: RelativeSearchElement[]
): FileFieldWrapper;
// https://docs.taiko.dev/api/timefield
export function timeField(
  selector: SearchElement,
  options?: RelativeSearchElement,
  ...args: RelativeSearchElement[]
): TimeFieldWrapper;
// https://docs.taiko.dev/api/range
export function range(
  selector: SearchElement,
  options?: RelativeSearchElement,
  ...args: RelativeSearchElement[]
): RangeWrapper;
// https://docs.taiko.dev/api/color
export function color(
  selector: SearchElement,
  options?: RelativeSearchElement,
  ...args: RelativeSearchElement[]
): ColorWrapper;
// https://docs.taiko.dev/api/tableCell
export function tableCell(
  options?: TableCellOptions | SearchElement,
  selector?: SearchElement,
  ...args: RelativeSearchElement[]
): TableCellWrapper;
// https://docs.taiko.dev/api/textbox
export function textBox(
  labelOrAttrValuePairs?: string | AttrValuePairs | RelativeSearchElement,
  options?: RelativeSearchElement,
  ...args: RelativeSearchElement[]
): TextBoxWrapper;
// https://docs.taiko.dev/api/dropdown
export function dropDown(
  labelOrAttrValuePairs?: string | AttrValuePairs | RelativeSearchElement,
  options?: RelativeSearchElement,
  ...args: RelativeSearchElement[]
): DropDownWrapper;
// https://docs.taiko.dev/api/checkbox
export function checkBox(
  labelOrAttrValuePairs?: string | AttrValuePairs | RelativeSearchElement,
  options?: RelativeSearchElement,
  ...args: RelativeSearchElement[]
): CheckBoxWrapper;
// https://docs.taiko.dev/api/radiobutton
export function radioButton(
  selector: SearchElement,
  options?: RelativeSearchElement,
  ...args: RelativeSearchElement[]
): RadioButtonWrapper;
// https://docs.taiko.dev/api/text
export function text(
  selector: string | RegExp,
  options?: MatchingOptions | RelativeSearchElement,
  ...args: RelativeSearchElement[]
): TextWrapper;

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
// https://docs.taiko.dev/api/within
export function within(selector: SearchElement | ElementWrapper): RelativeSearchElement;
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
export function beforeunload(callback: () => Promise<void>): void;

export type EvaluateHandler<T> = (element: HTMLElement, args?: EvaluateHandlerArgs) => T;

/**
 * Helpers
 */

// https://docs.taiko.dev/api/evaluate
export function evaluate<T>(
  selector?: Selector | string | EvaluateHandler<T>,
  handlerCallback?: EvaluateHandler<T>,
  options?: EvaluateOptions,
): Promise<T>;
// https://docs.taiko.dev/api/to
export function to<T extends string | Selector>(value: T): T;
// https://docs.taiko.dev/api/into
export function into<T extends SearchElement>(value: T): T;
// https://docs.taiko.dev/api/accept
export function accept(text?: string): Promise<void>;
// https://docs.taiko.dev/api/dismiss
export function dismiss(): Promise<void>;
// https://docs.taiko.dev/api/setconfig
export function setConfig(options: GlobalConfigurationOptions): void;
// https://docs.taiko.dev/api/getconfig
export function getConfig(): GlobalConfigurationOptions;
export function getConfig<T extends keyof GlobalConfigurationOptions>(
  option: T,
): Required<GlobalConfigurationOptions>[T];
// https://docs.taiko.dev/api/currenturl
export function currentURL(): Promise<string>;
// https://docs.taiko.dev/api/waitfor
export function waitFor(time: number): Promise<void>;
export function waitFor(
  elementOrCondition: SearchElement | (() => Promise<boolean>),
  time?: number,
): Promise<void>;
export function clearIntercept(requestUrl?: string): void;

// TODO
// trying to support recorder.repl, not sure this is the right approach
// export namespace recorder {
//   export function repl(): Promise<void>;
// }
