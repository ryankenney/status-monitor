var Express = require('express');

class RestService {
    constructor(port, statusMonitor, logger) {

        this.bindRestEndpoints = function(restApp) {
            let statusMonitor = this.statusMonitor;
            restApp.get('/status-report', function (req, res) {
                statusMonitor.getStatus();
                res.end(JSON.stringify(statusMonitor.getStatus()));
            });
            restApp.get('/report-status', function (req, res) {
                if (!(typeof req.body.name === 'string')) {
                    throw Error("Missing name field")
                }
                if (!(typeof req.body.state === 'string')) {
                    throw Error("Missing state field")
                }
                statusMonitor.reportStatus(req.body);
                res.end("");
            });
        };

        this.startRestServer = function(restApp, port) {
            let logger = this.logger;
            let server = restApp.listen(port, function () {
                var host = server.address().address;
                var port = server.address().port;
                logger("REST server listening at http://"+host+":"+port+"/");
            });
            return server;
        };

        this.statusMonitor = statusMonitor;

        if (logger) {
            this.logger = logger;
        } else {
            this.logger = (msg) => console.log(msg);
        }
        let restApp = Express();
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
