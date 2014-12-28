module.exports = function(smcman, bot, chat, mongoose, db, constants, privates) {

	this.cointoss = function(from) {
		var coin_string; //we will set this up in the conditional
		var coin = Math.floor(Math.random()*2) //Alternate between zero and one
		if(coin) { coin_string  = "heads"; } else { coin_string = "tails"; } //if coin is set to true or false, set the coin_string as said
		chat.say("cointoss", [from, coin_string]);
	}
	
	this.rolldice = function(command, from) { //Will come back to this one
		
	}
	
	// Considering most of the toy commands acted similar to each other as in
	// they accept a certain number of arg's for example:
	// !smokeup ddwagnz bong - * botname smokes ddwagnz up with a bong
	// !fart ddwagnz- * botname farts in ddwagnz's general direction
	// !hug * botname embraces everyone!
	// instead of them getting their own command block, we can just do some funky stuff here in one command block
	this.funcommands = function(command) {
	
		var givencommand = command.command;
		
		// If a command.command has an alternate trigger (see SmcMan.js > Toy commands) better
		// set it here as well so we get the right identifier, otherwise you are going to have a bad day
		if(command.command == 'breakwind') { givencommand = 'fart'; }
		if(command.command == 'huggles') { givencommand = 'hug'; }
		if(command.command == 'give') { givencommand = 'beer'; }
		
		// At this stage the max number of arg's is two, so setting this up hard coded to only
		// accept a max of two is fine
		if(!command.arglist) {
			//No arg's given
			chat.action(givencommand, []);
		} else if(command.arglist.length == 1) {
			//One arg given
			chat.action(givencommand, [command.arglist[0]]);
		} else {
			//Two arg's given
			chat.action(givencommand, [command.arglist[0],command.arglist[1]]);
		}
		
		
	}
	
	this.population = function() {
	
	
	}
	
	this.lastseen = function(command, from) {

	}
	
};