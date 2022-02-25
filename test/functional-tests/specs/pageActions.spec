# Page Actions
## Scroll To, Up

* Navigate to "http://localhost:3001/"
* Scroll to

   |Type|Selector    |
   |----|------------|
   |link|The Internet|

* Scroll up

   |Type|Selector|
   |----|--------|
   |text|Welcome |

## Write, Press, Click
* Navigate to "http://localhost:3002/HTMLElements.html"
* Write "John" into Input Field near

   |Type|Selector  |
   |----|----------|
   |text|First Name|
* Press "Tab"
* Write "Wick"
* Click link "Smith"

## Double Click
* Assert text "Hello World" does not exist
* Navigate to "http://localhost:3002/doubleClick.html"
* Double click

   |Type|Selector    |
   |----|------------|
   |text|Double-click|
* Assert text "Hello World" exists on the page.

## Right Click

* Navigate to "http://localhost:3002/rightClick.html"
* Right click

   |Type|Selector   |
   |----|-----------|
   |text|Someelement|
* Click "Share On Facebook"

## Hover
* Navigate to "http://localhost:3002/hovers.html"
* Hover on element

   |Type|Selector        |
   |----|----------------|
   |$   |".figure"|
* Assert text "View profile" exists on the page.

## Drag and drop
* Navigate to "http://localhost:3001/drag_and_drop"
* Drag "#column-a" and drop to "#column-b"
* Drag "#column-b" and drop at

   |direction|pixel|
   |---------|-----|
   |right    |300  |

## Validate Current Url
* Navigate to "http://localhost:3001/"
* Assert url host is "localhost"

## Tap
* Navigate to "http://localhost:3002/touch.html"
* Tap on "Click"
* Assert tap on screen

## clear api should work on textArea
* Navigate to "http://localhost:3002/HTMLElements.html"
* Write "hello" into textArea to left of

   |Type   |Selector|
   |-------|--------|
   |textBox|Username|
* Press "Enter"
* Write "how"
* Press "Enter"
* Write "are you?"
* Press "Enter"
* clear textArea to left of 

   |Type   |Selector|
   |-------|--------|
   |textBox|Username|
* Assert text " " exists on the textArea.

   |Type   |Selector|
   |-------|--------|
   |textBox|Username|

## Navigate within Page
* Navigate to "http://localhost:3002/samePageNavigation.html#gauge-navigation"
* Navigate to "http://localhost:3002/samePageNavigation.html#gauge-navigation"

## Goto with basic authentication
* Navigate to "http://localhost:3001/basic_auth" with basic auth "admin" and "admin"
* Assert text "Congratulations! You must have the proper credentials." exists on the page.

