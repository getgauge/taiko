// Custom Typings for Taiko - https://taiko.gauge.org/#/
// Custom type definitions for Taiko 1.0.5
//

declare module 'taiko' {
    export type TaikoBrowserEvent =
        | 'DOMContentLoaded'
        | 'loadEventFired'
        | 'networkAlmostIdle'
        | 'networkIdle'
        | 'firstPaint'
        | 'firstContentfulPaint'
        | 'firstMeaningfulPaint';

    export interface TaikoBrowserOptions {
        headless?: boolean;
        args?: string[];
        host?: string;
        port?: number;
        ignoreCertificateErrors?: boolean;
        observe?: boolean;
        observeTime?: number;
        dumpio?: boolean;
    }

    export interface TaikoEventOptions {
        waitForEvents?: TaikoBrowserEvent[];
    }

    export interface TaikoBasicNavigationOptions {
        waitForNavigation?: boolean;
        navigationTimeout?: number;
    }

    export interface TaikoNavigationOptions extends TaikoBasicNavigationOptions, TaikoEventOptions {
        headers?: Map<string, string>;
        waitForStart?: boolean;
    }

    export interface TaikoClickOptions extends TaikoNavigationOptions {
        button?: 'left' | 'right' | 'middle';
        clickCount?: number;
        elementsToMatch?: number;
    }

    export interface TaikoGlobalConfigurationOptions extends TaikoBasicNavigationOptions {
        observeTime?: number;
        retryInterval?: number;
        retryTimeout?: number;
    }

    export interface TaikoTapOptions extends TaikoBasicNavigationOptions, TaikoEventOptions {}

    export interface TaikoKeyOptions extends TaikoNavigationOptions {
        text?: string;
        delay?: number;
    }

    export interface TaikoWriteOptions extends TaikoNavigationOptions {
        delay?: number;
        hideText?: boolean;
    }

    export interface TaikoSearchElement {
        [key: string]: any;
    }

    export interface TaikoScreenshotOptions {
        path?: string;
        fullPage?: boolean;
    }

    export interface TaikoElementWrapper {
        description: string;
        get(selector: TaikoSearchElement): TaikoElementWrapper;
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

    export type TaikoInterceptRedirectUrl = string;
    export interface TaikoInterceptMockData {
        [key: string]: any;
    }
    export interface TaikoInterceptRequest {
        continue(url: string);
        respond(response: TaikoInterceptMockData);
    }
    export type taikoInterceptRequestHandler = (request: TaikoInterceptRequest) => Promise<void>;

    export interface TaikoViewPortScreenOrientation {
        type: 'portraitPrimary' | 'portraitSecondary' | 'landscapePrimary' | 'landscapeSecondary';
        angle: number;
    }
    export interface TaikoViewPort {
        x: number;
        y: number;
        width: number;
        height: number;
        scale: number;
    }
    export interface TaikoViewPortOptions {
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
        screenOrientation?: TaikoViewPortScreenOrientation;
        viewport?: TaikoViewPort;
    }

    export interface TaikoCookieOptions {
        url?: string;
        domain?: string;
        path?: string;
    }

    export interface TaikoCookieDetailOptions extends TaikoCookieOptions {
        secure?: boolean;
        httpOnly?: boolean;
        sameSite?: string;
        expires?: number;
    }

    export interface TaikoLocationOptions {
        latitude: number;
        longitude: number;
        accuracy: number;
    }

    export interface TaikoDragAndDropDistance {
        up: number;
        down: number;
        left: number;
        right: number;
    }

    export interface TaikoMouseCoordinates {
        x: number;
        y: number;
    }

    export interface TaikoProximitySelectorNearOptions {
        offset: number;
    }

    export interface TaikoEvaluateElementOptions {
        [key: string]: any;
    }

    /**
     * Browser Actions
     **/

