const StatusMonitor = require('../status-monitor.js');
const RestService = require('../rest-service.js');
const RestClient = require('../rest-client.js');
const net = require('net');

// TODO [rkenney]: We don't need this any more, but we could down the line...
require('promise.prototype.finally').shim();

// TODO [rkenney]: Silence logger
let logger = (msg) => { console.log(msg); };

describe('REST Test', () => {
	describe('getStatusReport()', () => {

		let sm;
		let server;
		let client;

		beforeEach(() => {
			sm = new StatusMonitor();
			sm.setConfig({ points: { "one.point": {error_period: "1h"} } });
			server = new RestService(8083, sm, logger);
			client = new RestClient("http://localhost:8083", logger);
		});

		afterEach(() => {
			server.shutdown();
		});

		it('Get undefined returns undefined.', () => {
			sm.setConfig({ points: { "one.point": {error_period: "1h"} } });
			return new Promise((resolve, reject) => {
				client.getStatusReport(statusReport => { resolve(statusReport); });
			}).then(statusReport => {
				expect(statusReport.points["undefined.point"]).toBeUndefined();
			});
		});

		it('Get configured, but never reported, returns only INITIAL.', () => {
			sm.setConfig({ points: { "one.point": {error_period: "1h"} } });
			return new Promise((resolve, reject) => {
				client.getStatusReport(statusReport => { resolve(statusReport); });
			}).then(statusReport => {
				expect(statusReport.points["one.point"].lastReport[sm.STATE_INITIAL]).toBeDefined();
				expect(statusReport.points["one.point"].lastReport[sm.STATE_OK]).toBeUndefined();
				expect(statusReport.points["one.point"].lastReport[sm.STATE_ERROR]).toBeUndefined();
			});
		});
	});
});

