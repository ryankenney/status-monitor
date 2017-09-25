let GmailSend = require('gmail-send');

class Emailer {
	constructor(config) {
	    this.toAddress = config.toAddress;
		this.gmailSender = GmailSend({
			user: config.username,
			pass: config.password,
			to: config.toAddress
		});
		this.subjectPrefix = config.subjectPrefix;
	    this.logger = config.logger;
    }
};

Emailer.prototype.send = function(subject, body) {
	
	// TODO [rkenney]: Remove temporary hack
	// this.logger('Simulated email [' + subject + '] sent');
	// return;
	let _logger = this.logger;
	this.gmailSender({
		subject: this.subjectPrefix + subject,
		text: body
	}, function (error, response) {
		if (error) {
			_logger(error);
		} else {
			_logger('Email [' + this.subjectPrefix + subject + '] sent with response [' + response + ']');
		}
	});
};

module.exports = Emailer;
