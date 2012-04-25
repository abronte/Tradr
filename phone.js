var sys = require('sys'),
		TwilioClient = require('twilio').Client,
		client = new TwilioClient("APIKEY", "APISECRET", "dev.brontesaurus.com");

var phone = client.getPhoneNumber("PHONE NUMBER");
var send_to = "PHONE NUMBER";

exports.sendError = function(msg) {
	phone.setup(function() {
		phone.sendSms(send_to, "Tadr error: "+msg, null, function(sms) {
		});
	});
};