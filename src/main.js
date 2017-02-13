let RestService = require('./rest-service.js');
let StatusMonitor = require('./status-monitor.js');
let ProgStateStore = require('./prog-state-store.js');
let FS = require('fs-extra');

let sm = new StatusMonitor({
    config: () => JSON.parse(FS.readFileSync("config.json")),
    progStateStore: new ProgStateStore("/home/user/dev/status-monitor/state.json"),
});
let rs = new RestService(8081, sm);

setInterval(() => { sm.refreshTimeouts(); }, 5000);