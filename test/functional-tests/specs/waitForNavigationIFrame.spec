# Wait for navigation
## Should get the text of an element after page is loaded
* Navigate to relative path "./specs/data/IFrameWaitForNavigation.html"
* length of parse int should be "20" 

   |Type|Selector          |
   |----|------------------|
   |$   |.copy-to-clipboard|

## Should get text after ajax calls
* Navigate to relative path "./specs/data/IFrameWaitForAjax.html"
* Assert text is not empty 
   |Type|Selector      |
   |----|--------------|
   |$   |.pokemon__name|
