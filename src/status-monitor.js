// TODO [rkenney]: Remove sample messages
/*
var statusConfig = {
	points: {
		"backups.execute.git-repo":{error_period: "1d"},
		"backups.execute.wiki-repo":{error_period: "1d"},
		"backups.verify.git-repo":{error_period: "1d"},
		"backups.verify.wiki-repo":{error_period: "1d"},
	}
};

var sampleReport = {
	name: ["backups","verify","git-repo"],
	status: "OK"
};

var sampleReport = {
	point: ["backups.verify"],
	instance: ["git-repo"],
	status: "OK"
};



var state = {
		"backups.execute.git-repo":{
			lastReportOK: "2016-10-11T12:33:22Z"
		},
		"backups.execute.wiki-repo":{
			lastReportOK: "2016-10-11T12:33:22Z"
		},
		"backups.verify.git-repo":{
		},
		"backups.verify.wiki-repo":{
			lastReportOK: "2015-02-11T00:00:00Z"
		}
};
*/

let config = {
	points: {}
};

let status = {
	points: {}
};

let logger = function(msg) {
	console.log(msg);
};

// TODO [rkenney]: Load JS6 and use export here
var StatusMonitor = {
	
	/**
	 * The state of the point before any status is reported and
	 * the point has not timed out.
	 */
	STATE_INITIAL: "INITIAL",
	/**
	 * Indicates that the most recent report was OK and no
	 * timeout has triggered since.
	 */
	STATE_OK: "OK",
	/**
	 * Indicates that the most recent report was an Error
	 * or a timeout was triggered since the last OK report.
	 */
	STATE_ERROR: "ERROR",

	setConfig: function(newConfig) {
		validateConfig(newConfig);
		config = newConfig;
		// TODO [rkenney]: Prune unfigured points from status
	},

	getConfig: function(newConfig) {
		return config;
	},

	reportStatus: function(report) {
		ensurePointDefined(report.name);
		pointStatus = status.points[report.name];

		switch (report.state) {
		case StatusMonitor.STATE_OK:
		case StatusMonitor.STATE_ERROR:
			pointStatus.state = report.state;
			pointStatus.lastReport[report.state] = StatusMonitor.timeProvider();
			break;
		case StatusMonitor.STATE_INITIAL:
			// TODO [rkenney]: Sanitize this user input before logging
			// ... to prevent log forging.
			throw new Error("External callers cannot set state of point to '"+report.state+"'");
		default:
			// TODO [rkenney]: Sanitize this user input before logging
			// ... to prevent log forging.
			// TODO [rkenney]: Investigate whether js supports override of "+" serialization
			// ... If it does, any sanitization should verify that it is a string first.
			// TODO [rkenney]: Look into ovrriding the Error constructor with some sort
			// ... of stringf() method that applies sanitization to the args.
			// ... The new constructor could accept certain arguments as "new SafeArg(arg)"
			// ... to skip sanitization of strings build by the system.
			throw new Error("Invalid status '"+report.status+"' reported for point '"+report.name+"'");
		}

		// TODO [rkenney]: Sanitize this user input before logging
		// ... to prevent log forging.
		logger("Point '"+report.name+"' reported '"+report.status+"'");
	},

	getStatus: function(pointName) {
		ensurePointDefined(pointName);
		return status.points[pointName];
	},

	refreshTimeouts: function(pointName) {
		forEachProperty(config.points, (point) => {
			ensurePointDefined(point.name);
			pointStatus = status.points[pointStatus];

			switch (pointStatus.state) {
			case StatusMonitor.STATE_OK:
			case StatusMonitor.STATE_INITIAL:
			case StatusMonitor.STATE_ERROR:
				pointStatus.state = report.state;
				pointStatus.lastReport[report.state] = StatusMonitor.timeProvider();
				break;
				// TODO [rkenney]: Sanitize this user input before logging
				// ... to prevent log forging.
				throw new Error("External callers cannot set state of point to '"+report.state+"'");
			default:
				// TODO [rkenney]: Sanitize this user input before logging
				// ... to prevent log forging.
				// TODO [rkenney]: Investigate whether js supports override of "+" serialization
				// ... If it does, any sanitization should verify that it is a string first.
				// TODO [rkenney]: Look into ovrriding the Error constructor with some sort
				// ... of stringf() method that applies sanitization to the args.
				// ... The new constructor could accept certain arguments as "new SafeArg(arg)"
				// ... to skip sanitization of strings build by the system.
				throw new Error("Invalid status '"+report.status+"' reported for point '"+report.name+"'");
			}

			if (!config.points[point].error_period) {
				// TODO [rkenney]: Sanitize this user input before logging
				// ... to prevent log forging.
				throw Error("Config missing 'error_period' for '"+point+"' point.");
			}
		});


		ensurePointDefined(pointName);
		return status.points[pointName];
	},

	timeProvider: function() {
		return new Date();
	}
}

function ensurePointDefined(pointName) {
	let pointConfig = config.points[pointName];
	if (!pointConfig) {
		// TODO [rkenney]: Sanitize this user input before logging
		// ... to prevent log forging.
		throw new Error("Invalid point '"+pointName+"'");
	}
	let pointStatus = status.points[pointName];
	if (!pointStatus) {
		status.points[pointName] = {
			state: StatusMonitor.STATE_INITIAL,
			lastReport: {
				"INITIAL": StatusMonitor.timeProvider()
			}
		};
	}
}

function validateConfig(config) {
	if (!config.points) {
		throw Error("Config missing 'points' field.");
	}
	// TODO [rkenney]: Chose one of the following two iterators
	forEachProperty(config.points, (point) => {
		if (!config.points[point].error_period) {
			// TODO [rkenney]: Sanitize this user input before logging
			// ... to prevent log forging.
			throw Error("Config missing 'error_period' for '"+point+"' point.");
		}
	});
	// TODO [rkenney]: Remove if unused
	// Object.keys(config.points).forEach((point, index) => {
	// 	if (!config.points[point].error_period) {
	// 		// TODO [rkenney]: Sanitize this user input before logging
	// 		// ... to prevent log forging.
	// 		throw Error("Config missing 'error_period' for '"+key+"' point.");
	// 	}
	// };
}


// TODO [rkenney]: Remove if unused
function forEachProperty(object, handler) {
	for (var property in object) {
		// Skip injected prototype properties
		if (!object.hasOwnProperty(property)) { continue; }
		handler(property);
	}
}

module.exports = StatusMonitor;