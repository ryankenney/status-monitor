const StatusMonitor = require("./status-monitor.js");

class StatusChangeHistory {
	constructor() {
        this.stateChanges = {};
    }
};

StatusChangeHistory.prototype.handleStateChange = function(pointName, oldState, newState) {
    if (newState !== StatusMonitor.STATE_ERROR) {
        return;
    }
    if ( ! this.stateChanges[pointName] ) {  this.stateChanges[pointName] = {errorChanges: 0}; }
    this.stateChanges[pointName].errorChanges += 1;
};

StatusChangeHistory.prototype.getAndReset = function() {
    let history = this.stateChanges;
    this.stateChanges = [];
    return history;
};

module.exports = StatusChangeHistory;
