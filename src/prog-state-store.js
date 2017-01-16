var FS = require('fs-extra');

class ProgStateStore {
    constructor(file) {
        this.file = file;
    }
}
/**
 * Returns a Promise that writes the provided JSON object to the specified file.
 * This Promise will throw an exception (Error) if the write fails for any reason.
 * (Use .catch() to handle the exception.)
 */
ProgStateStore.prototype.saveState = function (state) {
    let file = this.file;
    let temp = this.file+".tmp";
    return new Promise((resolve) => {
        FS.writeFile(temp, JSON.stringify(state), function(err) {
            if(err) {
                throw new Error("Failed to write to ["+temp+"]");
            }
            FS.renameSync(temp, file);
            resolve();
        });
    });
};

/**
 * Synchronously reads and returns the underlying file as a JSON object.
 * Throws an exception (Error) if the read fails for any reason, including not-existing.
 * (Use try {} catch {} to handle the exception.)
 */
ProgStateStore.prototype.loadStateSync = function (state) {
    if (!FS.existsSync(this.file)) {
        return null;
    }
    return JSON.parse(FS.readFileSync(this.file));
};

module.exports = ProgStateStore;
