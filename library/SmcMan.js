// ------------------------------------------- -
// ----- SMCMAN - the guts of the bot. ---- -
// ----------------------------------------- -

module.exports = function(bot, mongoose, db, constants, privates) {
	
	// Include the filesystem module.
	this.fs = require('fs');
	// And we want a synchronous exec.
	this.execSync = require("exec-sync");
	// We'll want the request module, so we can fetch from a pastebin
	this.request = require("request");

	// Setup rest, with an instance, and a server instance.
	var restify = require('restify');
	var RestServer = require('./restServer.js');
	var server = restify.createServer();
	server.use(restify.bodyParser());

	// Ready up our socket server
	var SocketServer = require('./socketServer.js');

	// Set our properties from the arguments upon instantiation.
	this.bot = bot;
	this.constants = constants;
	this.privates = privates;
	this.mongoose = mongoose;
	this.db = db;
	this.rest = new RestServer(server,this,this.bot,this.chat,this.mongoose,this.db,this.constants,this.privates);
	this.socketserver = new SocketServer(server,this,this.bot,this.chat,this.mongoose,this.db,this.constants,this.privates);


	// -- We have a nested schema here.
	// -- ...Consider refactoring / moving this out of here.

	// We'll create our admin schema so we only do it once.
	// Setup our schemas.
	var adminSchema = this.mongoose.Schema({
		nick: String,
		is_dev: Boolean,
	}, { collection: 'admins' });
	
	// Compile it to a model.
	var Admin = this.mongoose.model('Admin', adminSchema);
	
	// Here's a dispatcher for notices. We're using it for a nick & a callback.
	this.isRegisteredCallback = null;

	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	// - ------------------------------------------- Dependant modules!! 
	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	// The first modules listed use less dependencies, while later modules have mode.
	// ...That's the general idea.
	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

	// We have a "Chat" object which uses mongo to make for a data-driven "chat" from this bot.
	Chat = require("./Chat.js");
	this.chat = new Chat(this.bot,this.mongoose,this.db,this.constants,this.privates);
	
	// This is an object which handles the delivery and storage of "notes" (messages to users for the next time they speak)
	Note = require("./Note.js");
	this.note = new Note(this.bot,this.chat,this.mongoose,this.db,this.constants,this.privates);
	
	// We have an object to describe an SMC itself.
	var SMC = require("./SMC.js");       // The object describing an SMC itself.
	this.smc = new SMC(this,this.bot,this.chat,this.mongoose,this.db,this.socketserver,this.constants,this.privates);

	// Our upload module describes an upload / file we host.
	var Upload = require("./Upload.js");
	this.upload = new Upload(this,this.bot,this.chat,this.mongoose,this.db,this.constants,this.privates);

	// Our labels for uploads.
	var Label = require("./Label.js");
	this.label = new Label(this,this.bot,this.chat,this.mongoose,this.db,this.constants,this.privates);

	// Our User module
	var User = require("./User.js");
	this.user = new User(this,this.bot,this.chat,this.mongoose,this.db,this.constants,this.privates);

	// Toy commands
	var Toys = require("./TOYS.js");
	var toys = new Toys(this,this.bot,this.chat,this.mongoose,this.db,this.constants,this.privates);

	//General Purpose commands
	var General = require("./General.js");
	var general = new General(this,this.bot,this.chat,this.mongoose,this.db,this.constants,this.privates);
	
	// --------------------------------------------- end Dependant modules!! 
	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	
	// Start a REST server.
	if (privates.REST_API_ENABLED) {
		this.rest.serverStart();
	}

	// --------------------------------------------------------- Handle command.
	this.commandHandler = function(text,from) {
		
		// Ok, so, this is where we'll fire off the note handler (which checks to see if there's a "note" for someone.
		this.note.handler(from);

		// Now let's see if someone dinged us, we'll respond as a clever bot if that is the case.
		namedetect = new RegExp("^" + privates.IRC_BOTNAME,'i');
		if (namedetect.test(text)) {

			// !bang
			// Now strip out the bot's name. So we get the raw text.
			namestrip = new RegExp("^" + privates.IRC_BOTNAME + "\\W+(.+)$",'i');
			strippedtext = text.replace(namestrip,'$1');

			// !cleverbotremoved

		} else {
			
			// Then we move onto literal commands.
			
			command = this.parseCommand(text,from);
			if (command !== false) {
				console.log(command);
				switch(command.command) {
				
					case "":
						// This happens when someone just speaks a "!" only in a single line, which happens on IRC more than one might think!
						break;

					case "help":
						// Ask for some help.
						this.chat.say("help",[]);
						break;
						
					// ---------------------------------------------------------
					// -- SMC commands.
					// ---------------------------------------------------------
					
					case "smc": 		this.smc.startSMC(command,from); break;
					
					case "in":
					case "join":
					case "imin":        this.smc.joinSMC(from);  		break;
					
					case "cancel":
					case "admincancel": this.smc.cancelSMC(from); 		break;

					case "out":
					case "imout":
					case "forfeit": 	this.smc.forfeitSMC(from); 		break;
						break;

					case "trace": 		this.smc.traceIt(from);			break;

					// ---------------------------------------------------------
					// Toy commands
					// ---------------------------------------------------------
					case "cointoss":
					case "flipcoin":	toys.cointoss(from);  break;
						break;
						
					case "roll":
					case "rolldice":	toys.rolldice(from,command); break;
						break;
					
					//See Toys.js to see why this is like this
					case "beer":
					case "give":
					case "fart":
					case "breakwind":
					case "hug":
					case "huggles":
					case "smokeup":
					case "throw":
					case "insult":	toys.funcommands(command); break;
					break;
					
					case "seen":
					case "lastseen": toys.lastseen(command, from); break;
					break;
					
					
					// ---------------------------------------------------------
					// -- General Purpose Commands
					// ---------------------------------------------------------
					
					// Same with some of the Toy commands, use one code block
					// and just tailor the block in case of each identifier
					case "googleurl":
					case "google": general.googlesearch(command, from); break;
					break;
					
					// ---------------------------------------------------------
					// -- Uploads!
					// ---------------------------------------------------------
					
					case "upload": 	
						// And we'll create a new upload
						this.upload.newUpload(from);
						break;

					case "files": 	
						// And we'll create a new upload
						this.upload.filesFor(command, from);
						break;

					case "totalfiles": 	
						// And we'll create a new upload
						this.upload.chatTotalFiles(command, from);
						break;

					// ---------------------------------------------------------
					// -- User commands.
					// ---------------------------------------------------------

					case "register":
					case "password":
					case "identify":	this.user.identify(from);  break;

					// ---------------------------------------------------------
					// -- Note command(s)
					// ---------------------------------------------------------
					
					case "note":
						// Leave a note for someone to read the next time they speak.
						this.note.leaveAMessage(from,command.args);
						break;
						
					default:
						// Otherwise, we don't know what the heck.
						this.chat.say("command_unknown",[from,command.command]);
						break;
				
				}

			}

		}
		
	};

	this.isAdmin = function(in_nick,callback) {

		// Ok, first we're going to look for them in mongo.
		Admin.count({ nick: in_nick }, function (err, count) {
			if (count) {

				// They're listed as an admin.
				// But, are they registered?
				this.isRegistered(in_nick,function(registered_status){
					// Call it back with the registered status.
					callback(registered_status);
				});

			} else {
				// They're not an admin. We just return false to the callback.
				callback(false);
			}

		}.bind(this));

		// If they're in mongo, we'll check if they're registered.


	}

	this.isRegistered = function(nick,callback) {

		// So first we check and see if they're registered. Which we have to handle via a dispatcher.
		// We have two disparate events, which is kind of tricky.
		this.isRegisteredCallback = function(intext) {

			// Go and break up the intext by spaces, and the third element is the ACC status.
			// A status of "3" means logged in.
			// http://stackoverflow.com/questions/1682920/determine-if-a-user-is-idented-on-irc
			var parts = intext.split(" ");
			var acc_status = parseInt(parts[2]);

			var is_registered = false;
			if (acc_status == 3) {
				is_registered = true;
			}

			// Ok, we'll get this after we send and ACC to nickserv.
			callback(is_registered);

		}; 

		// Next, we send a ACC to nickserv, which tells us if they're registered.
		this.bot.say("nickserv", "acc " + nick);


	}

	this.noticeHandler = function(text,from) {

		// So we got a notice.
		switch(from) {

			case "NickServ":
				console.log("!trace -- NOTICE NICKSERV: " + from + " / text: " + text);
				// Check if it's a registration request.
				if (text.match(/^.+\sACC/)) {
					// That's a registration request.
					if (this.isRegisteredCallback) {
						this.isRegisteredCallback(text);
					}
				} else {
					// Other things you'd do here.
				}
				break;

			default:
				console.log("!trace -- NOTICE from: " + from + " / text: " + text);
				break;

		}

	}
   
	// --------------------------------------------------------- Parse a command.
	this.parseCommand = function(text,from) {
		
		// Trim down the text, first.
		var text = text.trim();

		var cc = privates.COMMAND_CHARACTER; // cc = command character.

		// console.log("!trace - Command character: " + cc);

		var re_matchfirst =  new RegExp('^' + cc);
		var re_matchformat = new RegExp('^' + cc + '\\w+\\s.+$');
		var re_getcommand =  new RegExp('^' + cc + '(.+?)\\s.+$');
		var re_getargs = 	 new RegExp('^' + cc + '.+?\\s(.+)$');
		var re_getbareword = new RegExp('^' + cc + '(.+)?');

		/*
			console.log("!trace re_matchfirst",re_matchfirst);
			console.log("!trace re_matchformat",re_matchformat);
			console.log("!trace re_getcommand",re_getcommand);
			console.log("!trace re_getargs",re_getargs);
			console.log("!trace re_getbareword",re_getbareword);
		*/

		
		if (re_matchfirst.test(text)) {
			// Ok this is a command. 
			// Let's see if it has arguments.
			if (re_matchformat.test(text)) {
				// It has arguments. Let's get the parts.
				command = text.replace(re_getcommand,'$1');
				args = text.replace(re_getargs,'$1');
			} else {
				// It's a bareword command. Just take the bareword (and leave args empty)
				command = text.replace(re_getbareword,'$1');
				args = "";
			}
			
			var arglist = args.match(/(?:[^\s"]+|"[^"]*")+/g) ;
			// cycle through all the args.

			// Log my parts for debugging (temporarily)
			if (this.privates.IRC_DEBUG) {
				console.log("raw",text);
				console.log("command",command);
				console.log("args",args);
			}
			
			return {
				command: command,
				args: args,
				arglist: arglist
			};
			
			
		} else {
			// This is not a command.
			return false;
		}
		
	};
	
	// ---------------------------------------------------------- Say something to the room.
	this.say = function(message) {
		
		this.bot.say(this.privates.IRC_CHANNEL, message);
		
	};
	
	// --------------- utility functions

	// ------------- create a (almost for surely) unique hash -- based on freenode nick (could be any string,though)

	var moment = require('moment');

	var md5 = require('MD5');
	// And we salt it.
	var salt = "d000nTRiN<|ket";

	this.createHash = function(from) {

		var unixtime = moment().format("X");
		var txt = from + unixtime.toString() +  (Math.floor(Math.random() * (2500 - 1 + 1)) + 1).toString() + salt;

		var hash = md5(txt);

		console.log("!trace hash text: ",txt);
		console.log("!trace hash out: ",hash);

		return hash;

	}
	

	
	
};
