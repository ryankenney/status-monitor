const StatusMonitor = require("./status-monitor.js");
const LangUtil = require("./lang-util.js");

class SummaryNotifier {
	constructor(currentStateProvider, errorHistoryProvider, emailer) {

        this.getCurrentErrorPoints = function () {
            let points = this.currentStateProvider();
            points = LangUtil.propsToArray(points).filter((point) => point.value.state === StatusMonitor.STATE_ERROR);
            // TODO [rkenney]: Implement sorting with proper compare
            // points = points.sort((p1,p2) => {
            //     if (!p1.key) {p1.key = ""; }
            //     if (!p2.key) {p2.key = ""; }
            //     return p1.key.compare(p2.key);
            // });
            return points;
        };

        this.getPointsInErrorBody = function (pointsInError) {
            let message = "";
            if (pointsInError.length > 0) {
                message += "=== Points Currently in Error ===\n";
                pointsInError.forEach((point) => {
                    message += "" + point.key + "\n";
                    // TODO [rkenney]: Add "days since"
                });
            } else {
                message += "No Points Currently in Error\n";
            }
            return message;
        };

        this.getPointsErrorHistory = function() {
            let points = this.errorHistoryProvider();
            points = LangUtil.propsToArray(points);
            // TODO [rkenney]: Implement sorting with proper compare
            return points;
        }

        this.getPointErrorHistoryBody = function(points) {
            let message = "";
            if (points.length > 0) {
                message += "=== History of Errors in the Period ===\n";
                points.forEach((point) => {
                    message += "" + point.key + ": " + point.value.errorChange + " errors\n";
                });
            } else {
                message += "No Errors on Points in the Period\n";
            }
            return message;
        };

        this.currentStateProvider = currentStateProvider;
        this.errorHistoryProvider = errorHistoryProvider;
        this.emailer = emailer;
    }
};

// TODO [rkenney]: Replace class with Notifier

SummaryNotifier.prototype.sendNotification = function() {
    let currentErrorPoints = this.getCurrentErrorPoints();
    let message = this.getPointsInErrorBody(currentErrorPoints);
    message += "\n";
    let periodErrorPoints = this.getPointsErrorHistory();
    message += this.getPointErrorHistoryBody(periodErrorPoints);
    let subject;
    if (currentErrorPoints.length > 0) {
	    subject = "Status Summary - Errors Present";
    } else if (periodErrorPoints.length > 0) {
	    subject = "Status Summary - Errors in the Period";
    } else {
	    subject = "Status Summary - OK";
    }
    this.emailer.send(subject, message);
}

module.exports = SummaryNotifier;
