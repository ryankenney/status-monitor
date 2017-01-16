var FS = require('fs-extra');
var ProgStateStore = require('../prog-state-store.js');

let testFiles = "./test-temp";

beforeEach(() => {
	FS.removeSync(testFiles);
	FS.mkdirsSync(testFiles);
});

test('Write and read file', () => {
    let file = testFiles+"/file.json";
    let store = new ProgStateStore(file);
    return new Promise((resolve) => {
        store.saveState({"x":"value"}).then(() => resolve());
    }).then(() => {
        expect(FS.existsSync(file)).toEqual(true);
    }).then(() => {
        let data = store.loadStateSync(file);
        expect(data).toEqual({"x":"value"});
    });
});

