var oauth = require('oauth');

var configuration = {
  api_url: "https://api.tradeking.com/v1",
  consumer_key: "",
  consumer_secret: "",
  access_token: "",
  access_secret: ""
}

var consumer = new oauth.OAuth(
  "https://developers.tradeking.com/oauth/request_token",
  "https://developers.tradeking.com/oauth/access_token",
  configuration.consumer_key,
  configuration.consumer_secret,
  "1.0",
  "http://mywebsite.com/tradeking/callback",
  "HMAC-SHA1");

function call(uri, callback) {
  consumer.get(configuration.api_url+uri, configuration.access_token, configuration.access_secret,
    function(error, data, response) {
			if(error) {
				console.log(error);
			}

			try {
				data = JSON.parse(data);
				callback(data)
			} catch(e) {
				console.log("ERROR PARSING JSON: "+e);
				console.log("retrying call...");
				call(uri, callback);
			}
    }
  ); 
}

exports.quotes = function(tickers, callback) {
	try {
		call('/market/quotes.json?symbols='+tickers.join(',')+'&delayed=false', callback);
	} catch(e) {
		console.log("ERROR: "+e);
		call('/market/quotes.json?symbols='+tickers.join(',')+'&delayed=false', callback);
	}
};

exports.marketStatus = function(callback) {
	try {
		call('/market/clock.json', callback);
	} catch(e) {
		console.log("ERROR: "+e);
		call('/market/clock.json', callback);
	}
}
