var LangUtil = require('../lang-util');
var StatusMonitor = require('../status-monitor.js');

it('StatusMonitor.setConfig() - Verify fails on missing points.', () => {
	let config = {
	};
	try {
		StatusMonitor.setConfig(config);
		fail("Expected exception");
	} catch (e) {
		expect(""+e).toEqual("Error: Config missing 'points' field.");
	}
});

it('StatusMonitor.setConfig() - Verify fails on missing error_period.', () => {
	let config = {
		points: {
			"mock.point.with.error_period":{error_period: "1d"},
			"mock.point.without.error_period":{}
		}
	};
	try {
		StatusMonitor.setConfig(config);
		fail("Expected exception");
	} catch (e) {
		expect(""+e).toEqual("Error: Config missing 'error_period' for 'mock.point.without.error_period' point.");
	}
});

// TODO [rkenney]: Do a deep clone on import (when "..." available through JS6)
// it('StatusMonitor.setConfig() - Verify clones data on import', () => {
// 	let config = {
// 		points: {
// 			"mock.point":{error_period: "1d"},
// 		}
// 	};
// 	StatusMonitor.setConfig(config);
// 	config.points["mock.point"].error_period = "2d";
// 	smConfig = StatusMonitor.getConfig(config);
// 	expect(smConfig.points["mock.point"].error_period).toEqual("1d");
// });

// TODO [rkenney]: Do a deep clone on export (when "..." available through JS6)
// it('StatusMonitor.getConfig() - Verify clones data on export', () => {
// 	let config = {
// 		points: {
// 			"mock.point":{error_period: "1d"},
// 		}
// 	};
// 	StatusMonitor.setConfig(config);
// 	config = StatusMonitor.getConfig(config);
// 	config.points["mock.point"].error_period = "2d";
// 	smConfig = StatusMonitor.getConfig(config);
// 	expect(smConfig.points["mock.point"].error_period).toEqual("1d");
// });

it('StatusMonitor.getConfig() - Verify sets config successfully', () => {
	let config = {
		points: {
			"mock.point.1":{error_period: "1d"},
			"mock.point.2":{error_period: "2d"},
		}
	};
	StatusMonitor.setConfig(config);
	config = StatusMonitor.getConfig(config);

	// Verify
	expect(LangUtil.getPropertyCount(config.points)).toEqual(2);
	expect(config.points["mock.point.1"].error_period).toEqual("1d");
	expect(config.points["mock.point.2"].error_period).toEqual("2d");
});

it('StatusMonitor.setStatus()/getStatus() - Verify ability to set status to OK/ERROR', () => {
	// Setup
	let time = StatusMonitor.timeProvider;
	let config = {
		points: {
			"mock.point.ok":{error_period: "1d"},
			"mock.point.error":{error_period: "2d"},
		}
	};
	StatusMonitor.setConfig(config);
	config = StatusMonitor.getConfig(config);

	// Execute
	StatusMonitor.timeProvider = () => {return new Date(100)}
	StatusMonitor.reportStatus({name:"mock.point.ok",state:StatusMonitor.STATE_OK});
	StatusMonitor.timeProvider = () => {return new Date(200)}
	StatusMonitor.reportStatus({name:"mock.point.error",state:StatusMonitor.STATE_ERROR});

	// Verify
	let pointStatus = StatusMonitor.getStatus("mock.point.ok");
	expect(pointStatus.state).toEqual(StatusMonitor.STATE_OK);
	expect(pointStatus.lastReport["OK"]).toEqual(new Date(100));
	pointStatus = StatusMonitor.getStatus("mock.point.error");
	expect(pointStatus.state).toEqual(StatusMonitor.STATE_ERROR);
	expect(pointStatus.lastReport["ERROR"]).toEqual(new Date(200));

	// Cleanup
	StatusMonitor.timeProvider = time;
});

it('StatusMonitor.getStatus() - Verify initial state of point', () => {
	// Setup
	let config = {
		points: {
			"mock.point.initial":{error_period: "1d"},
		}
	};
	StatusMonitor.setConfig(config);
	config = StatusMonitor.getConfig(config);

	// Verify
	let pointStatus = StatusMonitor.getStatus("mock.point.initial");
	// ... Point state
	expect(pointStatus.state).toEqual(StatusMonitor.STATE_INITIAL);
	// ... Point has creation report, but no others
	expect(LangUtil.getPropertyCount(pointStatus.lastReport)).toEqual(1);
	expect(pointStatus.lastReport["INITIAL"])
});

it('StatusMonitor.refreshState() - Verify no effect if no timeout', () => {
	// TODO [rkenney]: Implement
	expect(0).toEqual(1);
});

