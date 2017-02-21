let RestService = require('./rest-service.js');
let StatusMonitor = require('./status-monitor.js');
let ProgStateStore = require('./prog-state-store.js');
let FS = require('fs-extra');
let Emailer = require('./emailer.js');
let SummaryNotifier = require('./summary-notifier.js');

let logger = (msg) => console.log("["+JSON.stringify(new Date())+"] "+msg);

let sm = new StatusMonitor({
    config: () => JSON.parse(FS.readFileSync("config.json")),
    progStateStore: new ProgStateStore("/home/user/dev/status-monitor/state.json"),
    logger: logger
});
let rs = new RestService(8081, sm, logger);
let emailer = new Emailer("user@sample.com", logger);
let notifier = new SummaryNotifier(() => sm.getStatus().points, emailer);

// Refresh state of all points periodically
setInterval(() => { sm.refreshTimeouts(); }, 5000);

// Send daily summary email of any errors
// TODO [rkenney]: Instead, send a daily email summarizing all other notifications that should have been sent, not just the current errors.
setInterval(() => { notifier.sendNotification(); }, 1000*60*60*24);
