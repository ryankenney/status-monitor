let RestService = require('./rest-service.js');
let StatusChangeHistory = require('./status-change-history.js');
let StatusMonitor = require('./status-monitor.js');
let ProgStateStore = require('./prog-state-store.js');
let ProgStateStoreMem = require('./prog-state-store-mem.js');
let ConfigLoader = require('./config-loader.js');
let Emailer = require('./emailer.js');
let Notifier = require('./summary-notifier.js');
let request = require("request")
let NodeCron = require("node-cron");

let config;
let passwords;


ConfigLoader.loadConfig().then((c) => {
	config = c;
}).then(() => {
	return ConfigLoader.loadPasswords();
}).then((p) => {
	passwords = p;
}).

// Launch server
then(() => {
	console.log("Launching with Config:\n" + JSON.stringify(config, null, '\t'));
	
	let logger = (msg) => console.log("[" + JSON.stringify(new Date()) + "] " + msg);
	let history = new StatusChangeHistory();
	
	// TODO [rkenney]: Move these variables into the config file.
	let progState;
	if (process.env.PROG_STATE_TYPE == 'DISK') {
		if (!process.env.PROG_STATE_FILE) {
			throw new Error('Missing environment variable PROG_STATE_FILE');
		}
		progState = new ProgStateStore(process.env.PROG_STATE_FILE);
	} else {
		progState = new ProgStateStoreMem();
	}
	
	let emailer = new Emailer({
		toAddress: config.notifier.emailToAddress,
		username: passwords.emailer.username,
		password: passwords.emailer.password,
		subjectPrefix: config.notifier.emailSubjectPrefix,
		logger: logger
	});
	let notifier = new Notifier(() => sm.getStatus().points, () => history.getAndReset(), emailer);
	
	let _config = config;
	let sm = new StatusMonitor({
		config: () => {
			return _config;
		},
		progStateStore: progState,
		stateChangeHandler: (point, oldState, newState, errorReason) => {
			notifier.sendChangeNotice(point, oldState, newState, errorReason);
			history.handleStateChange(point, oldState, newState);
		},
		logger: logger
	});
	new RestService(8081, sm, logger);
	
	// Refresh state of all points periodically
	setInterval(() => {
		sm.refreshTimeouts();
	}, 5000);
	
	// Send "daily" summary email of any errors
	// TODO [rkenney]: Instead, send a daily email summarizing all other notifications that should have been sent, not just the current errors.
	NodeCron.schedule(config.notifier.emailSchedule, () => notifier.sendSummary());
}).catch(error => {
	console.trace(error);
});





