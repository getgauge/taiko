# Page Actions in IFrame

## Write, Press, Click

* Navigate to "http://localhost:3002/IFrameElements.html"
* Write "Gopher" into Text Box "Username"
* Press "Enter"
* Get value "Gopher" of Text Box "Username"
* Click "Male"
* Assert radioButton "Male" selected

## Double Click
* Assert text "Hello World" does not exist
* Navigate to "http://localhost:3002/doubleClick.html"
* Double click 

   |Type|Selector    |
   |----|------------|
   |text|Double-click|
* Assert text "Hello World" exists on the page.

## Right Click

* Navigate to "http://localhost:3002/IFrameRightClick.html"
* Right click 

   |Type|Selector   |
   |----|-----------|
   |text|Someelement|
* Click "Share On Facebook"

## Hover
* Navigate to "http://localhost:3002/IFrameCompare.html"
* Hover on element

   |Type|Selector        |
   |----|----------------|
   |$   |".figure"|
* Assert text "View profile" exists on the page.

## Drag and drop
* Navigate to "http://localhost:3002/IFrameDragAndDrop.html"
* Drag "#column-a" and drop to "#column-b"
* Drag "#column-b" and drop at

   |direction|pixel|
   |---------|-----|
   |right    |300  |
