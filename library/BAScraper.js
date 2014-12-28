// ----------------------------------------------- -
// -- The Blender Artists Scraper
// ----------------------------------------------- -
// Thanks again scotch.io:
// http://scotch.io/tutorials/javascript/scraping-the-web-with-node-js

module.exports = function(smcman, bot, chat, mongoose, db, constants, privates) {

	var BASE_URL = 'http://blenderartists.org/forum/';

	// Setup our request & cookie jar.
	var request = require('request');
	var cookiejar = request.jar();
	var request = request.defaults({jar:cookiejar});
	var fs = require('fs');
	
	// Cheerio is cool, it's a jquery subset which can parse a DOM.
	var cheerio = require('cheerio');

	// Optionally, as BA supports doing this to your p/w
	var md5 = require('MD5');

	this.postPoll = function(message,html,callback) {

		// console.log("!trace the html: ",html);

		var $ = cheerio.load(html);

		var formtag = $('meta').each(function(idx,metatag){
			
			// console.log("\n\n!trace show each metatag:",metatag);

			// Get the metatag that counts.
			if (metatag.attribs.content.match(/http.+polloptions/)) {

				// Clean up that URL.
				var forward_url = metatag.attribs.content;
				forward_url = forward_url.replace(/^.+URL\=(.+)$/,'$1');
				// console.log("!trace forward_url: ",forward_url);

				// Ok, now we can go to the poll options url.
				var options = {
					method: 'GET',
					uri: forward_url,
				};

				// We request the new post page.
				request(options, function(error, response, html){
					if (!error) {

						var $ = cheerio.load(html);

						var newpostform = $('.vbform');
						// console.log("!trace newpostform: ",newpostform);
						var url_submit = BASE_URL + newpostform['0'].attribs.action;
						// console.log("!trace url to post for poll: ",url_submit);

						var formtag = $('.vbform').find('input');

						var count = formtag.length;

						// Initialize our form.
						var form = {

						};

						formtag.each(function(idx,inputtag){
							// console.log("\n\n!trace show each inputtag: %s :",inputtag.name,inputtag.attribs);

							// We collect default hidden & text fields.
							// Ok, now we just want select fields from this.
							switch(inputtag.attribs.type) {
								case "text":
								case "hidden":
									form[inputtag.attribs.name] = inputtag.attribs.value; 
									break;

								default:
									break;
							}

							// Continue after you hit the last element.
							if (!--count) {

									// fill out your form! submit it!
									// what you're looking for: 
									//  name: 'options[8]',

									// Set the topic.
									form.question = "Winner of " + message.subject;

									// Cycle through SMCers
									for (var sidx = 0; sidx < message.smcers.length; sidx++) {

										// Whozzat dude?
										var dude = message.smcers[sidx];

										// Figure out the name of the form field.
										var field = "options[" + (sidx+1).toString() + "]";

										// Assign each field as a dude.
										form[field] = dude;

									}

									// console.log("!trace filled form: ",form);

									var postoptions = {
										method: 'POST',
							    		uri: url_submit,
							    		form: form,
									};

									request(postoptions, function(error, response, html){

										if (!error) {

											// Great! That's exactly what we're looking for, a success.
											// For now send back a raw URL.
											callback(url_submit);

										} else {
											console.log("ERROR: That was an error POSTing the poll options.");
										}

									});

							}

						});

					} else {
						console.log("ERROR: That's an issuing trying to GET the poll options page.");
					}
				});
				fs.readFile("/home/doug/codebase/smcman/poll.txt", "utf8", function(err,html){

					


					// -------------------------------------------------------


				});

			}

		});

	}

	// Create a new post.
	// Returns the resulting HTML after the new post is POSTed.

	this.baNewPost = function(message,callback) {

		var options = {
			method: 'GET',
    		uri: BASE_URL + 'newthread.php?do=newthread&f=22',
		};

		// We request the new post page.
		request(options, function(error, response, html){
			if(!error){

				// We use cheerio for dom parsing
				var $ = cheerio.load(html);
				var newpostform = $('.vbform');
				// console.log("!trace newpostform: ",newpostform);
				var url_submit = BASE_URL + newpostform['0'].attribs.action;
				// console.log("!trace url to post for new post: ",url_submit);

				var formtag = $('.vbform').find('input');

				var count = formtag.length;

				// Initialize our form.
				var form = {

				};

				formtag.each(function(idx,inputtag){
					// console.log("\n\n!trace show each inputtag: %s :",inputtag.name,inputtag.attribs);

					// We collect default hidden & text fields.
					// Ok, now we just want select fields from this.
					switch(inputtag.attribs.type) {
						case "text":
						case "hidden":
							form[inputtag.attribs.name] = inputtag.attribs.value; 
							break;

						default:
							break;
					}

					// Continue after you hit the last element.
					if (!--count) {

						// Set the rest of the properties of the form.
						// Add our custom info about the SMC.
						form.subject = message.subject;
						form.message = message.body;
						form.postpoll = "yes";
						form.polloptions = message.number_options;

						// console.log("!trace HERE'S THE NEW FORM: ",form);

						// Now we're going to want to post it.
						// This gets harier for testing, because now you'll actually make a new thread.
						// Let's see what happens, hahah. Just get to poll options.

						var postoptions = {
							method: 'POST',
				    		uri: url_submit,
				    		form: form,
						};

						request(postoptions, function(error, response, html){

							if(!error){
		
								// Just callback with the HTML.
								callback(html);

							} else {

								console.log("ERROR: We failed while trying to post the new thread.");

							}
		
						});

					}

				});

			} else {
				console.log("ERROR: We couldn't get the page which has the post-new-thread form on it.");
			}

		});


		/*

		Example post:

		rh2
		[IMG]http://speedmodeling.org/smcfiles/rh2_cart.png[/IMG]
		Teh_Bucket
		[IMG]http://speedmodeling.org/smcfiles/Teh_Bucket_CLown%20CAR%21.png[/IMG]
		kngcalvn
		[IMG]http://speedmodeling.org/smcfiles/kngcalvn_tube_car.png[/IMG]

		*/

	}

	// Login to blender artists
	this.baLogin = function(callback) {

		// Here's our base options for the main page.
		var options = {
			method: 'GET',
    		uri: BASE_URL + 'index.php'
		};

		// Request that main page.
		request(options, function(error, response, html){
			if(!error){

					// console.log("first response: %s \n\n",response);
					// console.log("jar: %j",cookiejar);

					var rio = cheerio.load(html);

					// console.log("Initial page result doc: %j",);

					var loginform = rio('#navbar_loginform');
					var url_submit = BASE_URL + loginform['0'].attribs.action;
					
					
					// Fill out the form for BA login.
					
					var filled_form = {
						vb_login_username: privates.BLENDERARTISTS_USERNAME,
						vb_login_password: privates.BLENDERARTISTS_PASSWORD,
						vb_login_password_hint: "Password",
						s: '',
						do: "login",
			    		securitytoken: "guest",
			    		// This also worked, but, you should set the above password field to blank.
			    		// vb_login_md5password: md5(privates.BLENDERARTISTS_PASSWORD),
			    		// vb_login_md5password_utf: md5(privates.BLENDERARTISTS_PASSWORD),
					};

					// console.log("filled form: %j", filled_form);
					// console.log("url_submit: ",url_submit);

					// Setup the request options for logging in.
					var loginform_options = {
						method: "POST",
						uri: url_submit,
						form: filled_form,
					};

					request(loginform_options,function(error, response, html){

						if(!error){

							/*
								// Sometimes... ya gotta debug.
								console.log("--------------------------------------- ");
								console.log(" html: ",html);
								console.log("--------------------------------------- ");
								console.log(" response: ",response.headers);
								console.log("--------------------------------------- ");
								console.log(" req: ",response.req._header	);
								console.log("--------------------------------------- ");
							*/


							// var rio = cheerio.load(html);

							// console.log("result: %j",json);
							// console.log("jar: %j",cookiejar);

							callback(true);



						} else {
							console.log("ERROR: Couldn't POST to BA login page");
							callback(false);
						}

					});
			
			} else {
				console.log("ERROR: Couldn't get initial BA page.");
				callback(false);
			}

		});
	

	}

}