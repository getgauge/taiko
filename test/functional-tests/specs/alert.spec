# Alert

## Should be able to accept a dialog box

* Navigate to relative path "./specs/data/HTMLElements.html"
* Alert "Hello world!" and await accept
* Click "Click Me!"
* Check if alert was accepted
* Alert "Hello World!" and await accept
* Click "Click Me Also!"
* Check if alert was accepted

## Should be able to accept prompt with message
* Navigate to relative path "./specs/data/HTMLElements.html"
* Prompt "Please enter your name" and await accept "Taiko on prompt"
* Click "Try it"
* Assert text "Taiko on prompt" exists on the page.
