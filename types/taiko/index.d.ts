// Custom Typings for Taiko - https://taiko.gauge.org/#/
// Custom type definitions for Taiko 1.0.5
//

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
        headers?: Map<string, string>;
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
        accuracy: number;
    }

    export interface ProximitySelectorNearOptions {
        offset: number;
    }

    export interface EvaluateElementOptions {
        [key: string]: any;
    }

    export interface SelectionOptions {
        selectHiddenElement: boolean;
    }

    export interface MatchingOptions {
        exactMatch: boolean;
    }

    /**
     * Elements, Selectors and Searches
     */

    export interface Element {
        nodeId: string;
        description?: string;
        runtimeHandler?: any;
        get(): string;
        text(): string;
        isVisible?(): boolean;
        create?(nodeIds: string[], runtimeHandler?: any);
        isDisabled?(): boolean;
    };

    export interface ElementWrapper {
        description: string;
        get(selector: SearchElement): ElementWrapper;
        text(): string;
        value(): string;
        select(): void;
        check(): void;
        uncheck(): void;
        isChecked(): boolean;
        deselect(): void;
        isSelected(): boolean;
        exists(): boolean;
    }

    // BasicSelector mimics isSelector
    export interface BasicSelector {
        elements: Element[] | Node[] | string[];
        exists(): boolean;
        [key: string]: any;
    };

    export interface MatchingNode { elem: Element, dist: number };

    /**
     * a relative search element is returned by proximity methods such as near,
     */
    export interface RelativeSearchElement {
        desc: string;
        condition(element: Element, value: number): boolean;
        findProximityElementRects(): { elem: Element, result: any }; // result is wrapped in a callback
        validNodes(nodeId: Element): MatchingNode;
    }

    // isSelector also allows ElementWrapper instances
    export type Selector = BasicSelector | ElementWrapper;

    // SearchElement mimics isSelector, isString, isElement and also allows relative search elements
    export type SearchElement = string | Selector | Element | RelativeSearchElement;

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

    // https://taiko.gauge.org/#openbrowser
    export function openBrowser(options?: BrowserOptions): Promise<void>;
    // https://taiko.gauge.org/#closebrowser
    export function closeBrowser(): Promise<void>;
    // https://taiko.gauge.org/#client
    export function client(): any; // TODO: no TS Bindings available: https://github.com/cyrus-and/chrome-remote-interface/issues/112
    // https://taiko.gauge.org/#switchto
    export function switchTo(targetUrl: string): Promise<void>;
    // https://taiko.gauge.org/#intercept
    // https://github.com/getgauge/taiko/issues/98#issuecomment-42024186
    export function intercept(requestUrl: string, options?: InterceptMockData | interceptRequestHandler | InterceptRedirectUrl): Promise<void>;
    // https://taiko.gauge.org/#emulatenetwork
    export function emulateNetwork(
        networkType: 'GPRS' | 'Regular2G' | 'Good2G' | 'Good3G' | 'Regular3G' | 'Regular4G' | 'DSL' | 'WiFi, Offline'
    ): Promise<void>;
    // https://taiko.gauge.org/#emulatedevice
    export function emulateDevice(deviceModel: string);
    // https://taiko.gauge.org/#setviewport
    export function setViewPort(options: ViewPortOptions): Promise<void>;
    // https://taiko.gauge.org/#opentab
    export function openTab(targetUrl: string, options?: NavigationOptions): Promise<void>;
    // https://taiko.gauge.org/#closetab
    export function closeTab(targetUrl: string): Promise<void>;
    // https://taiko.gauge.org/#overridepermissions
    export function overridePermissions(origin: string, permissions: string[]): Promise<void>;
    // https://taiko.gauge.org/#clearpermissionoverrides
    export function clearPermissionOverrides(): Promise<void>;
    // https://taiko.gauge.org/#setcookie
    export function setCookie(name: string, value: string, options?: CookieDetailOptions): Promise<void>;
    // https://taiko.gauge.org/#deletecookies
    export function deleteCookies(cookieName?: string, options?: CookieOptions): Promise<void>;
    // https://taiko.gauge.org/#getcookies
    export function getCookies(options?: { urls: string[] }): Promise<Object[]>;
    // https://taiko.gauge.org/#setlocation
    export function setLocation(options: LocationOptions): Promise<void>;

    /**
     * Page Actions
     */

    // https://taiko.gauge.org/#goto
    export function goto(url: string, options?: NavigationOptions): Promise<void>;
    // https://taiko.gauge.org/#reload
    export function reload(url: string, options?: NavigationOptions): Promise<void>;
    // https://taiko.gauge.org/#goback
    export function goBack(options?: NavigationOptions): Promise<void>;
    // https://taiko.gauge.org/#goforward
    export function goForward(options?: NavigationOptions): Promise<void>;
    // https://taiko.gauge.org/#title
    export function title(): Promise<string>;
    // https://taiko.gauge.org/#click
    export function click(selector: SearchElement | MouseCoordinates, options?: ClickOptions, ...args: RelativeSearchElement[]): Promise<void>;
    // https://taiko.gauge.org/#doubleclick
    export function doubleClick(selector: SearchElement | MouseCoordinates, options?: BasicNavigationOptions, ...args: RelativeSearchElement[]): Promise<void>;
    // https://taiko.gauge.org/#rightclick
    export function rightClick(selector: SearchElement | MouseCoordinates, options?: BasicNavigationOptions, ...args: RelativeSearchElement[]): Promise<void>;
    // https://taiko.gauge.org/#draganddrop
    export function dragAndDrop(
        source: SearchElement,
        destination: SearchElement,
        distance: DragAndDropDistance
    ): Promise<void>;
    // https://taiko.gauge.org/#hover
    export function hover(selector: SearchElement, options?: NavigationOptions): Promise<void>;
    // https://taiko.gauge.org/#focus
    export function focus(selector: SearchElement, options?: EventOptions): Promise<void>;
    // https://taiko.gauge.org/#write
    export function write(text: string, into?: SearchElement, options?: WriteOptions): Promise<void>;
    // https://taiko.gauge.org/#clear
    export function clear(selector: SearchElement, options?: NavigationOptions): Promise<void>;
    // https://taiko.gauge.org/#attach
    export function attach(filepath: string, to: SearchElement): Promise<void>;
    // https://taiko.gauge.org/#press
    export function press(keys: string | string[], options?: KeyOptions): Promise<void>;
    // https://taiko.gauge.org/#highlight
    export function highlight(selector: SearchElement): Promise<void>;
    // https://taiko.gauge.org/#mouseaction
    export function mouseAction(action: 'press' | 'move' | 'release', coordinates: MouseCoordinates, options?: NavigationOptions): Promise<void>;
    // https://taiko.gauge.org/#scrollto
    export function scrollTo(selector: SearchElement, options?: EventOptions): Promise<void>;
    // https://taiko.gauge.org/#scrollright
    export function scrollRight(selector?: SearchElement | number, px?: number): Promise<void>;
    // https://taiko.gauge.org/#scrollleft
    export function scrollLeft(selector?: SearchElement | number, px?: number): Promise<void>;
    // https://taiko.gauge.org/#scrollup
    export function scrollUp(selector?: SearchElement | number, px?: number): Promise<void>;
    // https://taiko.gauge.org/#scrolldown
    export function scrollDown(selector?: SearchElement | number, px?: number): Promise<void>;
    // https://taiko.gauge.org/#screenshot
    export function screenshot(options?: ScreenshotOptions, ...args: SearchElement[]): Promise<Buffer>;
    // https://taiko.gauge.org/#tap
    export function tap(selector: SearchElement, options?: TapOptions, ...args: SearchElement[]): Promise<void>;

    /**
     * Selectors
     */

    // https://taiko.gauge.org/#dollar
    export function $(selector: string, ...args: SearchElement[]): Selector;
    // https://taiko.gauge.org/#image
    export function image(selector: SearchElement, ...args: SearchElement[]): SearchElement;
    // https://taiko.gauge.org/#link
    export function link(selector: SearchElement, ...args: SearchElement[]): SearchElement;
    // https://taiko.gauge.org/#listitem
    export function listItem(selector: SearchElement, ...args: SearchElement[]): SearchElement;
    // https://taiko.gauge.org/#button
    export function button(selector: SearchElement, ...args: SearchElement[]): SearchElement;
    // https://taiko.gauge.org/#inputfield
    export function inputField(selector: SearchElement, ...args: SearchElement[]): ElementWrapper;
    // https://taiko.gauge.org/#filefield
    export function fileField(selector: SearchElement, ...args: SearchElement[]): ElementWrapper;
    // https://taiko.gauge.org/#textbox
    export function textBox(selector: SearchElement, ...args: SearchElement[]): ElementWrapper;
    // https://taiko.gauge.org/#combobox
    export function comboBox(selector: SearchElement, ...args: SearchElement[]): ElementWrapper;
    // https://taiko.gauge.org/#dropdown
    export function dropDown(selector: SearchElement, ...args: SearchElement[]): ElementWrapper;
    // https://taiko.gauge.org/#checkbox
    export function checkBox(selector: SearchElement, ...args: SearchElement[]): ElementWrapper;
    // https://taiko.gauge.org/#radiobutton
    export function radioButton(selector: SearchElement, options?: SelectionOptions, ...args: SearchElement[]): ElementWrapper;
    // https://taiko.gauge.org/#text
    export function text(selector: string, options?: MatchingOptions, ...args: SearchElement[]): ElementWrapper;

    /**
     * Proximity Selectors
     */

    // https://taiko.gauge.org/#toleftof
    export function toLeftOf(selector: SearchElement | ElementWrapper): RelativeSearchElement;
    // https://taiko.gauge.org/#torightof
    export function toRightOf(selector: SearchElement | ElementWrapper): RelativeSearchElement;
    // https://taiko.gauge.org/#above
    export function above(selector: SearchElement | ElementWrapper): RelativeSearchElement;
    // https://taiko.gauge.org/#below
    export function below(selector: SearchElement | ElementWrapper): RelativeSearchElement;
    // https://taiko.gauge.org/#near
    export function near(selector: SearchElement | ElementWrapper, opts?: ProximitySelectorNearOptions): RelativeSearchElement;

    /**
     * Events
     */

    // https://taiko.gauge.org/#prompt
    export function prompt(message: string, callback: Function): void;
    // https://taiko.gauge.org/#confirm
    export function confirm(message: string, callback: Function): void;
    // https://taiko.gauge.org/#beforeunload
    export function beforeunload(message: string, callback: Function): void;

    /**
     * Helpers
     */

    // https://taiko.gauge.org/#evaluate
    export function evaluate(
        selector?: SearchElement,
        handlerCallback?: (element: HTMLElement, args?: EvaluateElementOptions) => Object,
        options?: NavigationOptions
    ): Promise<Object>;
    // https://taiko.gauge.org/#intervalsecs
    export function intervalSecs(secs: number): number;
    // https://taiko.gauge.org/#timeoutsecs
    export function timeoutSecs(secs: number): number;
    // https://taiko.gauge.org/#to
    export function to(value: SearchElement): SearchElement;
    // https://taiko.gauge.org/#into
    export function into(value: SearchElement): SearchElement;
    // https://taiko.gauge.org/#accept
    export function accept(text?: string): Promise<void>;
    // https://taiko.gauge.org/#dismiss
    export function dismiss(text?: string): Promise<void>;
    // https://taiko.gauge.org/#setconfig
    export function setConfig(options: GlobalConfigurationOptions): void;
    // https://taiko.gauge.org/#currenturl
    export function currentURL(): Promise<string>;
    // https://taiko.gauge.org/#waitfor
    export function waitFor(time: number): Promise<void>;
    export function waitFor(element: SearchElement, time: number): Promise<void>;
}
