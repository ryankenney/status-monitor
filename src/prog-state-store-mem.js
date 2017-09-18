class ProgStateStoreMem {}

ProgStateStoreMem.prototype.store = function (state) {
	this.state = state;
};

ProgStateStoreMem.prototype.load = function () {
	if (!this.wasLoaded) {
		this.state = { 'points': {} };
		this.wasLoaded = true;
	}
	return this.state;
};

module.exports = ProgStateStoreMem;
