var FS = require('fs-extra');

class ProgStateStore {
    constructor(file) {
        this.file = file;
    }
}
/**
 * Writes the provided JSON object to the specified file.
 * Throws an exception (Error) if the read fails for any reason, including not-existing.
 * (Use try {} catch {} to handle the exception.)
 */
ProgStateStore.prototype.saveState = function (state) {
    let file = this.file;
    let temp = this.file+".tmp";
    FS.writeFileSync(temp, JSON.stringify(state), 'utf8');
    FS.renameSync(temp, file);
};

/**
 * Synchronously reads and returns the underlying file as a JSON object.
 * Throws an exception (Error) if the read fails for any reason, including not-existing.
 * (Use try {} catch {} to handle the exception.)
 */
ProgStateStore.prototype.loadState = function (state) {
    if (!FS.existsSync(this.file)) {
        throw new Error("Failed to read file ["+this.file+"]");
    }
    return JSON.parse(FS.readFileSync(this.file));
};

module.exports = ProgStateStore;