    // https://taiko.gauge.org/#openbrowser
    export function openBrowser(options?: TaikoBrowserOptions): Promise<void>;
    // https://taiko.gauge.org/#closebrowser
    export function closeBrowser(): Promise<void>;
    // https://taiko.gauge.org/#client
    export function client(): any; // TODO: no TS Bindings available: https://github.com/cyrus-and/chrome-remote-interface/issues/112
    // https://taiko.gauge.org/#switchto
    export function switchTo(targetUrl: string): Promise<void>;
    // https://taiko.gauge.org/#intercept
    // https://github.com/getgauge/taiko/issues/98#issuecomment-42024186
    export function intercept(requestUrl: string, options?: TaikoInterceptMockData | taikoInterceptRequestHandler | TaikoInterceptRedirectUrl): Promise<void>;
    // https://taiko.gauge.org/#emulatenetwork
    export function emulateNetwork(
        networkType: 'GPRS' | 'Regular2G' | 'Good2G' | 'Good3G' | 'Regular3G' | 'Regular4G' | 'DSL' | 'WiFi, Offline'
    ): Promise<void>;
    // https://taiko.gauge.org/#emulatedevice
    export function emulateDevice(deviceModel: string);
    // https://taiko.gauge.org/#setviewport
    export function setViewPort(options: TaikoViewPortOptions): Promise<void>;
    // https://taiko.gauge.org/#opentab
    export function openTab(targetUrl: string, options?: TaikoNavigationOptions): Promise<void>;
    // https://taiko.gauge.org/#closetab
    export function closeTab(targetUrl: string): Promise<void>;
    // https://taiko.gauge.org/#overridepermissions
    export function overridePermissions(origin: string, permissions: string[]): Promise<void>;
    // https://taiko.gauge.org/#clearpermissionoverrides
    export function clearPermissionOverrides(): Promise<void>;
    // https://taiko.gauge.org/#setcookie
    export function setCookie(name: string, value: string, options?: TaikoCookieDetailOptions): Promise<void>;
    // https://taiko.gauge.org/#deletecookies
    export function deleteCookies(cookieName?: string, options?: TaikoCookieOptions): Promise<void>;
    // https://taiko.gauge.org/#getcookies
    export function getCookies(options?: { urls: string[] }): Promise<Object[]>;
    // https://taiko.gauge.org/#setlocation
    export function setLocation(options: TaikoLocationOptions): Promise<void>;

    /**
     * Page Actions
     */

    // https://taiko.gauge.org/#goto
    export function goto(url: string, options?: TaikoNavigationOptions): Promise<void>;
    // https://taiko.gauge.org/#reload
    export function reload(url: string, options?: TaikoNavigationOptions): Promise<void>;
    // https://taiko.gauge.org/#goback
    export function goBack(options?: TaikoNavigationOptions): Promise<void>;
    // https://taiko.gauge.org/#goforward
    export function goForward(options?: TaikoNavigationOptions): Promise<void>;
    // https://taiko.gauge.org/#title
    export function title(): Promise<string>;
    // https://taiko.gauge.org/#click
    export function click(selector: string | TaikoSearchElement, options?: TaikoClickOptions, args?: string[]): Promise<void>;
    // https://taiko.gauge.org/#doubleclick
    export function doubleClick(selector: string | TaikoSearchElement, options?: TaikoBasicNavigationOptions, args?: string[]): Promise<void>;
    // https://taiko.gauge.org/#rightclick
    export function rightClick(selector: string | TaikoSearchElement, options?: TaikoBasicNavigationOptions, args?: string[]): Promise<void>;
    // https://taiko.gauge.org/#draganddrop
    export function dragAndDrop(
        source: string | TaikoSearchElement,
        destination: string | TaikoSearchElement,
        distance: TaikoDragAndDropDistance
    ): Promise<void>;
    // https://taiko.gauge.org/#hover
    export function hover(selector: string | TaikoSearchElement, options?: TaikoEventOptions): Promise<void>;
    // https://taiko.gauge.org/#focus
    export function focus(selector: string | TaikoSearchElement, options?: TaikoEventOptions): Promise<void>;
    // https://taiko.gauge.org/#write
    export function write(text: string, into?: TaikoSearchElement, options?: TaikoWriteOptions): Promise<void>;
    // https://taiko.gauge.org/#clear
    export function clear(selector: string | TaikoSearchElement, options?: TaikoNavigationOptions): Promise<void>;
    // https://taiko.gauge.org/#attach
    export function attach(filepath: string, to: string | TaikoSearchElement): Promise<void>;
    // https://taiko.gauge.org/#press
    export function press(keys: string | string[], options?: TaikoKeyOptions): Promise<void>;
    // https://taiko.gauge.org/#highlight
    export function highlight(selector: string | TaikoSearchElement): Promise<void>;
    // https://taiko.gauge.org/#mouseaction
    export function mouseAction(action: string, coordinates: TaikoMouseCoordinates, options?: TaikoNavigationOptions): Promise<void>;
    // https://taiko.gauge.org/#scrollto
    export function scrollTo(selector: string | TaikoSearchElement, options?: TaikoEventOptions): Promise<void>;
    // https://taiko.gauge.org/#scrollright
    export function scrollRight(selector?: string | TaikoSearchElement | number, px?: number): Promise<void>;
    // https://taiko.gauge.org/#scrollleft
    export function scrollLeft(selector?: string | TaikoSearchElement | number, px?: number): Promise<void>;
    // https://taiko.gauge.org/#scrollup
    export function scrollUp(selector?: string | TaikoSearchElement | number, px?: number): Promise<void>;
    // https://taiko.gauge.org/#scrolldown
    export function scrollDown(selector?: string | TaikoSearchElement | number, px?: number): Promise<void>;
    // https://taiko.gauge.org/#screenshot
    export function screenshot(options?: TaikoScreenshotOptions, ...args: TaikoSearchElement[]): Promise<Buffer>;
    // https://taiko.gauge.org/#tap
    export function tap(selector: string | TaikoSearchElement, options?: TaikoTapOptions, ...args: TaikoSearchElement[]): Promise<void>;

