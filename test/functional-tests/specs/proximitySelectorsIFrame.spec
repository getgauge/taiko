# Proximity Selectors in IFrame
## Below

* Intercept Google Analytics
* Navigate to relative path "./specs/data/IFrameGaugeOrg.html"
* Click link "Insights" below 

   |Type|Selector       |
   |----|---------------|
   |link|Gauge Commands|

## Near by
tags: knownIssue

* Navigate to relative path "./specs/data/IFrameElements.html"
* Write "Blah" into Input Field near 

   |Type|Selector  |
   |----|----------|
   |text|First Name|
* Assert text "Blah" exists on the page.

## Above

* Intercept Google Analytics
* Navigate to relative path "./specs/data/IFrameGaugeOrg.html"
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
* Navigate to relative path "./specs/data/IFrameGaugeOrg.html"
* Assert Exists

   |Type|Selector    |Method|
   |----|------------|------|
   |$   |.github_star|exists|
* Click link to right of

   |Type|Selector    |
   |----|------------|
   |$   |.github_star|

* Assert text "Language Runners" exists on the page.