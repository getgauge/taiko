# Page Actions in IFrame

## Write, Press, Click

* Navigate to relative path "./specs/data/IFrameElements.html"
* Write "Gopher" into Text Box "Username"
* Press "Enter"
* Get value "Gopher" of Text Box "Username"
* Click "Male"
* Assert radioButton "Male" selected

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
   |$   |".figure"|
* Assert text "View profile" exists on the page.

## Drag and drop
* Navigate to relative path "./specs/data/IFrameDragAndDrop.html"
* Drag "#column-a" and drop to "#column-b"
* Drag "#column-b" and drop at

   |direction|pixel|
   |---------|-----|
   |right    |300  |