    /**
     * Selectors
     */

    // https://taiko.gauge.org/#dollar
    export function $(selector: string, ...args: TaikoSearchElement[]): TaikoSearchElement;
    // https://taiko.gauge.org/#image
    export function image(selector: string | TaikoSearchElement, ...args: TaikoSearchElement[]): TaikoSearchElement;
    // https://taiko.gauge.org/#link
    export function link(selector: string | TaikoSearchElement, ...args: TaikoSearchElement[]): TaikoSearchElement;
    // https://taiko.gauge.org/#listitem
    export function listItem(selector: string | TaikoSearchElement, ...args: TaikoSearchElement[]): TaikoSearchElement;
    // https://taiko.gauge.org/#button
    export function button(selector: string | TaikoSearchElement, ...args: TaikoSearchElement[]): TaikoSearchElement;
    // https://taiko.gauge.org/#inputfield
    export function inputField(selector: string | TaikoSearchElement, ...args: TaikoSearchElement[]): TaikoElementWrapper;
    // https://taiko.gauge.org/#filefield
    export function fileField(selector: string | TaikoSearchElement, ...args: TaikoSearchElement[]): TaikoElementWrapper;
    // https://taiko.gauge.org/#textbox
    export function textBox(selector: string | TaikoSearchElement, ...args: TaikoSearchElement[]): TaikoElementWrapper;
    // https://taiko.gauge.org/#combobox
    export function comboBox(selector: string | TaikoSearchElement, ...args: TaikoSearchElement[]): TaikoElementWrapper;
    // https://taiko.gauge.org/#dropdown
    export function dropDown(selector: string | TaikoSearchElement, ...args: TaikoSearchElement[]): TaikoElementWrapper;
    // https://taiko.gauge.org/#checkbox
    export function checkBox(selector: string | TaikoSearchElement, ...args: TaikoSearchElement[]): TaikoElementWrapper;
    // https://taiko.gauge.org/#radiobutton
    export function radioButton(selector: string | TaikoSearchElement, ...args: TaikoSearchElement[]): TaikoElementWrapper;
    // https://taiko.gauge.org/#text
    export function text(selector: string, ...args: TaikoSearchElement[]): TaikoElementWrapper;

    /**
     * Proximity Selectors
     */

    // https://taiko.gauge.org/#toleftof
    export function toLeftOf(selector: string | TaikoSearchElement | TaikoElementWrapper): TaikoSearchElement;
    // https://taiko.gauge.org/#torightof
    export function toRightOf(selector: string | TaikoSearchElement | TaikoElementWrapper): TaikoSearchElement;
    // https://taiko.gauge.org/#above
    export function above(selector: string | TaikoSearchElement | TaikoElementWrapper): TaikoSearchElement;
    // https://taiko.gauge.org/#below
    export function below(selector: string | TaikoSearchElement | TaikoElementWrapper): TaikoSearchElement;
    // https://taiko.gauge.org/#near
    export function near(selector: string | TaikoSearchElement | TaikoElementWrapper, opts?: TaikoProximitySelectorNearOptions): TaikoSearchElement;

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
        selector?: string | TaikoSearchElement,
        handlerCallback?: (element: HTMLElement, args?: TaikoEvaluateElementOptions) => Object,
        options?: TaikoNavigationOptions
    ): Promise<Object>;
    // https://taiko.gauge.org/#intervalsecs
    export function intervalSecs(secs: number): number;
    // https://taiko.gauge.org/#timeoutsecs
    export function timeoutSecs(secs: number): number;
    // https://taiko.gauge.org/#to
    export function to(value: string | TaikoSearchElement): string | TaikoSearchElement;
    // https://taiko.gauge.org/#into
    export function into(value: string | TaikoSearchElement): string | TaikoSearchElement;
    // https://taiko.gauge.org/#accept
    export function accept(text?: string): Promise<void>;
    // https://taiko.gauge.org/#dismiss
    export function dismiss(text?: string): Promise<void>;
    // https://taiko.gauge.org/#setconfig
    export function setConfig(options: TaikoGlobalConfigurationOptions): void;
    // https://taiko.gauge.org/#currenturl
    export function currentURL(): Promise<string>;
    // https://taiko.gauge.org/#waitfor
    export function waitFor(time: number): Promise<void>;
    export function waitFor(element: string, time: number): Promise<void>;
}
