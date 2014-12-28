module.exports = function(smcman, bot, chat, mongoose, db, constants, privates) {

	// Setup a schema.
	var labelSchema = mongoose.Schema({

		nick: String,			// Who's this person?
		label: String,			// What's the label?

	}, { collection: 'labels' });

	// Compile it to a model.
	var Label = mongoose.model('Label', labelSchema);

	this.getLabels = function(nick,callback) {

		// console.log("Which nick?");

		Label.find({nick: nick},function(err,labels){

			// Make a plain list of labels.
			var list = [];

			for (var i = 0; i < labels.length; i++) {
				list.push(labels[i].label);
			}

			callback(list);

		});

	}

	this.addLabel = function(nick,newlabel,callback) {

		// Check if this exists.
		Label.count({nick: nick, label: newlabel}, function(err, counted) {

			if (!counted) {

				// Ok, that's great, we can create a new label for them.
				var label = new Label;
				label.nick = nick;
				label.label = newlabel;
				label.save();

				callback();

			} else {

				console.log("NOTICE: Didn't create a new label '%s', because it exists for nick %s",newlabel,nick);
				callback();

			}

		});

	}

	this.editLabel = function(nick,original,newlabel,callback) {

		// Ok, this is a little more complex...
		// We have to check if it exists
		// We then have to change it here
		// Finally, we change all the uploads involved.

		Label.count({nick: nick, label: original}, function(err, counted) {

			if (counted) {

				// Great pull it up and edit it.
				Label.findOne({nick: nick, label: original}, function(err, label) {

					// Edit and save it.
					label.label = newlabel;
					label.save();

					// Now, call up Uploads and let it know to change the uploads.
					smcman.upload.updateLabels(nick,original,newlabel,function(){

						callback();

					});

				});

			} else {

				console.log("NOTICE: Can't change a label that doesn't exist.");

			}

		});

	}

	this.deleteLabel = function(nick,labelnamed,callback) {

		var params = {nick: nick, label: labelnamed};

		Label.count(params, function(err, counted) {

			if (counted) {

				// Excellent, now let's delete it.
				// Then... let's strip the labels out from the uploads.
				Label.findOne(params,function(err,label){

					// Delete it!
					label.remove();

					// Now go and strip 'em in uploads.
					smcman.upload.stripLabels(nick,labelnamed,function(){

						// Great, we're done.
						callback();
						
					});

				});

			
			} else {
				console.log("NOTICE: I can't delete a label I don't know about, ",label);
				callback();
			}

		});

	}


}