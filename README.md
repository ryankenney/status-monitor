Status Monitor
==============

Preparing the App to Run
----------------

0. Install Node.js v6 using the [instructions provided by node.js](https://nodejs.org/en/download/package-manager/).

0. Clone the app:

		git clone https://github.com/ryankenney/status-monitor.git

0. Download the app dependencies:

		cd status-monitor
		npm install

Configuring the Web Server
--------------------

Copy/edit the sample config file:

	cp config.json.example config.json

Launching the Web Server
--------------------

Run:

	node src/main.js

Posting Status Reports via Curl
--------------------

Run:

	curl -H "Content-Type: application/json" \
	-d '{"name":"point-one","state":"OK"}' \
	http://127.0.0.1:8081/report-status

Executing Unit Tests
--------------------

Run:

	npm run test

Or, you can start a watcher process that responds to source edits:

	# All Tests
	npm test -- --watch

	# A Specific Test File
	node --harmony ./node\_modules/jest-cli/bin/jest.js src/__tests__/yourTestFile.js --watch

License
----------------

Licensed under [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0).
