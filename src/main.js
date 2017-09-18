let RestService = require('./rest-service.js');
let StatusChangeHistory = require('./status-change-history.js');
let StatusMonitor = require('./status-monitor.js');
let ProgStateStore = require('./prog-state-store.js');
let ProgStateStoreMem = require('./prog-state-store-mem.js');
let FS = require('fs-extra');
let Emailer = require('./emailer.js');
let SummaryNotifier = require('./summary-notifier.js');
let request = require("request")

// Load config
new Promise((resolve) => {
	// Load form URL (if defined)
	if (process.env.CONFIG_URL) {
		let url = process.env.CONFIG_URL;
		request({
			url: url,
			json: true
		}, function (error, response, body) {
			if (error) {
				throw error;
			}
			if (response.statusCode != 200) {
				throw new Error("Failed to download config from [" + url + "]. Status code [" + response.statusCode + "].");
			}
			resolve(body);
		});
	}
	// Load from local file
	else {
		resolve(JSON.parse(FS.readFileSync("config.json")));
	}
}).

// Launch server
then((config) => {
	console.log("Launching with Config:\n" + JSON.stringify(config));
	
	let logger = (msg) => console.log("[" + JSON.stringify(new Date()) + "] " + msg);
	let history = new StatusChangeHistory();
	
	let progState;
	if (process.env.PROG_STATE_TYPE == 'DISK') {
		if (!process.env.PROG_STATE_FILE) {
			throw new Error('Missing environment variable PROG_STATE_FILE');
		}
		progState = new ProgStateStore(process.env.PROG_STATE_FILE);
	} else {
		progState = new ProgStateStoreMem();
	}
	
	let _config = config;
	let sm = new StatusMonitor({
		config: () => {
			console.log("Read Config:\n" + JSON.stringify(_config));
			return _config;
		},
		progStateStore: progState,
		stateChangeHandler: (point, oldState, newState) => history.handleStateChange(point, oldState, newState),
		logger: logger
	});
	let rs = new RestService(8081, sm, logger);
	let emailer = new Emailer("user@sample.com", logger);
	let notifier = new SummaryNotifier(() => sm.getStatus().points, () => history.getAndReset(), emailer);
	
	// Refresh state of all points periodically
	setInterval(() => {
		sm.refreshTimeouts();
	}, 5000);
	
	// Send daily summary email of any errors
	// TODO [rkenney]: Instead, send a daily email summarizing all other notifications that should have been sent, not just the current errors.
	setInterval(() => {
		notifier.sendNotification();
	}, 1000 * 60 * 60 * 24);
}).catch(error => {
	console.trace(error);
});





