var LangUtil = require('../lang-util');
var StatusMonitor = require('../status-monitor.js');
var ParseDuration = require('parse-duration')
var DeepDiff = require('deep-diff')

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
		timeProvider: () => {return new Date(time)},
		logger: (msg) => {}
	};
	let sm = new StatusMonitor();
	sm.setConfig(config);

	// Execute
	time += ParseDuration("100ms");
	sm.reportStatus({name:"mock.point.ok",state:sm.STATE_OK});
	time += ParseDuration("100ms");
	sm.reportStatus({name:"mock.point.error",state:sm.STATE_ERROR});

	// Verify
	let pointStatus = sm.getPointStatus("mock.point.ok");
	expect(pointStatus.state).toEqual(sm.STATE_OK);
	expect(pointStatus.lastReport["OK"]).toEqual(new Date(100));
	pointStatus = sm.getPointStatus("mock.point.error");
	expect(pointStatus.state).toEqual(sm.STATE_ERROR);
	expect(pointStatus.lastReport["ERROR"]).toEqual(new Date(200));
});

it('StatusMonitor.getPointStatus() - Verify initial state of point', () => {
	// Setup
	let config = {
		points: {
			"mock.point.initial":{error_period: "1d"},
		},
		logger: (msg) => {}
	};
	let sm = new StatusMonitor();
	sm.setConfig(config);

	// Verify
	let pointStatus = sm.getPointStatus("mock.point.initial");
	// ... Point state
	expect(pointStatus.state).toEqual(sm.STATE_INITIAL);
	// ... Point has creation report, but no others
	expect(LangUtil.getPropertyCount(pointStatus.lastReport)).toEqual(1);
	expect(pointStatus.lastReport["INITIAL"])
});

it('StatusMonitor.refreshState() - Verify no effect if 0 timeout', () => {
	let time = new Date().getTime();
	let stateChanges = [];
	// Setup
	let config = {
		points: {
			"mock.point.initial": {error_period: "0"},
		},
		timeProvider: () => new Date(time),
		stateChangeHandler: (pointName, oldState, newState) => {
			stateChanges.push({pointName: pointName, oldState: oldState, newState: newState});
		},
		logger: (msg) => {}
	};
	let sm = new StatusMonitor();
	sm.setConfig(config);

	// Execute
	time += ParseDuration("2h")
	sm.refreshTimeouts();

	// Verify
	// ... State not changed
	let pointStatus = sm.getPointStatus("mock.point.initial");
	expect(pointStatus.state).toEqual(sm.STATE_INITIAL);
	// ... State change handler not called
	expect(stateChanges.length).toEqual(0);
});

it('StatusMonitor.refreshState() - Verify no transition INITIAL => ERROR if within timeout', () => {
	let time = new Date().getTime();
	let stateChanges = [];
	// Setup
	let config = {
		points: {
			"mock.point.initial": {error_period: "1h"},
		},
		timeProvider: () => new Date(time),
		stateChangeHandler: (pointName, oldState, newState) => {
			stateChanges.push({pointName: pointName, oldState: oldState, newState: newState});
		},
		logger: (msg) => {}
	};
	let sm = new StatusMonitor();
	sm.setConfig(config);

	// Execute
	time += ParseDuration("30m")
	sm.refreshTimeouts();

	// Verify
	// ... State not changed
	let pointStatus = sm.getPointStatus("mock.point.initial");
	expect(pointStatus.state).toEqual(sm.STATE_INITIAL);
	// ... State change handler not called
	expect(stateChanges.length).toEqual(0);
});

it('StatusMonitor.refreshState() - Verify transition INITIAL => ERROR on timeout', () => {
	let time = new Date().getTime();
	let stateChanges = [];
	// Setup
	let config = {
		points: {
			"mock.point.initial": {error_period: "1h"},
		},
		timeProvider: () => new Date(time),
		stateChangeHandler: (pointName, oldState, newState) => {
			stateChanges.push({pointName: pointName, oldState: oldState, newState: newState});
		},
		logger: (msg) => {}
	};
	let sm = new StatusMonitor();
	sm.setConfig(config);

	// Execute
	time += ParseDuration("2h")
	sm.refreshTimeouts();

	// Verify
	// ... State changed to ERROR
	let pointStatus = sm.getPointStatus("mock.point.initial");
	expect(pointStatus.state).toEqual(sm.STATE_ERROR);
	// ... State change handler called
	expect(stateChanges[0].pointName).toEqual("mock.point.initial");
	expect(stateChanges[0].oldState).toEqual(sm.STATE_INITIAL);
	expect(stateChanges[0].newState).toEqual(sm.STATE_ERROR);
});

