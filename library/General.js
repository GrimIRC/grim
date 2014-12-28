module.exports = function(smcman, bot, chat, mongoose, db, constants, privates) {
	
	this.googlesearch = function(command,from) {
		var google = require('google');
		
		// Max Number of results we will scrap from, this could be higher,
		// but we should only need 5 results and choose a random one to display
		google.resultsPerPage = 5;
		
		// Also to note, we could dynamically set this based on google.resultsPerPage
		// but for #smc, you wont need any higher
		var i = Math.floor(Math.random()*4);
			
		var url = 'http://www.google.com/search?hl=en&q='+command.args+'&ie=UTF-8&oe=UTF-8';
		//console.log("googleurl: ", url);
		if(command.command == "google") {
			google(command.args, function(err, next, links) {
		// NOTE: Some results -will- come up with a null/invalid link and so we count that as
		// no results to show, this isn't a flaw in our code, so much as the module is only a 
		// scrapper, not a api (api's are strongly not recommended due to auth and so many
		// queries per day or month (stuff can be open for abuse))
				if(!command.args) {
					chat.say("google_query_empty", []);
				} else {
					if(!links[i].link) {
						chat.say("google_no_valid_link", [command.args, url]);
					} else {
						chat.say("google", [command.args, links[i].link]);
					}
				}
			});
		} else if(command.command == "googleurl") {
			chat.say("googleurl", [command.args, url]);
		}
	}
};