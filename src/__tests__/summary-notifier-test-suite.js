const SummaryNotifier = require("../summary-notifier.js");
const StatusMonitor = require("../status-monitor.js");

it("Reports 'Points Currently in Error' when points have ERROR state points", () => {
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
	let history = {};
	let sentEmails = [];
	let mockEmailer = { send: (subject, body) => sentEmails.push({subject:subject, body:body}) };

	// Execute
	new SummaryNotifier(() => state, () => history, mockEmailer).sendNotification();

	// Verify (only ERROR points reported)
	expect(sentEmails.length).toEqual(1);
	expect(sentEmails[0].subject).toEqual("Status Summary - Errors Present");
	expect(sentEmails[0].body).toEqual("=== Points Currently in Error ===\npoint-with-error\npoint-2-with-error\n" +
		"\nNo Errors on Points in the Period\n");
});

it("Reports 'No Points Currently in Error' when no ERROR state points", () => {
	// Setup
	let state = {
		"point-with-ok": {"state":StatusMonitor.STATE_OK},
		"point-with-initial": {"state":StatusMonitor.STATE_INITIAL},
		"point-with-invalid": {"state":"XXXX"},
		"point-2-with-ok": {"state":StatusMonitor.STATE_OK},
		"point-2-with-initial": {"state":StatusMonitor.STATE_INITIAL},
		"point-2-with-invalid": {"state":"XXXX"}
	};
	let history = {};
	let sentEmails = [];
	let mockEmailer = { send: (subject, body) => sentEmails.push({subject:subject, body:body}) };

	// Execute
	new SummaryNotifier(() => state, () => history, mockEmailer).sendNotification();

	// Verify (only ERROR points reported)
	expect(sentEmails.length).toEqual(1);
	expect(sentEmails[0].subject).toEqual("Status Summary - OK");
	expect(sentEmails[0].body).toEqual("No Points Currently in Error\n" +
		"\nNo Errors on Points in the Period\n");
});

it("Reports 'History of Errors in the Period' when historical errors reported, regardless of current state", () => {
	// Setup
	let state = {
		"point-with-ok": {"state":StatusMonitor.STATE_OK},
		"point-with-initial": {"state":StatusMonitor.STATE_INITIAL},
		"point-with-invalid": {"state":"XXXX"},
	};
	let history = {
		"point-with-error-history": {errorChanges: 1},
		"point-2-with-error-history": {errorChanges: 33}
	};
	let sentEmails = [];
	let mockEmailer = { send: (subject, body) => sentEmails.push({subject:subject, body:body}) };

	// Execute
	new SummaryNotifier(() => state, () => history, mockEmailer).sendNotification();

	// Verify (only ERROR points reported)
	expect(sentEmails.length).toEqual(1);
	expect(sentEmails[0].subject).toEqual("Status Summary - Errors in the Period");
	expect(sentEmails[0].body).toEqual("No Points Currently in Error\n" +
		"\n=== History of Errors in the Period ===\npoint-with-error-history: 1 errors\npoint-2-with-error-history: 33 errors\n");
});

