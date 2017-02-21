const SummaryNotifier = require("../summary-notifier.js");
const StatusMonitor = require("../status-monitor.js");

it('Reports only ERROR status points', () => {
	// Setup
	let state = {
		"point-with-error": {"state":StatusMonitor.STATE_ERROR},
		"point-with-ok": {"state":StatusMonitor.STATE_OK},
		"point-with-initial": {"state":StatusMonitor.STATE_INITIAL},
		"point-with-invalid": {"state":"XXXX"},
		"point-2-with-error": {"state":StatusMonitor.STATE_ERROR},
		"point-2-with-ok": {"state":StatusMonitor.STATE_OK},
		"point-2-with-initial": {"state":StatusMonitor.STATE_INITIAL},
		"point-2-with-invalid": {"state":"XXXX"}
	};
	let sentEmails = [];
	let mockEmailer = { send: (subject, body) => sentEmails.push({subject:subject, body:body}) };

	// Execute
	new SummaryNotifier(() => state, mockEmailer).sendNotification();

	// Verify (only ERROR points reported)
	expect(sentEmails.length).toEqual(1);
	expect(sentEmails[0].subject).toEqual("2 Points in Error");
	expect(sentEmails[0].body).toEqual("=== Points in Error ===\npoint-with-error\npoint-2-with-error\n");
});

it('Reports only no errors if no ERROR status points', () => {
	// Setup
	let state = {
		"point-with-ok": {"state":StatusMonitor.STATE_OK},
		"point-with-initial": {"state":StatusMonitor.STATE_INITIAL},
		"point-with-invalid": {"state":"XXXX"},
		"point-2-with-ok": {"state":StatusMonitor.STATE_OK},
		"point-2-with-initial": {"state":StatusMonitor.STATE_INITIAL},
		"point-2-with-invalid": {"state":"XXXX"}
	};
	let sentEmails = [];
	let mockEmailer = { send: (subject, body) => sentEmails.push({subject:subject, body:body}) };

	// Execute
	new SummaryNotifier(() => state, mockEmailer).sendNotification();

	// Verify (only ERROR points reported)
	expect(sentEmails.length).toEqual(1);
	expect(sentEmails[0].subject).toEqual("No Points in Error");
	expect(sentEmails[0].body).toEqual("No Points in Error\n");
});
