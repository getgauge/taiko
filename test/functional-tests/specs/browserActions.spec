#Browser Action

## Switch To
* Intercept Google Analytics
* Navigate to "https://gauge.org"
* Click link to left of

   |Type|Selector    |
   |----|------------|
   |text|Plugins     |

* Switch to tab with title "Open Source Test Automation Framework | Gauge"
* Assert Exists

   |Type|Selector    |
   |----|------------|
   |$   |.github_star|

## Open/Close Tab
* Intercept Google Analytics
* Navigate to "google.com"
* Open Tab "https://gauge.org"
* Close Tab "https://gauge.org"

## Close Tab with no parameters
* Intercept Google Analytics
* Navigate to "google.com"
* Open Tab "https://www.thoughtworks.com/contact-us" with timeout "20000"
* Click link near 

   |Type|Selector                         |
   |----|---------------------------------|
   |text|"I agree to share my information"|
* Close Tab
* Close Tab
* Switch to tab with title "Google"

## Reload
* Navigate to "https://ahfarmer.github.io/calculator/"
* Click button "8"
* Reload the page
* assert text to be "0"
   |Type|Selector          |
   |----|------------------|
   |$   |.component-display|

## Reload should not clear local cache
* Navigate to "http://todomvc.com/examples/react/#/"
* Write "flow"
* Press "Enter"
* Reload the page
* Assert text "flow" exists on the page.


## Get all cookies
* Navigate to "https://the-internet.herokuapp.com/"
* Assert cookies to be present

## Cookie should be present for valid options urls
* Navigate to "https://the-internet.herokuapp.com/"
* Assert cookie with valid options url "https://the-internet.herokuapp.com/"

## Cookie not should be present for invalid options urls
* Navigate to "https://the-internet.herokuapp.com/"
* Assert cookie with invalid options url "https://gauge.org"

## Set mock location
* Override browser permission with "geolocation" for site "https://the-internet.herokuapp.com/geolocation"
* Setlocation with longitude as "78.040009" and latitude as "27.1752868"
* Navigate to "https://the-internet.herokuapp.com/geolocation"
* Assert location longitude as "78.040009" and latitude as "27.1752868"

## Emulate device
* Navigate to "https://the-internet.herokuapp.com/"
* Emulate device "iPhone 6"
* Assert width is "375" and height is "667"

## Browser forward and back
* Navigate to "https://the-internet.herokuapp.com/"
* Click "Checkboxes"
* Navigate back
* Assert page navigated back
* Navigate forward
* Assert page navigated forward