# API Function Return Type


| Function Name                              | Return Type                  |
|--------------------------------------------|------------------------------|
| functionReturningPromise                   | Promise                      |
| functionReturningPromiseOfObject           | Promise<Object>              |
| functionReturningPromiseOfVoid             | Promise<void>                |
| functionReturningArrayOfObjects            | Array<Object>                |
| functionReturningPromiseOfArrayOfObjects   | Promise<Array<Object>>       |

## <Function Name> should display <Return Type> after 'Returns'

* Navigate to relative API reference page for <Function Name>
* Assert text "Returns" exists on the page.
* Assert text "Description of the return" exists below "Returns".
* Assert text <Return Type> exists below "Returns".