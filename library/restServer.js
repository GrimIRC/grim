
module.exports = function(server, smcman, bot, chat, mongoose, db, constants, privates) {

	// --------------------------------------------------------------------
	// -- myConstructor : Throws the constructor into a method.
	// ...Because javascript wants the methods to be defined before referencing them.

	// So you want to interoperate with Apache?
	// Try a directive like so:
	// ProxyPass /api/ http://localhost:8000/api/

	var fs = require('fs');
	
	this.myConstructor = function() {

		// Method call at the bottom of this class.
	
		server.get('/api/foo', this.testFunction);
		server.post('/api/foo', this.testFunction);
		server.head('/api/foo', this.testFunction);

		// ----------------- Upload calls.

		server.get('/api/verifyUploadKey', this.verifyUploadKey);
		server.post('/api/verifyUploadKey', this.verifyUploadKey);
		server.head('/api/verifyUploadKey', this.verifyUploadKey);

		server.get('/api/generateUploadKey', this.generateUploadKey);
		server.post('/api/generateUploadKey', this.generateUploadKey);
		server.head('/api/generateUploadKey', this.generateUploadKey);

		server.get('/api/upload', this.fileUpload);
		server.post('/api/upload', this.fileUpload);
		server.head('/api/upload', this.fileUpload);

		// ----------------- Login calls.

		server.get('/api/login', this.userLogin);
		server.post('/api/login', this.userLogin);
		server.head('/api/login', this.userLogin);

		server.get('/api/validateSession', this.validateSession);
		server.post('/api/validateSession', this.validateSession);
		server.head('/api/validateSession', this.validateSession);

		// ----------------- View call.
		// ...mostly I want this to be shunted via nginx/apache.

		server.get('/api/view/:tinyURL', this.viewUpload);
		server.get('/view/:tinyURL', this.viewUpload);

		// ----------------- SMC calls.

		server.get('/api/livesmc', this.liveSMCInfo);	// obsolete?
		server.post('/api/livesmc', this.liveSMCInfo);
		server.head('/api/livesmc', this.liveSMCInfo);

		server.get('/api/joinOrLeaveSMC', this.joinOrLeaveSMC);
		server.post('/api/joinOrLeaveSMC', this.joinOrLeaveSMC);
		server.head('/api/joinOrLeaveSMC', this.joinOrLeaveSMC);

		server.get('/api/getSMCList', this.getSMCList);
		server.post('/api/getSMCList', this.getSMCList);
		server.head('/api/getSMCList', this.getSMCList);

		server.get('/api/voteForSMC', this.voteForSMC);
		server.post('/api/voteForSMC', this.voteForSMC);
		server.head('/api/voteForSMC', this.voteForSMC);

		// ----------------- Files calls.

		server.get('/api/searchForFilesNick', this.searchForFilesNick);
		server.post('/api/searchForFilesNick', this.searchForFilesNick);
		server.head('/api/searchForFilesNick', this.searchForFilesNick);
		
		server.get('/api/getLabels', this.getLabels);
		server.post('/api/getLabels', this.getLabels);
		server.head('/api/getLabels', this.getLabels);
		
		server.get('/api/listFiles', this.listFiles);
		server.post('/api/listFiles', this.listFiles);
		server.head('/api/listFiles', this.listFiles);

		server.get('/api/editFile', this.editFile);
		server.post('/api/editFile', this.editFile);
		server.head('/api/editFile', this.editFile);

		server.get('/api/topFilesList', this.topFilesList);
		server.post('/api/topFilesList', this.topFilesList);
		server.head('/api/topFilesList', this.topFilesList);

		// --------------- Labels calls

		server.get('/api/addLabel', this.addLabel);
		server.post('/api/addLabel', this.addLabel);
		server.head('/api/addLabel', this.addLabel);

		server.get('/api/editLabel', this.editLabel);
		server.post('/api/editLabel', this.editLabel);
		server.head('/api/editLabel', this.editLabel);

		server.get('/api/deleteLabel', this.deleteLabel);
		server.post('/api/deleteLabel', this.deleteLabel);
		server.head('/api/deleteLabel', this.deleteLabel);

	};

	/*

		-------------- your handy stub!
		this.theStub = function(req, res, next) {

			var input = req.params;

			smcman.user.validateSession(input.username,input.session,function(isvalid){

				if (isvalid) {

				} else {

				}

			});

		}

	*/

	this.serverStart = function() {

		// And then fire up the server.
		server.listen(constants.SERVER_PORT, function() {
			console.log(server.name + ' listening at ' + server.url);
		});

	}

	this.deleteLabel = function(req, res, next) {

		var input = req.params;

		smcman.user.validateSession(input.username,input.session,function(isvalid){

			if (isvalid) {

				// Ok, let's add this label.
				smcman.label.deleteLabel(input.username,input.label,function(){

					res.contentType = 'json';
					res.send({});

				});

			} else {

				console.log("ERROR: Couldn't validate a user session for %s while trying to delete a label",input.username);

			}

		});

	}

	this.editLabel = function(req, res, next) {

		var input = req.params;

		smcman.user.validateSession(input.username,input.session,function(isvalid){

			if (isvalid) {

				// Ok, let's add this label.
				smcman.label.editLabel(input.username,input.previous,input.newlabel,function(){

					res.contentType = 'json';
					res.send({});

				});

			} else {

				console.log("ERROR: Couldn't validate a user session for %s while trying to edit a label",input.username);

			}

		});

	}


	this.addLabel = function(req, res, next) {

		var input = req.params;

		smcman.user.validateSession(input.username,input.session,function(isvalid){

			if (isvalid) {

				// Ok, let's add this label.
				smcman.label.addLabel(input.username,input.label,function(){

					res.contentType = 'json';
					res.send({});

				});

			} else {

				console.log("ERROR: Couldn't validate a user session for %s while trying to create a label",input.username);

			}

		});
		

	}

	this.topFilesList = function(req, res, next) {

		var limit = req.params.limit;

		smcman.upload.topFilesList(limit,function(result){

			res.contentType = 'json';
			res.send(result);

		});

	}

	

	this.editFile = function(req, res, next) {

		var input = req.params;

		smcman.user.validateSession(input.username,input.session,function(isvalid){

			if (isvalid) {
		
				smcman.upload.webappEditFile(input.file,input.username,function(err){

					// Ok, we edited that document.
					res.contentType = 'json';
					res.send({});

				});

			} else {

				console.log("ERROR: Couldn't validate a user session for %s while trying to update a file.",input.username);

			}

		});

	}

	
	this.listFiles = function(req, res, next) {

		var input = req.params;

		// { nick: nick, label: label, page: $scope.files_pageon, limit: $scope.MAX_PER_PAGE }
		// Ok, query the upload object for this list.
		smcman.upload.listFiles(input.nick,input.label,input.limit,input.page,function(uploadresult){

			// Cool, send back that file list.
			res.contentType = 'json';
			res.send(uploadresult);

		});

		// listFiles = function(nick,label,limit,page,callback) {
	
	}

	// Get a list of labels for a particular user.
	this.getLabels = function(req, res, next) {

		var nick = req.params.nick;

		// Request the labels from the labels object.
		smcman.label.getLabels(nick,function(labels){

			res.contentType = 'json';
			res.send(labels);

		});

	}

	// Search for a nick from the files page.
	this.searchForFilesNick = function(req, res, next) {

		// Make a new regex from what they search by.
		var nick = req.params.nick;
		var re_search = new RegExp(nick,"i");

		// Now let's search through users.
		smcman.user.searchForUsers(re_search,function(nicks){

			res.contentType = 'json';
			res.send({nicks: nicks});

		});


	}

	this.voteForSMC = function(req, res, next) {

		var input = req.params;

		smcman.user.validateSession(input.username,input.session,function(isvalid){

			if (isvalid) {

				// Ok, good, this user session is valid. We can submit a vote.
				smcman.smc.submitVote(input.voteon,input.votefor,input.username,function(){

					res.contentType = 'json';
					res.send({});


				});


			} else {

				console.log("ERROR: Issue validing user session while submitting vote.");

			}

		});

	}

	this.getSMCList = function(req, res, next) {

		var input = req.params;

		// Hey did they search for something? We'll include that if we did.
		var extended_search = false;
		if (input.text) {
			extended_search = {
				text: input.text,
				metric: input.metric
			};
		}

		// Ok, we'll want to query for a number of smcs....
		// limit ____________v
		// page ___________v
		smcman.smc.smcPage(input.page,input.limit,extended_search,function(smclist){

			res.contentType = 'json';
			res.send(smclist);

		});


	}


	this.joinOrLeaveSMC = function(req, res, next) {

		var input = req.params;

		smcman.user.validateSession(input.username,input.session,function(isvalid){

			if (isvalid) {

				// Great, now, see if they're joining or leaving.
				if (input.isjoining) {
					smcman.smc.joinSMC(input.username);
				} else {
					smcman.smc.forfeitSMC(input.username);
				}

				res.contentType = 'json';
				res.send({});

			}

		});

	}

	this.liveSMCInfo = function(req, res, next) {

		var return_json = false;

		var smc = smcman.smc.getSMC();

		if (smc.phase) {
			return_json = smc;
		}

		res.contentType = 'json';
		res.send(return_json);

	}

	this.validateSession = function(req, res, next) {

		var input = req.params;

		smcman.user.validateSession(input.username,input.session,function(isvalid){

			res.contentType = 'json';
			res.send({valid: isvalid});

		});


	}

	this.userLogin = function(req, res, next) {

		var input = req.params;

		console.log("!trace user login params: ",input);

		// Now check it with the user module.
		smcman.user.authenticate(input.nick,input.password,function(success){

			res.contentType = 'json';
			res.send({session: success});

		});

	}

	this.viewUpload = function(req, res, next) {

		console.log("!trace view -- req params", req.params);

		// Ok, ask the upload model for the file and type.
		smcman.upload.getUploadByURL(req.params.tinyURL,function(err,path,mimetype){

			// Check for errors.
			if (!err) {

				console.log("!trace file path: ",path);
				console.log("!trace file mime: ",mimetype);

				// Send the file along.
				res.setHeader('Content-type', mimetype);
				var filestream = fs.createReadStream(path);
				filestream.pipe(res);


			} else {

				res.contentType = 'json';
				res.send({error: err});

			}

		});

	}


	this.fileUpload = function(req, res, next) {

		var input = req.params;
		var files = req.files;

		console.log("!trace verify input: ",input);
		console.log("!trace verify files: ",files);

		// First things first, verify the key.
		this.isVerified(input.key,function(verified){
			if (verified) {
				console.log("!trace GREAT, uploaded file, and verified.");
				// Make a request to store it.
				smcman.upload.storeUpload(input.key,files.file.path,files.file.type,files.file.name,function(err,url){

					if (!err) {

						// Ok, good, that's a file we use.
						// Let them know it errored out.
						res.contentType = 'json';
						res.send({success: true, url: url});

					} else {

						// Let them know it errored out.
						res.contentType = 'json';
						res.send({error: err});

					}

				});
				
			} else {

				// Return a JSON result.
				res.contentType = 'json';
				res.send({error: "Key not verified on file upload"});

			}
		});

	}.bind(this);

	this.generateUploadKey = function(req, res, next) {

		var input = req.params;

		smcman.user.validateSession(input.username,input.session,function(isvalid){

			if (isvalid) {

				// Great, go and create a new upload for that guy.
				// newUpload = function(from,is_smc,from_webapp,callback) {
				smcman.upload.newUpload(input.username,false,true,function(key){
					// Great, send that key back.
					res.contentType = 'json';
					res.send({key: key});
				});

			} else {

				console.log("ERROR: Damn, tried to validate a user, but, didn't quite work out, user: ",input.username);

			}

		}.bind(this));

	}.bind(this);

	this.verifyUploadKey = function(req, res, next) {

		var input = req.params;

		console.log("!trace verify key: ",input);

		this.isVerified(input.key,function(verified){
			// Return a JSON result.
			res.contentType = 'json';
			res.send({success: verified});
		});

	}.bind(this);

	this.isVerified = function(key,callback) {

		// Ok, so I'm going to have to talk to the Upload module
		// likely via the bot.
		smcman.upload.isUploadVerified(key,function(verified){

			if (verified) {
				callback(true);
			} else {
				callback(false);
			}

		});

	}.bind(this);

	this.testFunction = function(req, res, next) {

		// console.log(req.params);

		var return_json = [
			{text: "this and that"},
			{text: "the other thing"},
			{text: "final"}
		];
		
		// Return a JSON result.
		res.contentType = 'json';
		res.send(return_json);

	}.bind(this);

	// Call the constructor (after defining all of the above.)

	this.myConstructor();

	
}