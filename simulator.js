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
	var current_slope_sma;
	var current_price;
	var bought_at = 0;
	var times = [];

	var profit = 0;
	var commission = 0;

	for(var i=0; i<data.length; i++) {
		prices.push(parseFloat(data[i].price.price));
		times.push(data[i].price.market_time);
		current_price = parseFloat(data[i].price.price);
		
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

		if(sma.length >= 10) {
			current_slope = (sma[sma.length-1]-sma[sma.length-10])/10;
			//console.log("("+sma[sma.length-1]+" - "+sma[sma.length-10]+" / 10 = "+current_slope);
			slopes.push(current_slope);
		}

		if(slopes.length >= 3 && i < 330) {
			if(current_slope > slopes[slopes.length-2] && 
				 slopes[slopes.length-2] > slopes[slopes.length-3] && 
				 slopes[slopes.length-3] > slopes[slopes.length-4] &&
				 current_slope >= 0.005 && bought_at == 0) {
				bought_at = current_price;
				commission += 4.95;
				console.log(times[i]+": buying "+current_price);
			} 
		}

		if(((current_slope < 0.003 && current_slope < slopes[slopes.length-2]) || (i >= 375) )
			//|| current_price < sma[sma.length-1]) 
			&& bought_at != 0 && current_price > bought_at) {
				if(shares != null) {
					cprofit = current_price * shares - bought_at * shares; 		
					profit += cprofit;
					console.log(times[i]+": selling: "+current_price+ " made "+cprofit);
					commission += 4.95;
				} else {
					console.log(times[i]+": selling: "+current_price);
				}
				
				bought_at = 0;
		}

		/*
		//figure out SMA
		if(prices.length >= sma_size) {
			var sum = 0;

			for(var i = prices.length - sma_size; i < prices.length; i++) {
				sum += prices[i];
			}

			current_sma = sum / sma_size;
			sma.push(current_sma);
		}

		//calculate slope
		if(sma.length >= 2) {
			slope = (sma[sma.length-1] - sma[sma.length-2]) / 2;
			slopes.push(slope);
		}

		//calculate slope sma
		if(slopes.length >= 5) {
			var sum = 0;

			for(var i = slopes.length-5;i<slopes.length; i++) {
				sum += slopes[i];
			}

			current_slope_sma = sum / 5;
			slope_sma.push(current_slope_sma);
		}

		var buy = false;

		if(slope_sma.length >= 1) {
			if(current_slope_sma >= 0.01) {
				buy = true;
			}
		}

		if(buy && bought_at == 0) {
				bought_at = current_price;
				console.log("Buying at: "+current_price);
		}

		if((bought_at !=0 && current_price > bought_at) && current_slope_sma < 0) {
			console.log("Selling at: "+current_price);
			bought_at = 0;
		}
		*/
	}

	if(shares != null) {
		console.log("revenue  :   "+profit);
		console.log("commision:   "+commission);
		console.log("profit   :   "+(profit-commission));
	}
	
	process.exit(0);
}
