var Client = require('node-rest-client').Client;
var LangUtil = require('./lang-util.js');

class RestClient {
    constructor(baseUrl, logger) {
        if (logger) {
            this.logger = logger;
        } else {
            this.logger = (msg) => console.log(msg);
        }
        this.client = new Client();
        // TODO [rkenney]: Remove debug
        this.client.registerMethod("getHello", baseUrl+"/hello", "GET");
        this.client.registerMethod("getStatusReport", baseUrl+"/status-report", "GET");
    }
};

// TODO [rkenney]: Remove debug
RestClient.prototype.getHello = function() {
    this.client.methods.getHello(function (data, response) {
        // parsed response body as js object
        // console.log(data["data"]);
        // raw response

        if (response.statusCode > 299) {
            throw Error("HTTP request failed with code ["+response.statusCode+":"+response.statusMessage+"]");
        }

        // TODO [rkenney]: Remove debug
        // console.log(response);
        console.log(data.toString('utf8'));

        });
};

RestClient.prototype.getStatusReport = function(done) {

    // TODO [rkenney]: Remove debug
    console.log("Printing Props...");
    LangUtil.forEachProperty(this, (prop) => {
        console.log("Prop: "+prop);
    });

    this.client.methods.getStatusReport((data, response) => {
        verifyHttpStatus(response);
        httpResponseToString(data);

        // TODO [rkenney]: Remove debug
        let dataString = data.toString('utf8');
        console.log("DATA: "+data.toString('utf8'));

        // TODO [rkenney]: Plugin callback here (Promise?)
        done(JSON.parse(dataString));
    });
};

const verifyHttpStatus = (response) => {
    if (response.statusCode > 299) {
        throw Error("HTTP request failed with code ["+response.statusCode+":"+response.statusMessage+"]");
    }
};

const httpResponseToString = (data) => {
    return data.toString('utf8');
}


module.exports = RestClient;
