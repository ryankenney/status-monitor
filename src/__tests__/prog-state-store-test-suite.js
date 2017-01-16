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
    store.saveState({"x":"value"});
    expect(FS.existsSync(file)).toEqual(true);
    let data = store.loadState(file);
    expect(data).toEqual({"x":"value"});
});

