# Proximity Selectors
## Below

* Intercept Google Analytics
* Navigate to "https://gauge.org"
* Click link "Insights" below 

   |Type|Selector      |
   |----|--------------|
   |link|Gauge Commands|

## Near by

* Navigate to relative path "./specs/data/HTMLElements.html"
* Write "Blah" into Input Field near 

   |Type|Selector  |
   |----|----------|
   |text|First Name|
* Assert text "Blah" exists on the page.

## Above

* Intercept Google Analytics
* Navigate to "https://gauge.org"
* Click link "Blog"
* Click image above 

   |Type|Selector                                                     |
   |----|-------------------------------------------------------------|
   |text|Introducing Taiko - the last mile to reliable test automation|
* Assert Exists 

   |Type|Selector         |Method|
   |----|-----------------|------|
   |text|Introducing Taiko|exists|

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
