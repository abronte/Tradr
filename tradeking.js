var oauth = require('oauth');

var configuration = {
  api_url: "https://api.tradeking.com/v1",
  consumer_key: "YhlanUFeNF9gpp5HAQG0Btvmm1MUpwvnprvLbnC6",
  consumer_secret: "D05hrAUNhAtOJomi4pjQkeQgwYqatXtmrL4w85Ji",
  access_token: "vHToJi2kU1fcRb0JsXVjZqggARnoHLwYIydAnh9T",
  access_secret: "7rtuZ4n1IyLvuSmIV9zFUC8HY7Lk8eYAzRVUdn3x"
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
      //console.log(data);
      data = JSON.parse(data);
      callback(data)
    }
  ); 
}

exports.quotes = function(tickers, callback) {
  call('/market/quotes.json?symbols='+tickers.join(',')+'&delayed=false', callback);
};