it('StatusMonitor.refreshState() - Verify transition OK => ERROR on timeout', () => {
	let time = new Date().getTime();
	let stateChanges = [];
	// Setup
	let config = {
		points: {
			"mock.point.initial": {error_period: "1h"},
		},
		timeProvider: () => new Date(time),
		stateChangeHandler: (pointName, oldState, newState) => {
			stateChanges.push({pointName: pointName, oldState: oldState, newState: newState});
		},
		logger: (msg) => {}
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
	let pointStatus = sm.getPointStatus("mock.point.initial");
	expect(pointStatus.state).toEqual(sm.STATE_ERROR);
	// ... State change handler called
	expect(stateChanges[0].pointName).toEqual("mock.point.initial");
	expect(stateChanges[0].oldState).toEqual(sm.STATE_OK);
	expect(stateChanges[0].newState).toEqual(sm.STATE_ERROR);
});

it('StatusMonitor.refreshState() - State transitions', () => {
	// Setup
	let time = new Date().getTime();
	let stateChanges = [];
	let config = {
		points: {
			"initial.state.no.timeout": {error_period: "0"},
			"initial.state.1h.timeout": {error_period: "1h"},
			"initial.state.2h.timeout": {error_period: "2h"},
			"ok.state.no.timeout": {error_period: "0"},
			"ok.state.1h.timeout": {error_period: "1h"},
			"ok.state.2h.timeout": {error_period: "2h"},
			"error.state.no.timeout": {error_period: "0"},
			"error.state.1h.timeout": {error_period: "1h"},
			"error.state.2h.timeout": {error_period: "2h"}
		},
		timeProvider: () => new Date(time),
		stateChangeHandler: (pointName, oldState, newState) => {
			stateChanges.push({pointName: pointName, oldState: oldState, newState: newState});
		},
		logger: (msg) => {}
	};
	let sm = new StatusMonitor();
	sm.setConfig(config);
	sm.reportStatus({name: "ok.state.no.timeout", state: sm.STATE_OK });
	sm.reportStatus({name: "ok.state.1h.timeout", state: sm.STATE_OK });
	sm.reportStatus({name: "ok.state.2h.timeout", state: sm.STATE_OK });
	sm.reportStatus({name: "error.state.no.timeout", state: sm.STATE_ERROR });
	sm.reportStatus({name: "error.state.1h.timeout", state: sm.STATE_ERROR });
	sm.reportStatus({name: "error.state.2h.timeout", state: sm.STATE_ERROR });
	stateChanges = [];

	// Verify initial state
	expect(sm.getPointStatus("initial.state.no.timeout").state).toEqual(sm.STATE_INITIAL);
	expect(sm.getPointStatus("initial.state.1h.timeout").state).toEqual(sm.STATE_INITIAL);
	expect(sm.getPointStatus("initial.state.2h.timeout").state).toEqual(sm.STATE_INITIAL);
	expect(sm.getPointStatus("ok.state.no.timeout").state).toEqual(sm.STATE_OK);
	expect(sm.getPointStatus("ok.state.1h.timeout").state).toEqual(sm.STATE_OK);
	expect(sm.getPointStatus("ok.state.2h.timeout").state).toEqual(sm.STATE_OK);
	expect(sm.getPointStatus("error.state.no.timeout").state).toEqual(sm.STATE_ERROR);
	expect(sm.getPointStatus("error.state.1h.timeout").state).toEqual(sm.STATE_ERROR);
	expect(sm.getPointStatus("error.state.2h.timeout").state).toEqual(sm.STATE_ERROR);

	// Execute/verify
	time += ParseDuration("90m");
	sm.refreshTimeouts();
	expect(sm.getPointStatus("initial.state.no.timeout").state).toEqual(sm.STATE_INITIAL);
	// ... Newly expired point INITIAL -> ERROR
	expect(sm.getPointStatus("initial.state.1h.timeout").state).toEqual(sm.STATE_ERROR);
	expect(sm.getPointStatus("initial.state.2h.timeout").state).toEqual(sm.STATE_INITIAL);
	expect(sm.getPointStatus("ok.state.no.timeout").state).toEqual(sm.STATE_OK);
	// ... Newly expired point OK -> ERROR
	expect(sm.getPointStatus("ok.state.1h.timeout").state).toEqual(sm.STATE_ERROR);
	expect(sm.getPointStatus("ok.state.2h.timeout").state).toEqual(sm.STATE_OK);
	expect(sm.getPointStatus("error.state.no.timeout").state).toEqual(sm.STATE_ERROR);
	expect(sm.getPointStatus("error.state.1h.timeout").state).toEqual(sm.STATE_ERROR);
	expect(sm.getPointStatus("error.state.2h.timeout").state).toEqual(sm.STATE_ERROR);
	// ... State changes
	expectedStateChanges = [
		{pointName: "initial.state.1h.timeout", oldState: sm.STATE_INITIAL, newState: sm.STATE_ERROR},
		{pointName: "ok.state.1h.timeout", oldState: sm.STATE_OK, newState: sm.STATE_ERROR}
	];
	expect(DeepDiff(stateChanges, expectedStateChanges)).toBeUndefined();
	stateChanges = [];

	// Execute/verify
	time += ParseDuration("1h");
	sm.refreshTimeouts();
	expect(sm.getPointStatus("initial.state.no.timeout").state).toEqual(sm.STATE_INITIAL);
	expect(sm.getPointStatus("initial.state.1h.timeout").state).toEqual(sm.STATE_ERROR);
	// ... Newly expired point INITIAL -> ERROR
	expect(sm.getPointStatus("initial.state.2h.timeout").state).toEqual(sm.STATE_ERROR);
	expect(sm.getPointStatus("ok.state.no.timeout").state).toEqual(sm.STATE_OK);
	expect(sm.getPointStatus("ok.state.1h.timeout").state).toEqual(sm.STATE_ERROR);
	// ... Newly expired point OK -> ERROR
	expect(sm.getPointStatus("ok.state.2h.timeout").state).toEqual(sm.STATE_ERROR);
	expect(sm.getPointStatus("error.state.no.timeout").state).toEqual(sm.STATE_ERROR);
	expect(sm.getPointStatus("error.state.1h.timeout").state).toEqual(sm.STATE_ERROR);
	expect(sm.getPointStatus("error.state.2h.timeout").state).toEqual(sm.STATE_ERROR);
	// ... State changes
	expectedStateChanges = [
		{pointName: "initial.state.2h.timeout", oldState: sm.STATE_INITIAL, newState: sm.STATE_ERROR},
		{pointName: "ok.state.2h.timeout", oldState: sm.STATE_OK, newState: sm.STATE_ERROR}
	];
	expect(DeepDiff(stateChanges, expectedStateChanges)).toBeUndefined();
	stateChanges = [];
});


