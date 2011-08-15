var request = require('request');
var url = "http://localhost:3012";

exports.getStocks = function(callback) {
	callback();
}

exports.addTransaction = function(ticker, type, bought, sold, shares) {
	request({
		method: 'POST',
		uri: url+'/api/add_transaction', 
		body: 'ticker='+ticker+'&paid='+bought+'&deal='+type+'&sold='+sold+'&shares='+shares
	});
}

exports.addPrice = function(ticker, price) {
	request({
		method: 'POST',
		uri: url+'/api/add_price',
		body: 'ticker='+ticker+'&price='+price
	});
}
