// You run this file to run the bot.
// How about some....!
// ------------------------------------------------ -
// ----------------- Reference Docs -------------- -
// ---------------------------------------------- -
// irc api docs: http://tinyurl.com/nodeircdocs


// -- Requires
var irc = require("irc");									// IRC Module (npm installed)
var constants = require("./includes/config_general.js");	// Constants module (w/ general configs)
var mongoose = require('mongoose');							// Require mongoose.
sprintf = require('sprintf-js').sprintf;					// Create a global for sprintf.


// Conditionally include the private constants, with a reminder if you don't copy it to your own private file. (see README.txt)
try {
	var privates = require("./includes/config_private_mine.js");	// Constants module (w/ "secret" configs, e.g. IRC & authentication info.)
} catch (e) {
	// Ok, there's no "my privates" so, we want to warn them, and then just include the template.
	console.log("NOTICE: Oops! Looks like you should copy the file ./includes/config_private.js to ./includes/config_private_mine.js -- so it's private for you.");
	console.log("We'll include the template file for you, but, to avoid committing your private info to the repo, you should copy it (see README.md)");
	var privates = require("./includes/config_private.js");
}

var SmcMan = require("./library/SmcMan.js"); // The SmcMan object, the meat of our dealings.

// -- Connect to mongo.

mongoose.connect(privates.MONGO_CONNECT_STRING);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MONGO connection error:'));
db.once('open', function callback () {
	// We're connected to mongo, now.
	console.log("Mongo connection successful.");
});

// ----------------------------- Create the irc bot object.
var bot = new irc.Client(privates.IRC_SERVER, privates.IRC_BOTNAME, {
    userName: privates.IRC_BOTNAME,
    realName: privates.IRC_REALNAME,
    port: 7000,
    debug: privates.IRC_DEBUG,
    showErrors: true,
    autoRejoin: true,
    autoConnect: false,
    channels: [privates.IRC_CHANNEL],
    secure: true,
    selfSigned: true,
    certExpired: true,
    floodProtection: false,
    floodProtectionDelay: 1000,
    stripColors: true,
    channelPrefixes: "&#",
    messageSplit: 512
});


// Now that we've got a bot, we can pass this to whistler.
var smcman = new SmcMan(bot,mongoose,db,constants,privates);

// Connect to IRC conditionally (mostly used for testing, easier to test a lot of functions without worrying about connecting/disconnecting constantly)
if (privates.IRC_ENABLED) {
	bot.connect(function() {
		// Ok we're connected.
		console.log("Cool, we connected");
		// Identify if need be.
		if (privates.IRC_DO_IDENTIFY) {
			bot.say("nickserv", "identify " + privates.IRC_IDENTPASS);
		}
	});
} else {
	console.log("WARNING: IRC disabled (usually this is for debugging)");
}

bot.addListener("message", function(from, to, text, message) {
	
	/* console.log("message",message);
	console.log("text",text);
	console.log("from",from);
	console.log("to",to); */
	
	// Let's have smcman handle this command.
	smcman.commandHandler(text,from);
	
});

bot.addListener("notice", function(from, to, text, message) {
	
	/* console.log("message",message);
	console.log("text",text);
	console.log("from",from);
	console.log("to",to); */
	
	// Let's have smcman handle this command.
	smcman.noticeHandler(text,from);
	
});


