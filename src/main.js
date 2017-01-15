let RestService = require('./rest-service.js');
let StatusMonitor = require('./status-monitor.js');

let sm = new StatusMonitor();
let rs = new RestService(8081, sm);

