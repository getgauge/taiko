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
* Click link below 

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
* Assert cookie with invalid options url "https://www.google.com/"