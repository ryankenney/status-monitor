var ParseDuration = require('parse-duration')

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
					state: StatusMonitor.STATE_INITIAL,
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
		};

		this.stateStore = providers.progStateStore;

		if (providers.stateChangeHandler) {
			this.stateChangeHandler = providers.stateChangeHandler;
		} else {
			this.stateChangeHandler = (pointName, oldState, newState, errorReason) => {};
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
			return new Date(pointStatus.lastReport[state]) > now.getTime() - timeout;
		};
	}
}

/**
 * The state of the point before any status is reported and
 * the point has not timed out.
 */
StatusMonitor.STATE_INITIAL = "INITIAL";

/**
 * Indicates that the most recent report was OK and no
 * timeout has triggered since.
 */
StatusMonitor.STATE_OK = "OK";

/**
 * Indicates that the most recent report was an Error
 * or a timeout was triggered since the last OK report.
 */
StatusMonitor.STATE_ERROR = "ERROR";

StatusMonitor.prototype.getConfig = function() {
	return this.config;
};

StatusMonitor.prototype.reportStatus = function (report) {
	this.ensurePointDefined(report.name);
	let pointStatus = this.stateStore.load().points[report.name];
	let oldState = pointStatus.state;

	switch (report.state) {
	case StatusMonitor.STATE_OK:
	case StatusMonitor.STATE_ERROR:
		pointStatus.state = report.state;
		pointStatus.lastReport[report.state] = this.time();
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
		throw new Error("Invalid state '"+report.state+"' reported for point '"+report.name+"'");
	}

	// TODO [rkenney]: Sanitize this user input before logging
	// ... to prevent log forging.
	this.logger("Point '"+report.name+"' reported '"+report.state+"'");

	if (oldState != report.state) {
		let json = {pointName: report.name, oldState: oldState, newState: report.state};
		this.logger("State Changed: "+JSON.stringify(json));
		// TODO [rkenney]: Add support for "errorReason" to REST API, and pass here
		this.stateChangeHandler(report.name, oldState, report.state);
	}
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

		let newState = StatusMonitor.STATE_ERROR;
		if (this.hasReportWithinTimeout(point, StatusMonitor.STATE_OK)) {
			newState = StatusMonitor.STATE_OK;
		} else if (
			pointStatus.state == StatusMonitor.STATE_INITIAL &&
			this.hasReportWithinTimeout(point, StatusMonitor.STATE_INITIAL)) {
			newState = StatusMonitor.STATE_INITIAL;
		} else {
			newState = StatusMonitor.STATE_ERROR;
		}

		let oldState = pointStatus.state;
		pointStatus.state = newState;

		if (newState != oldState) {
			let errorReason = "";
			if (newState == StatusMonitor.STATE_ERROR) {
				errorReason = "Timed out";
			}
			this.stateChangeHandler(point, oldState, newState, errorReason);
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