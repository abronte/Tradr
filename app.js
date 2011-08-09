var tk = require('./tradeking');
var express = require('express');
var app = express.createServer();
var os = require('os');

process.stdout.on('drain', function(){
	os.freemem();
});

var watch = ['INTC', 'CRZO', 'TIE', 'JOYG', 'XOM'];
var portfolio = {};

var sma_size = 20;
var shares = 200;

app.get('/', function(req, res){
	var profit = 0;
	var html = "<table>";
	
	for(var i=0; i<4;i++) {
		data = portfolio[watch[i]];
		profit += data.profit;
		html += '<tr><td>'+watch[i]+'</td><td>profit:</td><td>'+data.profit+'</td>'
		html += '<td>bought at:</td><td>'+data.bought_at+'</td><td>current:</td><td>'+data.current_price+'</td></tr>';
	}

	html += '</table>'

	html += '<br/><br/>profit: '+profit+'<br/>';

	res.send(html);
});

app.listen(3011);

function marketOpen() {
	var time = new Date();

	if(time.getHours() >= 5 && time.getHours() < 13) 
		return true;
	else
		return false;
}

function trade(ticker, quote) {
	if(portfolio[ticker] == null) {
		portfolio[ticker] = {'sma':[], 
			                   'prices':[], 
												 'slopes':[],
												 'bought_at':0,
												 'sold_at':0,
												 'profit':0,
												 'current_sma':0,
		                     'current_price':0};

	}

	data = portfolio[ticker];

	current_price = parseFloat(quote.lastprice);
	data.current_price = current_price;
	data.prices.push(current_price);
	
	console.log(ticker+' price: '+current_price);
		
	//figure out SMA
	if(data.prices.length >= sma_size) {
		var sum = 0;

		for(var i = data.prices.length - sma_size; i < data.prices.length; i++) {
			sum += data.prices[i];
		}

		data.current_sma = sum / sma_size;
		data.sma.push(data.current_sma);

		console.log(ticker+ " - avg: "+data.current_sma);
	}

	//calculate slope
	if(data.sma.length >= 5) {
		slope = (data.sma[data.sma.length-1] - data.sma[data.sma.length-5]) / 5;
		//console.log(ticker+" - slope: "+slope);
		data.slopes.push(slope);
	}

	var buy = false;

	if(data.slopes.length >= 5) {
		sum = 0;

		for(var i = data.slopes.length-3; i<data.slopes.length-1; i++) {
			//console.log('adding slope: '+data.slopes[i]);
			sum += data.slopes[i];	
		}

		console.log(ticker+" - buy indicator: "+sum);

		if(sum > 0) {
			buy = true;
		}
	}

	//buy 
	if(buy && data.bought_at == 0) {
		console.log(ticker+ " - buying at: "+current_price);
		data.bought_at = current_price;
	}

	//sell
	if(data.bought_at != 0 && !buy && data.bought_at < current_price) {
		var profit = (current_price * shares) - (data.bought_at * shares);
		data.profit += profit;

		console.log(ticker+" - selling at: "+current_price);
		console.log(ticker+" - profit: "+profit);
		console.log(ticker+" - total profit: "+data.profit);

		data.bought_at = 0;
	}

	//dont cause memory leaks
	if(data.prices.length > 300) {
		data.prices = data.prices.slice(300 , data.prices.length - 1);
	}
	
	if(data.sma.length > 300) {
		data.sma = data.sma.slice(300, data.sma.length - 1);
	}
	
	if(data.slopes.length > 300) {
		data.slopes = data.slopes.slice(300, data.slopes.length - 1);
	}
}

function main() {
	if (!marketOpen()) {
		return;
	}

	tk.quotes(watch, function(data) {
		if (data == null || data.response == null || data.response.quotes == null) {
			console.log("oops, our api call returned nil");
			return;
		}

		for(var i=0; i<data.response.quotes.instrumentquote.length;i++) {
			instrument = data.response.quotes.instrumentquote[i]
			quote = instrument.quote
			ticker = instrument.instrument.sym;
			trade(ticker, quote);
		}

	});
}

main();
setInterval(main, 120 * 1000);