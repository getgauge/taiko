# Page Actions in IFrame

## Write, Press, Click

* Navigate to relative path "./specs/data/IFrameTodoApp.html"
* Write "flow"
* Press "Enter"
* Click link "Active"
* Click checkBox with attribute "{\"class\":\"toggle\"}" near 

   |Type|Selector|
   |----|--------|
   |text|flow    |
* Click link "Completed"
* Click button "Clear completed"

## Write, Clear

* Navigate to relative path "./specs/data/IFrameTodoApp.html"
* Write "abcd"
* Clear element that is in focus
* Write "Clear it"
* Press "Enter"
* Assert text "Clear it" exists on the page.
* Assert text "abcd" does not exist

## Double Click
* Assert text "Hello World" does not exist
* Navigate to file with relative Path "/specs/data/doubleClick.html"
* Double click 

   |Type|Selector    |
   |----|------------|
   |text|Double-click|
* Assert text "Hello World" exists on the page.

## Right Click

* Navigate to relative path "./specs/data/IFrameRightClick.html"
* Right click 

   |Type|Selector   |
   |----|-----------|
   |text|Someelement|
* Click "Share On Facebook"

## Hover
* Navigate to relative path "./specs/data/IFrameCompare.html"
* Hover on element 

   |Type|Selector        |
   |----|----------------|
   |$   |".image_overlay"|
* Click "Compare"
* Hover on element 

   |Type|Selector        |
   |----|----------------|
   |$   |".image_overlay"|
* Click "Remove"

## Drag and drop
* Navigate to relative path "./specs/data/IFrameDragAndDrop.html"
* Drag ".document" and drop to ".trash"
* Drag ".document" and drop at 

   |direction|pixel|
   |---------|-----|
   |right    |300  |
   |down     |100  |
