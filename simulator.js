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

	var profit = 0;
	var commission = 0;

	for(var i=0; i<data.length; i++) {
		prices.push(parseFloat(data[i].price.price));
		times.push(data[i].price.market_time);
		current_price = parseFloat(data[i].price.price);

		/*****************************
		 * EMA
		*****************************/
		/*
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
		*/

		/*****************************
		 * SMA
		*****************************/
		//figure out SMA
		if(prices.length >= sma_size) {
			var sum = 0;

			for(var j = prices.length - sma_size; j < prices.length; j++) {
				sum += prices[j];
			}

			current_sma = sum / sma_size;
			sma.push(current_sma);
		}

		//calculate slope
		if(sma.length >= 5) {
			slope = ((sma[sma.length-1] - sma[sma.length-5]) / 5) * 100;
			slopes.push(slope);
		}

		var buy = false;
		var sell = false;

		// Bronte Price average crossover (BPAC)
		if(sma.length >= 30) {
			var below = true;

			for(var j=prices.length-31;j<prices.length-1;j++) {
				if(sma[j] > prices[j] - 0.02) {
					below = false;
				}
			}
			
			var price_above = true;	
			for(var j=prices.length-2;j<prices.length;j++) {
				if(prices[j] < sma[j]) {
					price_above = false;
				}
			}

			if(below && current_price > current_sma && price_above) {
				buy = true;
			}
			
			if(!below && current_price < current_sma) {
				sell = true;
			}

		}
		
		if(slope != null && slope > 0.18 && i < 330 && (current_price-current_sma < 0.08)) {
			buy = true;
		}

		//if (slope < 0) {
	//		sell = true;
		//}

		if(buy && i < 300 && bought_at == 0) {
				bought_at = current_price;
				//commission += 4.95;
				commission += shares * 0.0035
				console.log(times[i]+": buying "+current_price);
		}

		if((bought_at !=0 && current_price > bought_at) && (sell || i >= 360)) {
			if(shares != null) {
				cprofit = current_price * shares - bought_at * shares; 		
				profit += cprofit;
				console.log(times[i]+": selling: "+current_price+ " made "+cprofit);
				//commission += 4.95;
				commission += shares * 0.0035
			
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
