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
