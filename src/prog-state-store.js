var FS = require('fs-extra');

class ProgStateStore {
	constructor(file) {
		this.file = file;
	}
}
/**
 * Writes the provided JSON object to the backing file.
 */
ProgStateStore.prototype.store = function (state) {
	let file = this.file;
	let temp = this.file+".tmp";
	FS.writeFileSync(temp, JSON.stringify(state), 'utf8');
	FS.renameSync(temp, file);
	this.state = state;
};

/**
 * Reads the current state from the file-backed store. Technically, this reads the cached
 * copy of the state. This is safe so long as the application is single-threaded,
 * and no other applications modify the file.
 */
ProgStateStore.prototype.load = function (state) {
	if (!this.wasLoaded) {
		let json = "{ \"points\": {} }";
		if (FS.existsSync(this.file)) {
			json = FS.readFileSync(this.file);
		}
        this.state = JSON.parse(json);
		this.wasLoaded = true;
	}
	return this.state;
};

module.exports = ProgStateStore;
