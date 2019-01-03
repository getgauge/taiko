#Intercept Api

## With simple response body
* Respond to "https://docs.gauge.org/latest/writing-specifications.html" with "mocked specifications page"
* Navigate to "https://docs.gauge.org"
* Click an element that contains "Write Specifications"
* Assert text "mocked specifications page" exists on the page.

## With array as a response body
* Respond to "https://docs.gauge.org/latest/writing-specifications.html" with json "[\"mocked\",\"specifications\",\"page\"]"

* Navigate to "https://docs.gauge.org"
* Click an element that contains "Write Specifications"
* Assert text "[\"mocked\",\"specifications\",\"page\"]" exists on the page.

## With object as a response body
* Respond to "https://docs.gauge.org/latest/writing-specifications.html" with json "{\"name\":\"Jon\",\"age\":\"20\"}"

* Navigate to "https://docs.gauge.org"
* Click an element that contains "Write Specifications"
* Assert text "{\"name\":\"Jon\",\"age\":\"20\"}" exists on the page.

## With regex in URL
* Respond to "https://localhost/employees/(\\d+)/address" with json "{\"city\":\"City1\",\"State\":\"State1\"}"
* Navigate to "https://localhost/employees/1/address"
* Assert text "{\"city\":\"City1\",\"State\":\"State1\"}" exists on the page.

* Navigate to "https://localhost/employees/2/address"
* Assert text "{\"city\":\"City1\",\"State\":\"State1\"}" exists on the page.

## Override a response for a URL
* Respond to "https://localhost/employees/(\\d+)/address" with json "{\"city\":\"City1\",\"State\":\"State1\"}"
* Navigate to "https://localhost/employees/1/address"
* Assert text "{\"city\":\"City1\",\"State\":\"State1\"}" exists on the page.

* Respond to "https://localhost/employees/1/address" with json "{\"city\":\"CityOne\",\"State\":\"StateOne\"}"
* Navigate to "https://localhost/employees/1/address"
* Assert text "{\"city\":\"CityOne\",\"State\":\"StateOne\"}" exists on the page.

* Navigate to "https://localhost/employees/2/address"
* Assert text "{\"city\":\"City1\",\"State\":\"State1\"}" exists on the page.
