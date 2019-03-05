# Wait for navigation IFrame
## Should get the text of an element after page is loaded
* Navigate to relative path "./specs/data/IFrameWaitForNavigation.html" with timeout "60000" ms
* length of parse int should be "20" 

   |Type|Selector          |
   |----|------------------|
   |$   |.copy-to-clipboard|

## Should get text after ajax calls
* Navigate to relative path "./specs/data/IFrameWaitForAjax.html" with timeout "60000" ms
* Assert text is not empty 
   |Type|Selector      |
   |----|--------------|
   |$   |.pokemon__name|
