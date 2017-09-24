let GmailSend = require('gmail-send');

class Emailer {
	constructor(toAddress, username, password, logger) {
	    this.toAddress = toAddress;
		this.transporter = NodeMailer.createTransport({
			service: 'gmail',
			auth: {
				user: username,
				pass: password
			}
		});
		
		this.gmailSender = GmailSend({
			user: username,
			pass: password,
			to: toAddress
		});
	    
	    this.logger = logger;
    }
};

Emailer.prototype.send = function(subject, body) {
	
	// TODO [rkenney]: Remove temporary hack
	this.logger('Simulated email [' + subject + '] sent');
	return;
	
	this.gmailSender({
		subject: subject,
		text: body
	}, function (error, response) {
		if (error) {
			this.logger(error);
		} else {
			this.logger('Email [' + subject + '] sent with response [' + response + ']');
		}
	});
};

module.exports = Emailer;
