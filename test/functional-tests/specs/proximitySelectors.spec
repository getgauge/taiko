# Proximity Selectors
## Below

* Intercept Google Analytics
* Navigate to "https://gauge.org"
* Click link "Insights" below 

   |Type|Selector       |
   |----|---------------|
   |link|Gauge Commands|

## Near by
tags: knownIssue
* Navigate to "google.com"
* Click "I'm Feeling Lucky"
* Click "About"
* Select "हिन्दी" of Combo Box near 

   |Type      |Selector                        |
   |----------|--------------------------------|
   |inputField|{"placeholder":"Search Doodles"}|
* Click "Doodles संग्रह"

## Above

* Intercept Google Analytics
* Navigate to "https://gauge.org"
* Click link "Blog"
* Click image above 

   |Type|Selector                                                     |
   |----|-------------------------------------------------------------|
   |text|Introducing Taiko - the last mile to reliable test automation|
* Assert Exists 

   |Type    |Selector          |Method|
   |--------|------------------|------|
   |text    |Introducing Taiko |exists|

## Right Of

* Intercept Google Analytics
* Navigate to "https://gauge.org/index.html"
* Assert Exists

   |Type|Selector    |Method|
   |----|------------|------|
   |$   |.github_star|exists|
* Click link to right of

   |Type|Selector    |
   |----|------------|
   |$   |.github_star|

* Assert title to be "Supported Plugins | Gauge" 