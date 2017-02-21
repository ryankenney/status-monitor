class Emailer {
	constructor(toAddress, logger) {
	    this.toAddress = toAddress;
	    this.logger = logger;
    }
};

// TODO [rkenney]: Implement actual email
Emailer.prototype.send = function(subject, body) {
    this.logger("-- Email --");
    this.logger("To: "+this.toAddress);
    this.logger("Subject: "+subject);
    this.logger("Body:");
    this.logger(body);
    this.logger("--------");
};

module.exports = Emailer;
