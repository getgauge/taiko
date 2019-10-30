# Browser Action

## Switch To
* Navigate to "http://localhost:3001/"
* Click "The Internet"
* Switch to tab with title "The Internet Express"
* Assert Exists

   |Type|Selector                       |
   |----|-------------------------------|
   |text|Welcome to the-internet-express|

## Open/Close Tab
* Navigate to relative path "./specs/data/sample.html"
* Open Tab "http://localhost:3001/"
* Assert title to be "The Internet"
* Close Tab "http://localhost:3001/"
TODO: Add this step when Open/Close tab fix for headful
Assert title to be "Document"


## Close Tab with no parameters
* Navigate to relative path "./specs/data/sample.html"
* Open Tab "http://localhost:3001/dropdown"
* Open Tab "http://localhost:3001/"
* Close Tab
* Close Tab
* Assert title to be "Document"

## Reload
* Navigate to relative path "./specs/data/HTMLElements.html"
* Write "hello" into textArea to left of

   |Type   |Selector|
   |-------|--------|
   |textBox|Username|
* Reload the page
* assert text should be empty into

   |Type   |Selector|
   |-------|--------|
   |textBox|Username|

## Reload should not clear local cache
* Navigate to relative path "./specs/data/localStorage.html"
* Write "flow" into TextBox with name "username"
* Click "Submit"
* Reload the page
* Assert text "flow" exists on the page.

## Get all cookies
* Navigate to "http://localhost:3001/"
* set cookie with "org" and "gauge"
* Assert cookies to be present
* delete cookie with "org"


## Cookie should be present for valid options urls
* Navigate to "http://localhost:3001/"
* set cookie with "org" and "gauge"
* Assert cookie with valid options url "http://localhost:3001/"
* delete cookie with "org"

## Cookie not should be present for invalid options urls
* Navigate to relative path "./specs/data/sample.html"
* Assert cookie with invalid options url "http://localhost:3001/"

## Set mock location
* Override browser permission with "geolocation" for site "http://localhost:3001/"
* Setlocation with longitude as "78.040009" and latitude as "27.1752868"
* Navigate to "http://localhost:3001/"
* Assert location longitude as "78.040009" and latitude as "27.1752868"

## Emulate device
* Navigate to "http://localhost:3001/"
* Emulate device "iPhone 6"
* Assert width is "375" and height is "667"

## Browser forward and back
* Navigate to "http://localhost:3001/"
* Click "Checkboxes"
* Navigate back
* Assert page navigated back "localhost"
* Navigate forward
* Assert page navigated forward

## Set Timezone
* Navigate to relative path "./specs/data/localStorage.html"
* Set timezone "America/Jamaica"
* Assert page has set timezome
