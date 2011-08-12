function sell(ticker) {
	$.post("/sell", {'ticker':ticker}, function(data) {

	});
}

$(function() {
	$('tr').each(function() {
		var bought_h = $(this).find("td:eq(4)");
		var current_h = $(this).find("td:eq(6)");
		var bought = parseFloat(bought_h.html());
		var current = parseFloat(current_h.html());

		if(bought != 0) {
			if(bought > current) {
				bought_h.css("background-color","red");
			} else {
				bought_h.css("background-color","green");
			}
		}

	});
});