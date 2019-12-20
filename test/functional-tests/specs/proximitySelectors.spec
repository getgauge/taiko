# Proximity Selectors
## Below

* Navigate to "http://localhost:3001/"
* Click link "Frames" below

   |Type|Selector           |
   |----|-------------------|
   |link|Form Authentication|

## Near by

tags: knownIssue

* Navigate to relative path "./specs/data/HTMLElements.html"
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

* Navigate to "http://localhost:3001/"
* Click "Horizontal Slider"
* Assert Exists

   |Type|Selector|
   |----|--------|
   |text|See     |
* Click link to right of

   |Type|Selector|
   |----|--------|
   |text|See     |

* Assert title to be "the-internet-express/README.md at master · getgauge-contrib/the-internet-express"
