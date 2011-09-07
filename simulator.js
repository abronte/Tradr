var db = require('./db');

if(process.argv[2] == null || process.argv[3] == null) {
	console.log("Usage: node simulator.js <TICKER> <DATE> <SHARES>");
	process.exit(0);
}

var ticker = process.argv[2];
var date = process.argv[3];
var shares = process.argv[4];

console.log("Simulating "+ticker+" on "+date);

db.getPrices(ticker, date, trade);

function trade(data) {
	var prices = [];
	var sma = [];
	var slopes = [];
	var current_slope;
	var sma_size = 20;
	var current_sma = 0;
	var slope_sma = [];
	var slope = null;
	var current_slope_sma;
	var current_price;
	var bought_at = 0;
	var times = [];

	var ema = [];
	var current_sma = [];

	var profit = 0;
	var commission = 0;

	for(var i=0; i<data.length; i++) {
		prices.push(parseFloat(data[i].price.price));
		times.push(data[i].price.market_time);
		current_price = parseFloat(data[i].price.price);

		/*****************************
		 * EMA
		*****************************/
		if(prices.length == sma_size) {
			var sum = 0;

			for(var j = prices.length - sma_size; j < prices.length; j++) {
				sum += prices[j];
			}

			current_sma = sum / sma_size;
			sma.push(current_sma);
		} else if(sma.length >= 1) { // EMA
			current_sma = (2/(sma_size+1)) * (current_price - current_sma) + current_sma;
			sma.push(current_sma);
		}

		//calculate slope
		if(sma.length >= 10) {
			slope = ((sma[sma.length-1] - sma[sma.length-10]) / 10) * 100;
			slopes.push(slope);
		}

		var buy = false;
		var sell = false;

		if(slope != null && slope > 0.18 && i < 330) {
			buy = true;
		}

		var l = slopes.length
		if(slopes[l-7] > slopes[l-6] && slopes[l-6] > slopes[l-5] && slopes[l-5] > slopes[l-4]
			 && slopes[l-4] > slopes[l-3] && slopes[l-3] > slopes[l-2] && slopes[l-2] > slopes[l-1]) {
			//sell = true;
		}

		if (slope < 0) {
			sell = true;
		}

		if(buy && i < 300 && bought_at == 0) {
				bought_at = current_price;
				commission += 4.95;
				//commission += shares * 0.0035
				console.log(times[i]+": buying "+current_price);
		}

		if((bought_at !=0 && current_price > bought_at) && (sell || i >= 360)) {
			if(shares != null) {
				cprofit = current_price * shares - bought_at * shares; 		
				profit += cprofit;
				console.log(times[i]+": selling: "+current_price+ " made "+cprofit);
				commission += 4.95;
				//commission += shares * 0.0035
			
			} else {
				console.log(times[i]+": selling: "+current_price);
			}
				
			bought_at = 0;
		}
	}

	if(shares != null) {
		console.log("revenue  :   "+profit);
		console.log("commision:   "+commission);
		console.log("profit   :   "+(profit-commission));
	}
	
	process.exit(0);
}
