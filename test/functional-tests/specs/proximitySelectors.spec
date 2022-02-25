# Proximity Selectors
## Below

* Navigate to "http://localhost:3001/"
* Click link "Frames" below

   |Type|Selector           |
   |----|-------------------|
   |link|Form Authentication|

## Near by

tags: knownIssue

* Navigate to "http://localhost:3002/HTMLElements.html"
* Write "Blah" into Input Field near

   |Type|Selector  |
   |----|----------|
   |text|First Name|
* Assert text "Blah" exists on the page.

## Above

* Navigate to "http://localhost:3001/"
* Click link "Dynamic Loading"
* Click link above

   |Type|Selector                                  |
   |----|------------------------------------------|
   |text|Example 2: Element rendered after the fact|
* Assert Exists

   |Type|Selector                      |
   |----|------------------------------|
   |text|Start                         |

## Right Of

* Navigate to "http://localhost:3002/MouseMoveTest.html"
* Click button to right of 

   |Type  |Selector|
   |------|--------|
   |button|button 2 |

* Assert text "Button4" exists on the page.
