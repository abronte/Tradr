var tk = require('./tradeking');
var express = require('express');
var app = express.createServer();

var sma_size = 50;
var shares = 200;
var value = 0;
var bought_at = 0;
var sell_at = 0;
var total_profit = 0;

var sma = [];
var prices = [];

var current_sma = 0;

app.get('/', function(req, res){
	var html = 'profit: '+total_profit;

	res.send(html);
});

app.listen(3011);

function main() {
	tk.quotes(['INTC'], function(data) {
		quote = data.response.quotes.instrumentquote.quote;
		console.log("price: "+quote.lastprice);

		prices.push(quote.lastprice);

		if(prices.length >= sma_size) {
			var sum = 0;

			for(var i = prices.length - sma_size; i < prices.length; i++) {
			 sum += prices[i];
			}

			current_sma = sum / sma_size;

			console.log("avg: "+current_sma);
		}

		if((current_sma != 0) && (quote.lastprice >= current_sma && quote.lastprice >= current_sma + 0.02)) {
			console.log("buying at "+quote.lastprice);
			bought_at = quote.lastprice;
		}
		
		if(quote.lastprice <= sma && quote.lastprice <= sma - 0.02 && quote.lastprice > bought_at) {
			var profit = (quote.lastprice * shares) - (bought_at * shares);
			total_profit += profit;

			console.log("selling at "+quote.lastprice);
			console.log("profit: "+profit);
			console.log("total profit: "+total_profit);

			bought_at = quote.lastprice;
		}

		if(prices.length >= 200) {
			prices = prices.slice(prices.size - sma_size, prices.size);
		}
		
		if(sma.length >= 200) {
			sma = sma.slice(sma.size - sma_size, sma.size);
		}
	});
}

setInterval(main, 5000);