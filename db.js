var request = require('request');
var phone = require('./phone');
var url = "http://localhost:3012";

exports.getStocks = function(callback) {
	callback();
}

function post(path, data) {
	try {
		request({
			method: 'POST',
			uri: url+path, 
			body: data 
		});
	} catch(e) {
		console.log("Unable to connect to management");
		phone.sendError("Unable to connect to management");
	}
}

exports.addTransaction = function(ticker, type, bought, sold, shares, date) {
	post('/api/add_transaction', 'ticker='+ticker+'&paid='+bought+'&deal='+type+'&sold='+sold+'&shares='+shares+'&date='+date.toLocaleDateString()+'&time='+date.toLocaleTimeString());
}

exports.addPrice = function(ticker, price, date, buy, vol) {
	post('/api/add_price', 'ticker='+ticker+'&price='+price+'&date='+date.toLocaleDateString()+'&time='+date.toLocaleTimeString()+'&buy='+buy+'&vol='+vol);
}

exports.getPrices = function(ticker, date, callback) {
	request.get(url+'/api/prices/'+ticker+'?date='+date, function (error, response, body) {
		callback(JSON.parse(body));
	});
}
