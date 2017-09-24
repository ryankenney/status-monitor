/**
 *  Returns a {Promise} that loads a  json file from either a
 *  local or remote path depending upon which is set (precedence left-to-right).
 *  Therefore, if urlPath is set, it is used. Else, if filePath set,
 *  it is used. Else defaultFilePath is used.
 *
 * @returns {Promise}
 */
let loadConfigArtifact = function(urlPath, filePath, defaultFilePath) {
	return new Promise((resolve) => {
		// Load form URL (if defined)
		if (urlPath) {
			request({
				url: urlPath,
				json: true
			}, function (error, response, body) {
				if (error) {
					throw error;
				}
				if (response.statusCode != 200) {
					throw new Error("Failed to download config from [" + urlPath + "]. Status code [" + response.statusCode + "].");
				}
				resolve(body);
			});
		}
		// Load from local file
		else {
			let file = filePath;
			if (!file) {
				// Default to config file in root directory
				file = defaultFilePath;
			}
			let json = require(file);
			if (!json) {
				throw new Error("Failed to load config file ["+file+"]");
			}
			resolve(json);
		}
	});
};

let ConfigLoader = {
	
	loadConfig: function() {
		return loadConfigArtifact(process.env.CONFIG_URL, process.env.CONFIG_FILE,
			"../config.json" /* Defaults to file at the root of the source directory */)
	},
		
	loadPasswords: function() {
		return loadConfigArtifact(process.env.PASSWORDS_URL, process.env.PASSWORDS_FILE,
			"../passwords.json" /* Defaults to file at the root of the source directory */)
	}
};

module.exports = ConfigLoader;