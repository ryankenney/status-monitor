var Express = require('express');
var BodyParser = require("body-parser");

class RestService {
    constructor(port, statusMonitor, logger) {

        if (logger) {
            this.logger = logger;
        } else {
            this.logger = (msg) => console.log(msg);
        }
        logger = this.logger;

        this.handleRootException = function(exception, request, respond) {
            try {
                let url = "";
                let method = "";
                if ( request && request.url ) { url = request.url; }
                if ( request && request.method ) { method = request.method+" "; }
                logger("Request "+method+" ["+url+"] failed");
                logger(exception);
                respond.status(500).send("{}");
            } catch (e) {
                console.log(e);
            }
        }

        this.bindRestEndpoints = function(restApp) {
            let statusMonitor = this.statusMonitor;
            let handleRootException = this.handleRootException;

            restApp.get('/status-report', function (req, res) {
                statusMonitor.getStatus();
                res.end(JSON.stringify(statusMonitor.getStatus()));
            });
            restApp.post('/report-status', function (req, res) {
                try {
                    if (!(typeof req.body.name === 'string')) {
                        throw new Error("Missing name field")
                    }
                    if (!(typeof req.body.state === 'string')) {
                        throw new Error("Missing state field")
                    }
                    statusMonitor.reportStatus(req.body);
                    res.end("{}");
                } catch (e) {
                    handleRootException(e, req, res);
                }
            });
        };

        this.startRestServer = function(restApp, port) {
            let server = restApp.listen(port, function () {
                let host = server.address().address;
                let port = server.address().port;
                logger("REST server listening at http://"+host+":"+port+"/");
            });
            return server;
        };

        this.statusMonitor = statusMonitor;
        let restApp = Express();
        // Automatically parse payloads as JSON
        restApp.use(BodyParser.json());
        this.bindRestEndpoints(restApp);
        this.server = this.startRestServer(restApp, port);
    }
};

RestService.prototype.shutdown = function() {
    if (this.server) {
        this.server.close();
        this.server = null;
    }
};

module.exports = RestService;
