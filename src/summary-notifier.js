const StatusMonitor = require("./status-monitor.js");
const LangUtil = require("./lang-util.js");

class SummaryNotifier {
	constructor(stateProvider, emailer) {
        this.stateProvider = stateProvider;
        this.emailer = emailer;
    }
};

SummaryNotifier.prototype.sendNotification = function() {
    let points = this.stateProvider();
    points = LangUtil.propsToArray(points).filter((point) => point.value.state === StatusMonitor.STATE_ERROR);
    // TODO [rkenney]: Implement sorting with proper compare
    // points = points.sort((p1,p2) => {
    //     if (!p1.key) {p1.key = ""; }
    //     if (!p2.key) {p2.key = ""; }
    //     return p1.key.compare(p2.key);
    // });
    let message = "";
    if (points.length > 0) {
        message += "=== Points in Error ===\n";
        points.forEach((point) => {
            message += "" + point.key + "\n";
            // TODO [rkenney]: Add "days since"
        });
    } else {
        message += "No Points in Error\n";
    }
    let subject = points.length > 0
        ? "" + points.length + " Points in Error"
        : "No Points in Error";
    this.emailer.send(subject, message);
}

module.exports = SummaryNotifier;
