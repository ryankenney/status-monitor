var LangUtil = require('../lang-util');
var StatusMonitor = require('../status-monitor.js');
var ParseDuration = require('parse-duration')

it('StatusMonitor.setConfig() - Verify fails on missing points.', () => {
	let config = {
	};
	try {
		new StatusMonitor().setConfig(config);
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
		new StatusMonitor().setConfig(config);
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
	let sm = new StatusMonitor();
	sm.setConfig(config);
	config = sm.getConfig(config);

	// Verify
	expect(LangUtil.getPropertyCount(config.points)).toEqual(2);
	expect(config.points["mock.point.1"].error_period).toEqual("1d");
	expect(config.points["mock.point.2"].error_period).toEqual("2d");
});

it('StatusMonitor.setStatus()/getStatus() - Verify ability to set status to OK/ERROR', () => {
	let time = new Date(0).getTime();
	// Setup
	let config = {
		points: {
			"mock.point.ok":{error_period: "1d"},
			"mock.point.error":{error_period: "2d"},
		},
		timeProvider: () => {return new Date(time)}
	};
	let sm = new StatusMonitor();
	sm.setConfig(config);

	// Execute
	time += ParseDuration("100ms");
	sm.reportStatus({name:"mock.point.ok",state:sm.STATE_OK});
	time += ParseDuration("100ms");
	sm.reportStatus({name:"mock.point.error",state:sm.STATE_ERROR});

	// Verify
	let pointStatus = sm.getStatus("mock.point.ok");
	expect(pointStatus.state).toEqual(sm.STATE_OK);
	expect(pointStatus.lastReport["OK"]).toEqual(new Date(100));
	pointStatus = sm.getStatus("mock.point.error");
	expect(pointStatus.state).toEqual(sm.STATE_ERROR);
	expect(pointStatus.lastReport["ERROR"]).toEqual(new Date(200));
});

it('StatusMonitor.getStatus() - Verify initial state of point', () => {
	// Setup
	let config = {
		points: {
			"mock.point.initial":{error_period: "1d"},
		}
	};
	let sm = new StatusMonitor();
	sm.setConfig(config);

	// Verify
	let pointStatus = sm.getStatus("mock.point.initial");
	// ... Point state
	expect(pointStatus.state).toEqual(sm.STATE_INITIAL);
	// ... Point has creation report, but no others
	expect(LangUtil.getPropertyCount(pointStatus.lastReport)).toEqual(1);
	expect(pointStatus.lastReport["INITIAL"])
});

it('StatusMonitor.refreshState() - Verify no effect if 0 timeout', () => {
	let time = new Date().getTime();
	let lastStateChange = "NOT_SET";
	// Setup
	let config = {
		points: {
			"mock.point.initial": {error_period: "0"},
		},
		timeProvider: () => new Date(time),
		stateChangeHandler: (pointName, oldState, newState) => {
			lastStateChange = {pointName: "mock.point.initial", oldState: oldState, newState: newState};
		}
	};
	let sm = new StatusMonitor();
	sm.setConfig(config);

	// Execute
	time += ParseDuration("2h")
	sm.refreshTimeouts();

	// Verify
	// ... State not changed
	let pointStatus = sm.getStatus("mock.point.initial");
	expect(pointStatus.state).toEqual(sm.STATE_INITIAL);
	// ... State change handler not called
	expect(lastStateChange).toEqual("NOT_SET");
});

it('StatusMonitor.refreshState() - Verify no transition INITIAL => ERROR if within timeout', () => {
	let time = new Date().getTime();
	let lastStateChange = "NOT_SET";
	// Setup
	let config = {
		points: {
			"mock.point.initial": {error_period: "1h"},
		},
		timeProvider: () => new Date(time),
		stateChangeHandler: (pointName, oldState, newState) => {
			lastStateChange = {pointName: "mock.point.initial", oldState: oldState, newState: newState};
		}
	};
	let sm = new StatusMonitor();
	sm.setConfig(config);

	// Execute
	time += ParseDuration("30m")
	sm.refreshTimeouts();

	// Verify
	// ... State not changed
	let pointStatus = sm.getStatus("mock.point.initial");
	expect(pointStatus.state).toEqual(sm.STATE_INITIAL);
	// ... State change handler not called
	expect(lastStateChange).toEqual("NOT_SET");
});

it('StatusMonitor.refreshState() - Verify transition INITIAL => ERROR on timeout', () => {
	let time = new Date().getTime();
	let lastStateChange = "NOT_SET";
	// Setup
	let config = {
		points: {
			"mock.point.initial": {error_period: "1h"},
		},
		timeProvider: () => new Date(time),
		stateChangeHandler: (pointName, oldState, newState) => {
			lastStateChange = {pointName: "mock.point.initial", oldState: oldState, newState: newState};
		}
	};
	let sm = new StatusMonitor();
	sm.setConfig(config);

	// Execute
	time += ParseDuration("2h")
	sm.refreshTimeouts();

	// Verify
	// ... State changed to ERROR
	let pointStatus = sm.getStatus("mock.point.initial");
	expect(pointStatus.state).toEqual(sm.STATE_ERROR);
	// ... State change handler called
	expect(lastStateChange.pointName).toEqual("mock.point.initial");
	expect(lastStateChange.oldState).toEqual(sm.STATE_INITIAL);
	expect(lastStateChange.newState).toEqual(sm.STATE_ERROR);
});

it('StatusMonitor.refreshState() - Verify transition OK => ERROR on timeout', () => {
	let time = new Date().getTime();
	let lastStateChange = "NOT_SET";
	// Setup
	let config = {
		points: {
			"mock.point.initial": {error_period: "1h"},
		},
		timeProvider: () => new Date(time),
		stateChangeHandler: (pointName, oldState, newState) => {
			lastStateChange = {pointName: "mock.point.initial", oldState: oldState, newState: newState};
		}
	};
	let sm = new StatusMonitor();
	sm.setConfig(config);
	time += ParseDuration("10m");
	sm.reportStatus({name: "mock.point.initial", state: sm.STATE_OK });

	// Execute
	time += ParseDuration("2h");
	sm.refreshTimeouts();

	// Verify
	// ... State changed to ERROR
	let pointStatus = sm.getStatus("mock.point.initial");
	expect(pointStatus.state).toEqual(sm.STATE_ERROR);
	// ... State change handler called
	expect(lastStateChange.pointName).toEqual("mock.point.initial");
	expect(lastStateChange.oldState).toEqual(sm.STATE_OK);
	expect(lastStateChange.newState).toEqual(sm.STATE_ERROR);
});

