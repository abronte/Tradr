var tk = require('./tradeking');
var express = require('express');
var app = express.createServer();

var sma_size = 20;
var shares = 200;
var bought_at = 0;
var sold_at = 0;
var total_profit = 0;

var sma = [];
var prices = [];
var slopes = [];

var current_sma = 0;

app.get('/', function(req, res){
	var html = 'profit: '+total_profit+'<br/>';

	html += '<br/>current price: '+prices[prices.length-1];
	html += '<br/>current sma: '+current_sma;
	
	if(bought_at != 0) {
		html += '<br/>bought at: '+bought_at;	
	}

	if (sold_at != 0) {
		html += '<br/>sold at: '+sold_at;
	}

	res.send(html);
});

app.listen(3011);

function marketOpen() {
		return true;
	var time = new Date();

	if(time.getHours() >= 5 && time.getHours() < 13) 
		return true;
	else
		return false;
}

function main() {
	if (!marketOpen()) {
		return;
	}

	tk.quotes(['INTC'], function(data) {
		if (data.response == null) {
			return;
		}

		quote = data.response.quotes.instrumentquote.quote;
		console.log("price: "+quote.lastprice);

		current_price = parseFloat(quote.lastprice);
		prices.push(current_price);

		//figure out SMA
		if(prices.length >= sma_size) {
			var sum = 0;

			for(var i = prices.length - sma_size; i < prices.length; i++) {
				sum += prices[i];
			}

			current_sma = sum / sma_size;
			sma.push(current_sma);

			console.log("avg: "+current_sma);
		}

		//calculate slope
		if(sma.length >= 5) {
			diff = sma[sma.length-1] - sma[sma.length-5];
			slopes.push(diff / 5);
		}

		var buy = false;

		if(slopes.length >= 5) {
			sum = 0;

			for(var i = slopes.length-3; i<slopes.length-1; i++) {
				console.log('adding slope: '+slopes[i]);
				sum += slopes[i];	
			}

			if(sum > 0) {
				buy = true;
			}
		}

		//buy 
		if(buy && bought_at == 0) {
			console.log("buying at "+current_price);
			bought_at = current_price;
		}

		//sell
		if(bought_at != 0 && !buy) {
			var profit = (current_price * shares) - (bought_at * shares);
			total_profit += profit;

			console.log("selling at "+current_price);
			console.log("profit: "+profit);
			console.log("total profit: "+total_profit);

			bought_at = 0;
		}

		//dont cause memory leaks
		if(prices.length > 300) {
			prices = prices.slice(300 , prices.length - 1);
		}
		
		if(sma.length > 300) {
			sma = sma.slice(300, sma.length - 1);
		}
		
		if(slopes.length > 300) {
			slopes = slopes.slice(300, slopes.length - 1);
		}
	});
}

setInterval(main, 120 * 1000);