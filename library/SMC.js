module.exports = function(smcman, bot, chat, mongoose, db, socketserver, constants, privates) {

	// Our static phases.
	var PHASE_INITIALIZED = 1;
	var PHASE_RUNNING = 2;
	var PHASE_UPLOAD = 3;
	var PHASE_RENDER = 4;

	// Our static properties
	var MAX_SMCERS = 10;

	// How long do we wait before render?
	var RENDER_MINUTES = 1;

	// A moment instance.
	var moment = require('moment');

	// And a schedule instance.
	var schedule = require('node-schedule');

	// And our scheduled job (just one at a time)
	// We set it null, but, we'll use it later.
	this.job = null;

	var BAScraper = require("./BAScraper.js");
	bascraper = new BAScraper(this,this.bot,this.chat,this.mongoose,this.db,this.constants,this.privates);

	// Setup a schema.
	var smcSchema = mongoose.Schema({
		phase: Number,					// What phase is the SMC in? Initialized, running, uploading, etc.
		topic: String,					// What's the topic?
		originator: String,				// Who started it?
		startsat: Date,					// When does it start?
		endsat: Date,					// Time the SMC ends.
		uploadby: Date,					// Time the render is done by.
		duration: Number,				// How long does it run?
		smcers: [{						// Who's in?
			nick: String,				// ... their name.
			uploaded: Boolean,			// ... did they upload?
			url: String,				// ... what URL did they upload to?
			votes: Number,				// Number of votes 
			voters: [],					// Who voted.
		}],
	
	}, { collection: 'smcs' });

	// A comma delimited list of smcers.
	smcSchema.virtual('nicklist')
		.get(function () {
			var nicklist = "";
			for (var i = 0; i < this.smcers.length; i++) {
				nicklist += this.smcers[i].nick + ",";
			}
			nicklist.replace(/,$/,"");
			return nicklist;
		});

	// A plain list of SMCers
	smcSchema.virtual('vanilla_nick_list')
		.get(function () {
			var plainlist = [];
			for (var i = 0; i < this.smcers.length; i++) {
				plainlist.push(this.smcers[i].nick);
			}
			return plainlist;
		});

	// Compile it to a model.
	var SMC = mongoose.model('SMC', smcSchema);

	// Now we want an instance of it.
	var smc = new SMC;

	// We queue up a little list of guys to send an !upload message to during an upload.
	this.sendlist = [];

	// A mini getter for the current SMC doc.

	this.getSMC = function() {
		return smc;
	}

	// -------------------------------------------------------
	// -- A Schedule for the phases of an SMC.
	// -- ... this here's the handler.
	// --
	// -- We call the "schedule" object and schedule this job.
	// -- We then increment the "phase"

	this.smcScheduler = function() {

		switch (smc.phase) {

			// --------------------------------- START THE SMC.

			// Our first scheduled item when we're initialized, is to begin the SMC!
			case PHASE_INITIALIZED:

				// Do we have enough participants to start?
				if (smc.smcers.length > 1) {

					// That's good, we can start!
					chat.say("smc_starting_now",[smc.nicklist]);

					// Next we want to schedule a half-way warning.
					var wholeduration = smc.duration;					// In minutes.
					var halfduration = Math.floor((smc.duration*60)/2);	// In seconds.

					// So let's figure out when that is.
					var halftime = new moment(smc.startsat);
					halftime = halftime.add('seconds',halfduration);

					// Also set where it ends.
					var wholetime = new moment(smc.startsat);
					wholetime = wholetime.add('minutes',wholeduration);
					smc.endsat = wholetime.toDate();

					console.log("!trace SMC facets: ",smc);

					// Increment the phase
					smc.phase += 1;

					// Now schedule half time.
					this.job = schedule.scheduleJob(halftime.toDate(), this.smcScheduler);
					
				} else {
					// There's not enough people to start.
					chat.say("smc_not_enough",[smc.originator]);
					this.tearDownSMC();
				}
				break;

			// --------------------------------- HALF WAY WARNING

			case PHASE_RUNNING:
				// Increment the phase
				smc.phase += 1;

				// Now schedule the upload.
				this.job = schedule.scheduleJob(smc.endsat, this.smcScheduler);
				
				// Give the reminder.
				chat.say("smc_halftime",[smc.nicklist]);
				console.log("!trace IT'S HALF TIME <<<<<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>>>>>>>>");

				break;

			// --------------------------------- UPLOAD - Send along the links.

			case PHASE_UPLOAD:
				// Alright, we give them the upload links.
				// However, we want to feather this out. 
				// Let's just do it once a second.
				var uploadtime = new moment();
				
				for (var dudeidx = 0; dudeidx < smc.smcers.length; dudeidx++) {

					var dude = smc.smcers[dudeidx];
					
					// console.log("!trace dude name: ",dude.nick);

					// Create a new upload for each dude.
					// Push 'em on the stack for our queue.
					this.sendlist.push(dude.nick);

					// -- Sends an upload link to each smcer, popping from a queue.
					schedule.scheduleJob(uploadtime.toDate(),function() {

						var eachdude = this.sendlist.pop();
						smcman.upload.newUpload(eachdude,true);

					}.bind(this));

					// Increment the schedule time by a second.
					uploadtime.add('seconds',1);

					// smcman.upload.newUpload(dude.nick,true);
				}
				
				// Increment the phase
				smc.phase += 1;

				// And finally schedule the last possible job, the render.
				var rendertime = new moment(); 
				rendertime.add('minutes',RENDER_MINUTES);

				// Add this to the document, too.
				smc.uploadby = rendertime.toDate();

				this.job = schedule.scheduleJob(rendertime.toDate(), this.smcScheduler);

				// Ok, let em know it's over.

				chat.say("smc_timesup",[smc.nicklist]);
				
				console.log("!trace SMC IS OVER, TIME TO UPLOAD <<<<<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>>>>>>>>");
				break;

			// --------------------------------- RENDER FINISHED - The end of the line.

			case PHASE_RENDER:

				// Ok, we want to cancel anyone who hasn't uploaded.
				var keepers = [];

				for (var dudeidx = 0; dudeidx < smc.smcers.length; dudeidx++) {
					var dude = smc.smcers[dudeidx];

					if (dude.uploaded) {
						keepers.push(dude);
					}

				}

				// Set to only the keepers.
				smc.smcers = keepers;

				if (smc.smcers.length > 1) {
					// Alright, that's complete!
					console.log("NOTICE: SMC came to hard stop due to render time limit, but, it's being completed.");
					this.smcComplete();
				} else {
					console.log("NOTICE: SMC cancelled as there weren't enough uploaders.");
					chat.say("smc_not_enoughuploaders",[smc.nicklist]);
					this.tearDownSMC();
				}


				console.log("!trace SMC IS DONE WITH RENDERING, HARD FINISH! <<<<<<<<<>>>>>>>>>>>>>>>>>>>>>>>>>");
				break;
		}

		// With each scheduled item... go and push it to the clients via websocket.
		socketserver.smcUpdate();

	}.bind(this);

	// -- Set that an upload is complete from a user, and also the URL where that upload is, too.

	this.setUserUploaded = function(nick,url) {

		for (var dudeidx = 0; dudeidx < smc.smcers.length; dudeidx++) {

			if (smc.smcers[dudeidx].nick == nick) {
				// We found 'em.
				smc.smcers[dudeidx].uploaded = true;
				smc.smcers[dudeidx].url = url;
				return;
			}

		}

		console.log("ERROR: Tried to set uploaded true for nick %s but it wasn't found in the smcers array of hashes.",nick);

	}

	// -- This happens via the Upload object when a user successfully uploads a file marked as being from an SMC.

	this.userUploadEvent = function(nick,url) {

		if (smc.phase) {
			// Ok, that's a legit upload during an SMC.
			// Mark this user as having uploaded.
			this.setUserUploaded(nick,url);

			// Check and see if everyone has uploaded.
			var all_uploaded = true;
			for (var dudeidx = 0; dudeidx < smc.smcers.length; dudeidx++) {
				// If anyone hasn't uploaded, then all uploaded is false.
				if (!smc.smcers[dudeidx].uploaded) {
					all_uploaded = false;
				}
			}

			if (all_uploaded) {
				// Awesome, the SMC is virtually done because everyone uploaded in time.
				this.smcComplete();
			}

			// Update via the socket, letting 'em know about the upload
			socketserver.smcUpdate();

		} else {
			console.log("ERROR: There's a userUploadEvent in the smc module, but, no SMC active?? (could be a late render.)");
		}

	}

	// -------------------------------------------------------
	// -- Finally!!! Complete an SMC, and post it to BA.

	this.smcComplete = function() {

		// Cancel any scheduled job, e.g. hard stop for render deadline.
		this.job.cancel();

		// Compile the message body.
		var body = "";
		for (var dudeidx = 0; dudeidx < smc.smcers.length; dudeidx++) {
			var dude = smc.smcers[0];
			body = body + dude.nick + "\n" + "[img]" + dude.url + "[/img]" + "\n";
		}

		// Compile the message that's used by the vBulletin posting mechanism.
		var message = {
			subject: smc.topic,
			body: body,
			number_options: smc.smcers.length,
			smcers: smc.vanilla_nick_list,
		};

		console.log("!trace COMPILED MESSAGE: ",message);

		// Save that SMC!
		smc.save();

		// And post it!
		this.postSMC(message,function(raw_url){

			console.log("!trace URL AFTER SMC POST COMPLETE: ",raw_url);

		});

		// And we'll tear it down.
		this.tearDownSMC();

	}

	// -------------------------------------------------------
	// -- A handler for posting to BlenderArtists vBulletin.

	this.postSMC = function(message,callback) {

		/*

			// The message input looks like:

			var message = {
				subject: "[SMC] Zany test, please vote!",
				body: "Who is the real robot?",
				number_options: 4,
				smcers: ["doug","smcman","ddwagnz","random"],
			};

		*/

		if (privates.VBULLETIN_POST_ENABLED) {

			console.log("NOTICE: We are definitely posting to BlenderArtists, now.");

			// Login to BA
			bascraper.baLogin(function(){
				// Make a new post.
				bascraper.baNewPost(message,function(html){
					// Finally, add the poll.
					bascraper.postPoll(message,html,function(resulting_url){
						// that's probably complete.
						console.log("SUCCESS! Looks like I posted a new SMC @ ",resulting_url);
						callback(resulting_url);
					});
				}.bind(this));
			}.bind(this));

		} else {

			console.log("WARNING: Posting to BlenderArtists IS DISABLED.");
			callback("http://fake/url/");

		}


	}

	// -- Destroys an SMC in progress, cleans up.

	this.tearDownSMC = function() {

		// We're tearin' 'er down.
		console.log("Tearing down SMC!!! !trace");

		// Clear out our SMC doc.
		smc = new SMC;

		// Cancel any scheduled job.
		if (this.job) {
			this.job.cancel();
		}

		// Push it out to the clients.
		socketserver.smcUpdate();

	}

	// Is this person a particpant?

	this.isParticipant = function(needlenick) {

		for (var i = 0; i < smc.smcers.length; i++) {
			var eachnick = smc.smcers[i].nick
			if (eachnick == needlenick) {
				return true;
			}
		}
		return false;
	}

	// This starts an smc via the '!smc' command.

	this.startSMC = function(command,from) {

		console.log("!trace command: ",command);

		// Check for a properly formatted argument format.
		if (command.args.match(/['"].+['"]\s\d\d\s\d\d/)) {

			// Setup our SMC properties.

			if (!smc.phase) {

				// These are our raw inbound integers for startsat and length.
				var startsat = parseInt(command.arglist[1]);
				var length = parseInt(command.arglist[2]);

				// Now, setup this smc's properties, first the basics.
				smc.phase = PHASE_INITIALIZED;
				smc.originator = from;
				smc.topic = command.arglist[0].replace(/['"]/g,"");
				smc.duration = length;
				smc.smcers.push({nick: from, uploaded: false, url: ""});

				// Now let's get into time. We're going to want to schedule based on these.
				// So let's create a moment.
				var starting_moment = new moment();

				// We'll round to the minute.
				starting_moment.second(0);

				// When the startsat minute is less than now, that means it happens in the next hour.
				if (startsat < starting_moment.minute()) {
					starting_moment.hour(starting_moment.hour()+1);
				}
				starting_moment.minute(startsat);

				// You can get a date back with moment's .toDate() method.
				// So let's chedule it.
				this.job = schedule.scheduleJob(starting_moment.toDate(), this.smcScheduler);

				// Now we can set the smc's startsat property.
				smc.startsat = starting_moment.toDate();

				console.log("!trace the starting_moment: ",starting_moment.format("dddd, MMMM Do YYYY, h:mm:ss a"));

				chat.say("smcstart",[smc.topic,length,sprintf("%0d",startsat)]);
				
				// We'll emit that through the websocket, to let everyone know.
				socketserver.smcUpdate();

			} else {

				if (smc.originator == from) {

					chat.say("smc_alreadystarted_by_owner",[from]);

				} else {

					chat.say("smc_already_in_progress",[]);

				}

			}

		} else {

			chat.say("smc_command_error",[]);

		}

	}


	// Handles a !cancel request (or !admincancel request, which it treats equally)

	this.cancelSMC = function(from) {

		if (smc.phase) {

			if (smc.originator == from) {

				chat.say("smc_cancel",[from]);
				this.tearDownSMC();

			} else {

				// We should check if they're an admin.
				// If they're not, they're not allowed.
				smcman.isAdmin(from,function(admin_status){

					if (admin_status) {
						// Cool an admin can stop this.
						this.tearDownSMC();
						chat.say("smc_admin_cancel",[from]);

					} else {
						// They're not allowed to.
						chat.say("smc_cancel_notallowed",[smc.originator]);
					}

				}.bind(this));

				
			}

		} else {

			chat.say("smc_no_cancel",[from]);

		}
		
	}

	this.smcPage = function(page,limit,extended,callback) {

		// We have extended search paramters in this case.
		var search = {};
		if (extended) {

			// Use a regex to search.
			var re_search = new RegExp(extended.text,'i');

			switch (extended.metric) {
				case "Topic":
					search = {topic: re_search};
					break;
				case "Nick":
					search = {"smcers.nick": re_search};
					break;
			}
		}

		// We're going to want a total count of documents in the collection.
		SMC.count(search,function(err,counted){

			// Ok, let's get some SMCs.
			var result = SMC.find(search).sort({startsat: -1}).skip(limit * (page-1)).limit(limit).exec(function(err,smclist){

				// Return what we've got.
				callback({total: counted, smcs: smclist});

			});

		});

	}

	// Here we can handle the submission of votes.
	this.submitVote = function(id,votefornick,votefromnick,callback) {

		console.log("!trace INTO SUBMIT VOTE: %s / %s",id,votefornick);

		// Ok let's pull up that smc.
		// !bang
		SMC.findOne({_id: id}, function(err,thesmc) { 
			if (!err) {
				
				// Ok, now that looks good, we can go ahead and:
				// remove old vote
				// cycle through all entries.
				for (var i = 0; i < thesmc.smcers.length; i++) {
					var entry = thesmc.smcers[i];
					if (typeof entry.voters != 'undefined') {
						if (entry.voters.indexOf(votefromnick) > -1) {
							thesmc.smcers[i].voters.remove(votefromnick);
							thesmc.smcers[i].votes--;
						}
					}
				}

				// add new vote
				for (var i = 0; i < thesmc.smcers.length; i++) {
					if (thesmc.smcers[i].nick == votefornick) {
						// Great, add this vote.
						thesmc.smcers[i].voters.push(votefromnick);
						if (typeof thesmc.smcers[i].votes) {
							thesmc.smcers[i].votes = 1;
						} else {
							thesmc.smcers[i].votes++;
						}

						break;
					}
				}

				// save the document.
				thesmc.save();

				// Now call it back.
				callback(false);


			} else {
				console.log("ERROR: I couldn't find the smc when I was trying to submit a vote. Dang.");
			}
		});

	}


	// The !join handler.

	this.joinSMC = function(from) {

		if (smc.phase) {
			// Are there too many people?
			if (smc.smcers.length < MAX_SMCERS) {

				// Have they already joined?
				if (!this.isParticipant(from)) {
					// Good, they can join.
					chat.say("smc_join",[from]);
					// Add them to the SMCers.
					smc.smcers.push({nick: from, uploaded: false, url: ""});

					// Update via the socket, so we know there's a new guy in.
					socketserver.smcUpdate();

				} else {
					chat.say("smc_join_alreadyin",[from]);
				}

			} else {
				// Nope, too many people.
				chat.say("smc_join_toomany",[from]);
			}

		} else {
			// Nope, there's no SMC.
			chat.say("smc_join_nosmc",[from]);
		}

	}

	// The !quit handler.

	this.forfeitSMC = function(from) {

		if (smc.phase) {

			if (this.isParticipant(from)) {
				
				// Remove them from the array.
				var newlist = [];
				for (var i = 0; i < smc.smcers.length; i++) {
					var eachnick = smc.smcers[i].nick;
					console.log("!trace eachnic: ",eachnick);
					if (eachnick != from) {
						newlist.push(smc.smcers[i]);
					}
				}
				smc.smcers = newlist;

				// Let 'em know they're leaving
				chat.say("smc_forfeit",[from]);

				// Update via the socket, so we know someone left.
				socketserver.smcUpdate();

			
			} else {
				chat.say("smc_quit_nojoin",[from]);
			}

		} else {
			chat.say("smc_quit_nosmc",[from]);
		}

	}

	// shows debug info about smc.

	this.traceIt = function(from) {

		console.log("------------------------------------------");
		console.log("smc document: ",smc);
		console.log("------------------------------------------");

	}

	// ------------------------ Legacy Insertion!

	this.legacyInsert = function(legacy,callback) {

		// Check if this exists...
		SMC.findOne({topic: legacy.topic, endsat: legacy.endsat},function(err,foundsmc){

			if (!foundsmc) {

				// Ok, create a new document.
				var newsmc = new SMC;

				newsmc.duration = legacy.duration;
				newsmc.endsat = legacy.endsat;
				newsmc.startsat = legacy.startsat;
				newsmc.topic = legacy.topic;
				newsmc.phase = legacy.phase;
				newsmc.smcers = legacy.smcers;

				newsmc.save(function(err){
					callback(true);
				});


			} else {
				console.log("!NOTICE: I found that SMC '%s'",legacy.topic);
				callback(false);
			}

		});

	}



}