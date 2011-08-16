var tk = require('./tradeking');
var db = require('./db');
var express = require('express');
var app = express.createServer();
var os = require('os');

process.stdout.on('drain', function(){
	os.freemem();
});

var watch = ['CRZO', 'JOYG', 'DDD', 'PIR', 'ABB', 'VNDA', 'BAC', 'AMD', 'F', 'MGM', 'NVDA', 'SD', 'HTZ'];
var shares= {'CRZO': 60, 'JOYG':24, 'DDD': 100, 'PIR': 200, 'ABB': 50, 'VNDA': 200, 'BAC': 260, 'AMD':320, 'F':180, 'MGM':172, 'NVDA':148, 'SD':266, 'HTZ':184};
var portfolio = {};
var transactions = [];

var sma_size = 20;

var market_open = false;

app.use(express.bodyParser());

app.get('/', function(req, res){
	var profit = 0;
	var html = '<html><head>';
	
	html += '<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.6.2/jquery.min.js" type="text/javascript"></script>';
	html += '<script src="/trade.js" type="text/javascript"></script></head><body><table>';
	
	for(var i=0; i<watch.length;i++) {
		data = portfolio[watch[i]];
		profit += data.profit;
		html += '<tr id="'+watch[i]+'"><td><a href="https://www.etrade.wallst.com/v1/stocks/charts/charts.asp?symbol='+watch[i]+'">'+watch[i]+'</a></td><td>profit:</td><td>'+data.profit+'</td>'
		html += '<td>bought at:</td><td>'+data.bought_at+'</td><td>current:</td><td>'+data.current_price+'</td>';
		html += '<td><button onclick="sell(\''+watch[i]+'\')">Sell</button></td></tr>';
	}

	html += '</table>'

	html += '<br/><br/>profit: '+profit+'<br/>';

	html += '<br/>transactions: <br/>';

	for(var i=0; i<transactions.length-1;i++){
		html += transactions[i]+'<br/>';
	}

	html += '<br/>Total commision: '+transactions.length*5;

	html += '</body></html>';

	res.send(html);
});

app.post('/sell', function(req, res) {
	var data = portfolio[req.body.ticker];

	if(data.bought_at != 0) {
		sellStock(data);
	}
});

app.get('/*.*', function(req, res){res.sendfile("./static"+req.url);});

app.listen(3011);

function marketClosed() {
	var time = new Date();

	if(time.getHours() >= 13) 
		return true;
	else
		return false;
}

function sellTime() {
	var time = new Date();
	
	if(time.getHours() >= 12 && time.getMinutes() >= 30) 
		return true;
	else
		return false;
}

function sellStock(data) {
	var profit = (data.current_price * data.shares) - (data.bought_at * data.shares);
	data.profit += profit;

	transactions.push('selling '+data.shares+' of '+data.sym+' at '+data.current_price+' with '+data.profit+' profit');
	db.addTransaction(ticker, "SELL", data.bought_at, data.current_price, data.shares);

	console.log(ticker+" - selling at: "+data.current_price);
	console.log(ticker+" - profit: "+profit);
	console.log(ticker+" - total profit: "+data.profit);

	data.bought_at = 0;
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
		                     'current_price':0,
												 'shares':shares[ticker],
												 'sym':ticker};
	}

	data = portfolio[ticker];

	current_price = parseFloat(quote.lastprice);

	db.addPrice(ticker, current_price);

	data.current_price = current_price;
	data.prices.push(current_price);
	
	console.log(ticker+' price: '+current_price);
		
	//figure out SMA
	if(data.prices.length >= sma_size) {
		var sum = 0;

		for(var i = data.prices.length - sma_size; i < data.prices.length-1; i++) {
			sum += data.prices[i];
		}

		data.current_sma = sum / sma_size;
		data.sma.push(data.current_sma);

		console.log(ticker+ " - avg: "+data.current_sma);
	}

	//calculate slope
	if(data.sma.length >= 5) {
		slope = (data.sma[data.sma.length-1] - data.sma[data.sma.length-5]) / 5;
		console.log(ticker+" - slope: "+slope);
		data.slopes.push(slope);
	}

	var buy = false;

	if(data.slopes.length >= 5) {
		sum = 0;

		for(var i = data.slopes.length-5; i<data.slopes.length-1; i++) {
			//console.log('adding slope: '+data.slopes[i]);
			sum += data.slopes[i];	
		}

		console.log(ticker+" - buy indicator: "+sum);

		if(sum > 0) {
			buy = true;
		}
	}

	//buy 
	if(buy && data.bought_at == 0 && !sellTime()) {
		console.log(ticker+ " - buying at: "+current_price);
		transactions.push('buying '+data.shares+' of '+data.sym+' at '+data.current_price);
		data.bought_at = current_price;
		db.addTransaction(ticker, "BUY", data.bought_at, null, data.shares);
	}

	//sell
	if((data.bought_at !=0 && current_price > data.bought_at) && (!buy || sellTime())) {
		sellStock(data);
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

function getQuotes() {
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

function main() {
	var date = new Date();
	
	//dont trade mid minute
	if(date.getSeconds() == 0) {
		if(market_open) {
			getQuotes();

			if(marketClosed())
				market_open = false;
		} else {
			tk.marketStatus(function(data) {
				var s = data.response.status.current;

				if(s == "open") {
					market_open = true;
					getQuotes();
				}
			});
		}
	}
}

main();
setInterval(main, 1000);