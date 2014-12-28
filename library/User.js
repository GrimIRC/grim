module.exports = function(smcman, bot, chat, mongoose, db, constants, privates) {

	// We use this for password storage and authentication.
	// reference: http://devsmash.com/blog/password-authentication-with-mongoose-and-bcrypt
	var bcrypt = require('bcrypt');
	var SALT_WORK_FACTOR = 10;

	// We use moment to figure out when their session expires.
	var moment = require('moment');
	var SESSION_EXPIRES_DAYS = 7;

	// Setup a schema.
	var userSchema = mongoose.Schema({

		nick: String,			// Who's this person?
		secret: String,			// The secret key
		indate: Date,			// Created @
		timezone: String,		// What's their timezone pref?
		session_id: String,		// After authenticating, we give a (quasi-public) session ID.
		session_expires: Date,	// When the session expires.

	}, { collection: 'users' });

	// sample virtual.
	/*
	userSchema.virtual('upload_url')
		.get(function () {
			return privates.URL_SMCSITE + "#/upload?key=" + this.secret;
		});
	*/

	// Compile it to a model.
	var User = mongoose.model('User', userSchema);

	// This is the !identify command.
	// It serves the purpose of:
	// 1. new user registration.
	// 2. password reset.
	this.identify = function(from) {

		// We can only do this for registered users.
		smcman.isRegistered(from,function(status){

			if (status) {

				// Ok that's good.
				this.exists(from,function(exists){

					if (exists) {

						// Update them.
						this.updateSecret(from,function(secret){

							chat.whisper(from,"identify_updated",[from,secret]);

						}.bind(this));

					} else {
						// Create them.
						this.createUser(from,function(secret){

							chat.whisper(from,"identify_created",[from,secret]);

						}.bind(this));

					}

				}.bind(this));

			} else {

				chat.say("identify_notregistered",[from]);

			}

		}.bind(this));

	}

	this.createPasswordHash = function(password,callback) {

		// generate a salt
		bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
			if (err) throw "Duuude, gen salt failed.";

			// hash the password along with our new salt
			bcrypt.hash(password, salt, function(err, hash) {
				if (err) throw "Duuude, bcrypt hash busted.";

				// override the cleartext password with the hashed one
				callback(hash);

			});

		});

	}

	this.exists = function(nick,callback) {

		User.findOne({nick: nick},function(err,user){

			if (user) {
				callback(true);
			} else {
				callback(false);
			}

		});

	}

	this.searchForUsers = function(re_searchnick,callback) {

		User.find({nick: re_searchnick},function(err,users){

			var nicks = [];
			for (var i = 0; i < users.length; i++) {
				var eachuser = users[i];
				nicks.push(eachuser.nick);
			}

			callback(nicks);

		});		

	}

	this.createUser = function(from,callback) {

		var user = new User();

		var password = smcman.createHash(from);

		// Hash the password.
		this.createPasswordHash(password,function(hash){

			user.nick = from;
			user.secret = hash;
			user.indate = new Date;
			user.save();

			callback(password);

		});

	}

	this.updateSecret = function(from,callback) {

		// Find the user.
		User.findOne({nick: from},function(err,user){

			// Gen a new password.
			var password = smcman.createHash(from);

			// Create a new password.
			this.createPasswordHash(password,function(hash){

				user.secret = hash;
				user.save();

				callback(password);

			});

		}.bind(this));

	}

	this.createSession = function(nick,callback) {

		var sessionid = smcman.createHash(nick);

		User.findOne({nick: nick},function(err,user){

			if (user) {

				// Give a new session id.
				user.session_id = sessionid;

				// Create a time at which the session expires.
				var expires = new moment();
				expires.add('days', SESSION_EXPIRES_DAYS);
				user.session_expires = expires.toDate();

				user.save();

				// And return it.
				callback(sessionid);

			}

		});


	}

	this.validateSession = function(nick,sessionid,callback) {

		// Ok, let's look for a result.
		User.findOne({nick: nick,session_id: sessionid},function(err,user){

			if (user) {
				// Good, that's found.
				console.log("!trace SESSION FOUND.");

				var now = new moment();

				// Check if the session is expired.
				if (now.unix() <= user.session_expires) {
					// looks good!
					callback(true);

				} else {

					// Nope, it's expired.
					callback(false);
				
				}

			} else {
				// Not valid.
				callback(false);
			}

		});

	}


	this.authenticate = function(nick,password,callback) {

		// Locate the user.
		User.findOne({nick: nick},function(err,user){

			if (user) {

				// Compare it using bcrypt.
				bcrypt.compare(password, user.secret, function(err, isMatch) {
					if (err) {
						console.log("!ERROR: bcrypt compare error: ",err);
						callback(err);
					}

					if (isMatch) {

						// Give them a session id.
						// This way we don't store their password in the cookie.
						// It will get reset with each authentication.

						this.createSession(nick,function(sessionid){
							callback(sessionid);
						});

					} else {
						console.log("!Warning: Password auth failed for %s with password: %s",nick,password);
						// Nope that didn't work.
						callback(false);
					}

				}.bind(this));

			} else {

				callback(false);

			}

		}.bind(this));


	}

}