# Browser Action


## Switch To
* Navigate to "http://localhost:3001/"
* Click "Multiple Windows"
* Assert page navigated to "/windows"
* Click "Click Here"
* Switch to tab with url "http://localhost:3001/windows/new"
* Assert page navigated to "/windows/new"
* Switch to tab with url "http://localhost:3001/windows"
* Assert page navigated to "/windows"
* Assert Exists

   |Type|Selector            |
   |----|--------------------|
   |text|Opening a new window|

## Switch to with name
* Open Tab with name "newTab"
* Open Tab "http://localhost:3001/"
* Switch to tab with name "newTab"
* Assert url to be "about:blank"

## Open/Close Tab
* Navigate to "http://localhost:3002/sample.html"
* Open Tab "http://localhost:3001/"
* Assert title to be "The Internet"
* Close Tab "http://localhost:3001/"
* Assert title to be "Document"


## Close Tab with no parameters
* Navigate to "http://localhost:3002/sample.html"
* Open Tab "http://localhost:3001/dropdown"
* Open Tab "http://localhost:3001/"
* Close Tab
* Switch to tab with url "http://localhost:3001/dropdown"
* Close Tab
* Assert title to be "Document"

## Reload
* Navigate to "http://localhost:3002/HTMLElements.html"
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
* Navigate to "http://localhost:3002/localStorage.html"
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
* Navigate to "http://localhost:3002/sample.html"
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
* Assert page navigated to "/checkboxes"

## Set Timezone
* Navigate to "http://localhost:3002/localStorage.html"
* Set timezone "America/Jamaica"
* Assert page has set timezome

## Click & Release To Element
* Navigate to "http://localhost:3002/MouseMoveTest.html"
* Press & Release To Element with element1 and "0","100" co-ordinates
* Assert text "button2" exists on the page.
* Press & Release To Element with "200","150" co-ordinates
* Assert text "button3" exists on the page.
* Press & Release To Element with element1 and "100","100" co-ordinates
* Assert text "button4" exists on the page.
* Press & Release To Element with element2 and "-100","-100" co-ordinates
* Assert text "button1" exists on the page.
