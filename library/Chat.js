module.exports = function(bot, mongoose, db, constants, privates) {

	// the bot (so we can actually, y'know, CHAT. Which is what this module does.)
	this.bot = bot;
	// Our constants.
	this.privates = privates;
	this.constants = constants;
	this.mongoose = mongoose;
	
	
    /*
       ------------------ EXAMPLE ENTRY.
       foo = {
    	identifier: "crank_success",
    	fields: 1,
    	text: "No prob %1, I went ahead and originated a call for you to %2"
    	};
     */
    
    // Go ahead and define our ORM schema etc.

	this.chatSchema = this.mongoose.Schema({
		identifier: String,
		fields: Number,
		text: String
	}, { collection: 'chat' });
	this.Chat = this.mongoose.model('Chat', this.chatSchema);
	
    // Now, let's create a method to "say" something to a channel.
    this.say = function(identifier,parameters,chatmethod,private_message) {
		if (typeof chatmethod == 'undefined') { chatmethod = false; }
    	if (typeof private_message == 'undefined') { private_message = false; }
		
    	// Ok, so let's count the parameters.
    	//console.log(parameters.length);
    	
    	// Now that we know it's length, let's get an appropriate item from mongo.
		this.Chat.find({ identifier: identifier, fields: parameters.length},function (err, chat) {
			if (err) {
				console.log('that didnt work',err);
			} else {
			
				// Ok, how many results do we have?
				if (chat.length) {
				
					// Pick a random line out of that.
					line = chat[this.randomId(chat.length)];
					
					// Now go and replace it's symbols with our parameters..
					var output = line.text;
					var plus = 1;
					re_matchzero = /\%0/g;
					if (output.match(re_matchzero)) {
						plus = 0;
					}
					for (var i=0; i<parameters.length; i++) {
						// console.log("the eye",i);
						symbolid = i+plus;
						re = new RegExp("%" + symbolid);
						// console.log(re);
						// console.log(parameters[i]);
						output = output.replace(re,parameters[i]);
					}
				
				// Instead of using a if and else statement we can just use switching!
				// this makes adding in new types of chat messaging easier and cleaner
					switch(chatmethod) {
						case "whisper": this.nickSay(private_message,output); break;
						break;
						
						case "action": this.ircAction(output); break;
						break;
						
						case "whois": this.ircWhois(output); break;
						break;
						
						//By default it will be outputted to the channel
						default: 
						this.ircSay(output);
						break;
					}
					
				} else {
					
					this.ircSay("That's an error. I'm saying a generic thing, because I can't find what I'm supposed to specifically say. I'll slap myself about with a trout. [identifier: " 
						+ identifier + " / length: " + parameters.length + "]");
					
				}
				
			}
		}.bind(this));
    	
    };

    // Say something to a nick, as a private message.
    this.whisper = function(nick,identifier,parameters) {

    	// Tell say it's to a nick.
    	this.say(identifier, parameters, 'whisper', nick);

    }
	
	//Say something that is an action (the good old, /me does things)
	this.action = function(identifier,parameters) {
	
		this.say(identifier, parameters, 'action');
	}
	
	//IRC whois
	this.whois = function(identifier,parameters) {
		this.say(identifier, parameters, 'whois');
	}
    
    // Give me a random number based on the number elements in an array.
    
    this.randomId = function(max) {
    	
    	// Account for the fact it's zero based.
    	max--;
    	// Our minimum is always zero (first array element)
    	min = 0;
    	// Now just go and get a random number in that range.
    	return Math.floor(Math.random() * (max - min + 1)) + min;
    	
    };

    this.nickSay = function(nick,message) {
    	
    	if (this.privates.IRC_ENABLED) {
    		this.bot.say(nick, message);
    	} else {
    		console.log('bot would have said:',message);
    	}
		
    };
	
	this.ircAction = function(message) {
		//This really should just be a conditional in this.ircSay() within this.say() 
		//but for now, we will just use this
		if (this.privates.IRC_ENABLED) {
			this.bot.action(this.privates.IRC_CHANNEL, message);
		} else {
			console.log('bot would have said:', message);
		}
	};
    
	this.ircWhois = function(message) {
		//fetch whois data
		if(this.privates.IRC_ENABLED) {
		this.bot.whois(message, callback);
		} else { 
			console.log('bot would have outputte:', message); 
		} 
	}
	
    this.ircSay = function(message) {
    	if (this.privates.IRC_ENABLED) {
			this.bot.say(this.privates.IRC_CHANNEL, message);
    	} else {
    		console.log('bot would have said:',message);
    	}
	
		
    };
	
};
