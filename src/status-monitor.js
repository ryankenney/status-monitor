var ParseDuration = require('parse-duration')

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


// TODO [rkenney]: Load JS6 and use export here
class StatusMonitor {
	constructor(providers) {

		this.initializeAllPoints = function() {
			forEachProperty(this.config.points, (point) => {
				this.ensurePointDefined(point);
			});
		};

		this.ensurePointDefined = function(pointName) {
			let pointConfig = this.config.points[pointName];
			if (!pointConfig) {
				// TODO [rkenney]: Sanitize this user input before logging
				// ... to prevent log forging.
				throw new Error("Invalid point '"+pointName+"'");
			}
			let progState = this.stateStore.load();
			let pointStatus = progState.points[pointName];
			if (!pointStatus) {
				progState.points[pointName] = {
					state: this.STATE_INITIAL,
					lastReport: {
						"INITIAL": this.time()
					}
				};
			}
			this.stateStore.store(progState);
		};

		this.validateConfig = function(config) {
			if (!config.points) {
				throw new Error("Config missing 'points' field.");
			}
			// TODO [rkenney]: Chose one of the following two iterators
			forEachProperty(config.points, (point) => {
				if (!config.points[point].error_period) {
					// TODO [rkenney]: Sanitize this user input before logging
					// ... to prevent log forging.
					throw new Error("Config missing 'error_period' for '"+point+"' point.");
				}
			});
			// TODO [rkenney]: Remove if unused
			// Object.keys(config.points).forEach((point, index) => {
			// 	if (!config.points[point].error_period) {
			// 		// TODO [rkenney]: Sanitize this user input before logging
			// 		// ... to prevent log forging.
			// 		throw new Error("Config missing 'error_period' for '"+key+"' point.");
			// 	}
			// };
		};

		this.stateStore = providers.progStateStore;
		this.stateStore.store({points: {}});

		if (providers.stateChangeHandler) {
			this.stateChangeHandler = providers.stateChangeHandler;
		} else {
			this.stateChangeHandler = (pointName, oldState, newState) => {
				let json = {pointName: pointName, oldState: oldState, newState: newState};
				this.logger("State Changed: "+JSON.stringify(json));
			};
		}
		if (providers.time) {
			this.time = providers.time;
		} else {
			this.time = () => new Date();
		}
		if (providers.logger) {
			this.logger = providers.logger;
		} else {
			this.logger = (msg) => console.log(msg);
		}
		let config = providers.config();
		this.validateConfig(config);
		this.config = config;
		this.initializeAllPoints();

		this.hasReportWithinTimeout = function(pointName, state) {
			let now = this.time();
			let pointConfig = this.config.points[pointName];
			let pointStatus = this.stateStore.load().points[pointName];
			if (! pointStatus.lastReport[state]) {
				return false;
			}
			let timeout = ParseDuration(pointConfig.error_period);
			return pointStatus.lastReport[state].getTime() > now.getTime() - timeout;
		};
	}
}

/**
 * The state of the point before any status is reported and
 * the point has not timed out.
 */
StatusMonitor.prototype.STATE_INITIAL = "INITIAL";

/**
 * Indicates that the most recent report was OK and no
 * timeout has triggered since.
 */
StatusMonitor.prototype.STATE_OK = "OK";

/**
 * Indicates that the most recent report was an Error
 * or a timeout was triggered since the last OK report.
 */
StatusMonitor.prototype.STATE_ERROR = "ERROR";

StatusMonitor.prototype.getConfig = function() {
	return this.config;
};

StatusMonitor.prototype.reportStatus = function (report) {
	this.ensurePointDefined(report.name);
	let pointStatus = this.stateStore.load().points[report.name];

	switch (report.state) {
	case this.STATE_OK:
	case this.STATE_ERROR:
		pointStatus.state = report.state;
		pointStatus.lastReport[report.state] = this.time();
		break;
	case this.STATE_INITIAL:
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
		throw new Error("Invalid state '"+report.state+"' reported for point '"+report.name+"'");
	}

	// TODO [rkenney]: Sanitize this user input before logging
	// ... to prevent log forging.
	this.logger("Point '"+report.name+"' reported '"+report.state+"'");
};

StatusMonitor.prototype.getStatus = function() {
	return this.stateStore.load();
};

StatusMonitor.prototype.getPointStatus = function(pointName) {
	this.ensurePointDefined(pointName);
	return this.stateStore.load().points[pointName];
};

StatusMonitor.prototype.refreshTimeouts = function() {
	forEachProperty(this.config.points, (point) => {
		this.ensurePointDefined(point);

		let pointStatus = this.stateStore.load().points[point];

		// Continue if no timeout configured
		let timeout = ParseDuration(this.config.points[point].error_period);
		if (timeout < 1) {
			return;
		}

		let newState = this.STATE_ERROR;
		if (this.hasReportWithinTimeout(point, this.STATE_OK)) {
			newState = this.STATE_OK;
		} else if (
			pointStatus.state == this.STATE_INITIAL &&
			this.hasReportWithinTimeout(point, this.STATE_INITIAL)) {
			newState = this.STATE_INITIAL;
		} else {
			newState = this.STATE_ERROR;
		}

		let oldState = pointStatus.state;
		pointStatus.state = newState;

		if (newState != oldState) {
			this.stateChangeHandler(point, oldState, newState);
		}
	});
};

// TODO [rkenney]: Remove if unused
function forEachProperty(object, handler) {
	for (var property in object) {
		// Skip injected prototype properties
		if (!object.hasOwnProperty(property)) { continue; }
		handler(property);
	}
}

module.exports = StatusMonitor;