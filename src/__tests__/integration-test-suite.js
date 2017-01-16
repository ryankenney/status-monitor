const StatusMonitor = require('../status-monitor.js');
const RestService = require('../rest-service.js');
const RestClient = require('../rest-client.js');
const net = require('net');

// TODO [rkenney]: We don't need this any more, but we could down the line...
require('promise.prototype.finally').shim();

// TODO [rkenney]: Silence logger
var logger = (msg) => { console.log(msg); };

describe('REST Test', () => {
	describe('getStatusReport()', () => {

		let sm;
		let server;
		let client;
		const initialTime = new Date(2000, 1, 1, 0, 0, 0); 
		let time = initialTime;

		beforeEach(() => {
			sm = new StatusMonitor();
			sm.setConfig({ points: { "one.point": {error_period: "1h"} } }, ()=>time);
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
				expect(statusReport.points["one.point"].lastReport[sm.STATE_INITIAL]).toEqual(initialTime.toISOString());
				expect(statusReport.points["one.point"].lastReport[sm.STATE_OK]).toBeUndefined();
				expect(statusReport.points["one.point"].lastReport[sm.STATE_ERROR]).toBeUndefined();
			});
		});

		it('Changing state with reports.', () => {
            let reportOkTime = new Date(time.getTime() + 1000);
            let reportErrorTime = new Date(time.getTime() + 2000);
            let reportOk2Time = new Date(time.getTime() + 3000);

			sm.setConfig({ points: { "one.point": {error_period: "1h"} } });
			return new Promise((resolve, reject) => {
				client.getStatusReport(statusReport => { resolve(statusReport); });
            }).then(statusReport => {
            	// Verify initial state
                expect(statusReport.points["one.point"].lastReport[sm.STATE_INITIAL]).toEqual(initialTime.toISOString());
                expect(statusReport.points["one.point"].lastReport[sm.STATE_OK]).toBeUndefined();
                expect(statusReport.points["one.point"].lastReport[sm.STATE_ERROR]).toBeUndefined();
            }).then(statusReport => {
                return new Promise((resolve, reject) => {
                    time = new Date(reportOkTime);
                    client.postPointStatus({name:"one.point",state:sm.STATE_OK}, statusReport => { resolve(statusReport); });
                });
            }).then(statusReport => {
                return new Promise((resolve, reject) => {
                    client.getStatusReport(statusReport => { resolve(statusReport); });
                });
            }).then(statusReport => {
                // Verify OK applied
                expect(statusReport.points["one.point"].lastReport[sm.STATE_INITIAL]).toEqual(initialTime.toISOString());
                expect(statusReport.points["one.point"].lastReport[sm.STATE_OK]).toEqual(reportOkTime.toISOString());
                expect(statusReport.points["one.point"].lastReport[sm.STATE_ERROR]).toBeUndefined();
            }).then(statusReport => {
                return new Promise((resolve, reject) => {
                    time = new Date(reportErrorTime);
                    client.postPointStatus({name:"one.point",state:sm.STATE_ERROR}, statusReport => { resolve(statusReport); });
                });
            }).then(statusReport => {
                return new Promise((resolve, reject) => {
                    client.getStatusReport(statusReport => { resolve(statusReport); });
                });
            }).then(statusReport => {
                // Verify ERROR applied
                expect(statusReport.points["one.point"].lastReport[sm.STATE_INITIAL]).toEqual(initialTime.toISOString());
                expect(statusReport.points["one.point"].lastReport[sm.STATE_OK]).toEqual(reportOkTime.toISOString());
                expect(statusReport.points["one.point"].lastReport[sm.STATE_ERROR]).toEqual(reportErrorTime.toISOString());
            }).then(statusReport => {
                return new Promise((resolve, reject) => {
                    time = new Date(reportOk2Time);
                    client.postPointStatus({name:"one.point",state:sm.STATE_OK}, statusReport => { resolve(statusReport); });
                });
            }).then(statusReport => {
                return new Promise((resolve, reject) => {
                    client.getStatusReport(statusReport => { resolve(statusReport); });
                });
            }).then(statusReport => {
                // Verify OK applied (time updated)
                expect(statusReport.points["one.point"].lastReport[sm.STATE_INITIAL]).toEqual(initialTime.toISOString());
                expect(statusReport.points["one.point"].lastReport[sm.STATE_OK]).toEqual(reportOk2Time.toISOString());
                expect(statusReport.points["one.point"].lastReport[sm.STATE_ERROR]).toEqual(reportErrorTime.toISOString());
            });
		});
	});
});

