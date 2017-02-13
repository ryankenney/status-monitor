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

Launching the Web Server
--------------------

Simply run:

	node src/main.js


Executing Unit Tests
--------------------

Simply run:

	npm run test

... start a watcher process that responds to source edits:

	# All Tests
	npm test -- --watch

	# A Specific Test File
	node --harmony ./node\_modules/jest-cli/bin/jest.js src/__tests__/yourTestFile.js --watch

