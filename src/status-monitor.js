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


var errorLogger;

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
var StatusMonitor = {
	
	setConfig: function(newConfig) {
		validateConfig(newConfig);
		config = newConfig;
	},

	getConfig: function(newConfig) {
		return config;
	},

	reportStatus: function(report) {
		let point = config.points[report.name];

		if (!point) {
			// TODO [rkenney]: Sanitize this user input before logging
			// ... to prevent log forging.
			throw new Error("Invalid point '"+report.name+"'");
		}

		switch (report.status) {
		case "OK":
			point.lastReportOK = new Date();
			break;
		case "ERROR":
			point.lastReportError = new Date();
			break;
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
		point.lastReportOK = new Date();

		// TODO [rkenney]: Sanitize this user input before logging
		// ... to prevent log forging.
		logger.log("Point '"+report.name+"' reported '"+report.status+"'");
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