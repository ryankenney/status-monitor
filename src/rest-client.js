var Client = require('node-rest-client').Client;

class RestClient {
	constructor(baseUrl, logger) {
		if (logger) {
			this.logger = logger;
		} else {
			this.logger = (msg) => console.log(msg);
		}
		this.client = new Client();
		this.client.registerMethod("getStatusReport", baseUrl+"/status-report", "GET");
		this.client.registerMethod("postPointStatus", baseUrl+"/report-status", "POST");
	}
};

RestClient.prototype.getStatusReport = function(done) {
	this.client.methods.getStatusReport((data, response) => {
		verifyHttpStatus(response);
		let dataString = httpResponseToString(data);
		done(JSON.parse(dataString));
	});
};

RestClient.prototype.postPointStatus = function(report, done) {
	let data = {
		data:report,
		headers: { "Content-Type": "application/json" }
	};
	this.client.methods.postPointStatus(data, (data, response) => {
		verifyHttpStatus(response);
		let dataString = httpResponseToString(data);
		done(JSON.parse(dataString));
	});
};

const verifyHttpStatus = (response) => {
	if (response.statusCode > 299) {
		throw new Error("HTTP request failed with code ["+response.statusCode+":"+response.statusMessage+"]");
	}
};

const httpResponseToString = (data) => {
	return data.toString('utf8');
}


module.exports = RestClient;
