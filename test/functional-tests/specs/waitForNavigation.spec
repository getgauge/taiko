# Wait for navigation
## Should get the text of an element after page is loaded
* Navigate to "https://ahfarmer.github.io/emoji-search/" with timeout "60000" ms
* length of parse int should be "20" 

   |Type|Selector          |
   |----|------------------|
   |$   |.copy-to-clipboard|

## Should get text after ajax calls
* Navigate to "https://alik0211.github.io/pokedex/" with timeout "60000" ms
* Assert text is not empty 
   |Type|Selector      |
   |----|--------------|
   |$   |.pokemon__name|
