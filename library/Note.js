module.exports = function(bot, chat, mongoose, db, constants, privates) {

	// Setup our properties.
	this.bot = bot;
	this.chat = chat;
	this.mongoose = mongoose;
	this.constants = constants;
	this.privates = privates;
	this.moment = require('moment');
	
	// Sample object.
	/* 
	j = {
    	from: "protocoldoug",
    	to: "protocoldoug",
		note: "sample note",
		sent: 1377802447,
    };
    */
	
	// Setup a schema.
	this.noteSchema = this.mongoose.Schema({
		from: String,
		to: String,
		note: String,
		sent: Number
	}, { collection: 'notes' });
	
	// Compile it to a model.
	this.Note = this.mongoose.model('Note', this.noteSchema);
	
	// Here's the note handler.
	// When someone speaks, we check if we have any notes for them.
	this.handler = function(speaker) {

		this.Note.find({to: speaker},function (err, notes) {
			
			if (notes.length) {
		
				for (i = 0; i < notes.length; i++) {
					// Ok, given each note for this person... Send them a mesasge.
					// How long ago was that?
					ago = this.moment.unix(notes[i].sent).fromNow();
					
					// Now, let's send that note to the person it's intended for.
					this.chat.say("note_send",[speaker,notes[i].from,ago,notes[i].note]);
					
					// Now you can delete that from mongo.
					this.Note.findOne({ _id: notes[i]._id }).remove(function(err){
						if (err) {
							throw new Error("Couldn't delete that.");
						}
					}); 
					
				}

			}
			
		}.bind(this));
		
	};
	
	// Additionally, we can make a note.
	this.leaveAMessage = function(from,arguments) {
		
		// Ok, so let's get the nick off the arguments.
		// console.log('arguments',arguments);
		if (/\s/.test(arguments)) {
			
			to = arguments.replace(/^(.+?)\s.+$/,'$1');
			message = arguments.replace(/^.+?\s(.+)$/,'$1');
		
			// Ok, looks like this is a valid message.
			// Nice little way to get a unix-time from 'moment': http://momentjs.com/docs/#/displaying/format/
			newnote = new this.Note({
				from: from, 
				to: to, 
				note: message, 
				sent: this.moment().format('X')
			});
			
			newnote.save();
			
			this.chat.say("note_saved",[from]);
			
		} else {
			
			this.chat.say("note_format",[from]);
			
		}
		
		
	};
	
	
};