var sys = require('sys'),
		TwilioClient = require('twilio').Client,
		client = new TwilioClient("AC39f3537657aa0f92240718b691d49f21", "1c9814c61ad56c8a01acdcc61e5be143", "dev.brontesaurus.com");

var phone = client.getPhoneNumber("+18583338884");
var send_to = "+18587353377";

exports.sendError = function(msg) {
	phone.setup(function() {
		phone.sendSms(send_to, "Tadr error: "+msg, null, function(sms) {
		});
	});
};