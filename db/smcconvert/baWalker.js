// DS ran this from smcman with:
//		var Convert = require("../db/smcconvert/baWalker.js");
//		this.convert = new Convert(this);

module.exports = function(smcman) {

	// Scrape BA to fill up SMC documents in mongodb.
	// ...wish I coded it into smcman previously, lol.
	
	sprintf = require('sprintf-js').sprintf;

	var request = require('request');			// make http requests
	var cheerio = require('cheerio');			// rip up html jquery style.
	var moment = require('moment');				// momentjs <3
	var schedule = require('node-schedule');	// schedule stuff (we don't wanna hammer BA.)

	var SCHEDULE_WAIT = 1;

	var MONTHS = [
		"{zero}",
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec",
	];

	// http://blenderartists.org/forum/forumdisplay.php?22-Speed-Modeling-Contests/page73
	var BASE_URL = "http://blenderartists.org/forum/forumdisplay.php?22-Speed-Modeling-Contests/page";
	var FORUM_BASE = "http://blenderartists.org/forum/";

	// This is important, it tells us the BA page to list from.
	// ...we countdown from this number.
	var baListPageNumber = 65;

	var getPostList = function(options,callback) {

		var masterlist = [];

		// We request the new post page.
		request(options, function(error, response, html){
			if(!error){

				// We use cheerio for dom parsing
				var $ = cheerio.load(html);

				var threads = $('.inner').each(function(idx,threadtag){
					// console.log("\n\n\n\n\n\n\n\n\n!trace threadtag: -----------------------------------------------\n\n",threadtag);

					// So I wanna find: threadtitle
					// which gives me URL and title in an a tag.
					// And: threadmeta
					// which gives me the author... so I know which ones to parse.

					var rawtitle = $(this).find('.threadtitle').find('.title');

					if (rawtitle.length) {
						var posturl = FORUM_BASE + rawtitle['0'].attribs.href;
						var posttitle = rawtitle['0'].children[0].data;

						// Now find that author.
						var rawmeta = $(this).find('.threadmeta').find('.username');
						var rawdate = rawmeta['0'].attribs.title;
						var postauthor = rawmeta['0'].children[0].data;

						// Now we can figure out if this is eligible for processing...
						if (postauthor == "protocoldoug") {

							// Ok, let's parse the date.
							var datestring = rawdate.replace(/^.+on\s(.+)$/,'$1');
							
							// Bust that out.
							var re_badate = /^(\d+)\-(...)\-(\d\d).(..)\:(..)/;
							var date_day = datestring.replace(re_badate,"$1");
							var date_mon = datestring.replace(re_badate,"$2");
							var date_year = datestring.replace(re_badate,"$3");
							var date_hour = datestring.replace(re_badate,"$4");
							var date_minute = datestring.replace(re_badate,"$5");

							var date_mon = sprintf("%02d",MONTHS.indexOf(date_mon));

							// Sample: "2013-02-08 09:30"
							var parsedatestring = "20" + date_year + "-" + date_mon + "-" + date_day + " " + date_hour + ":" + date_minute;

							// console.log("!trace datestring: ",datestring);
							// console.log("!trace parsedatestring:",parsedatestring);

							var postdate = new moment(parsedatestring);

							// console.log("!trace todate: ",postdate.toDate());
							// console.log("!trace unixy: ",postdate.valueOf());

							// Yep, that's an automated one
							// But check the subject syntax...

							if (posttitle.match(/^\[\s.+?(\s\])\s\-\s\[\s\d+\sMinutes\s\]$/)) {

								/*

									{ 
										"duration" : 1, 
										"startsat" : { "$date" : 1401999000448 }, 
										"endsat" : { "$date" : 1401999060448 }, 
										"uploadby" : { "$date" : 1401999120460 } 
										"originator" : "protocoldoug", 
										"phase" : 4, 
										"smcers" : [ 
											{ 	"nick" : "protocoldoug", 
												"uploaded" : true, 
												"url" : "http://smc/files/cc7210", 
												"voters" : [ "protocoldoug" ], "votes" : 1 }, 
											{ "nick" : "dougd00d", "uploaded" : true, "url" : "http://smc/files/66920f" } ],
										"topic" : "chooder", 
									}

								*/

								// Ok parse out the subject & length
								var posttopic = posttitle.replace(/^\[\s(.+?)\s\].+$/,"$1");
								var postduration = posttitle.replace(/^\[\s(.+?)\]\s\-\s\[\s(\d+).+$/,"$2");

								// console.log("!trace: author: %s | date: %s | topic: %s | duration: %s | url: %s",postauthor,postdate,posttopic,postduration,posturl);

								var smcdoc = {
									ba_url: posturl,
									duration: parseInt(postduration),
									endsat: postdate.toDate(),
									startsat: postdate.subtract("minutes",parseInt(postduration)).toDate(),
									topic: posttopic,
									phase: 4,
									smcers: [],
								};

								masterlist.push(smcdoc);
								
							} else {
								console.log("!NOTICE: Didn't match on title: ",posttitle);
							}

						}


					}

				});

				// Ship back the whole list.
				callback(masterlist);

			}
		});

	}

	var getSMCPost = function(smc,callback) {

		var perpost_options = {
			method: 'GET',
			uri: smc.ba_url,
		};

		// We request the new post page.
		request(perpost_options, function(error, response, html){
			if(!error){

				// We use cheerio for dom parsing
				var $ = cheerio.load(html);

				var images = [];

				var postcontainer = $('.postcontent').find('img').each(function(idx,theimg){
					var eachimage = theimg.attribs.src;
					if (eachimage.match(/speedmodeling\.org.+smcfiles/)) {
						// console.log("!trace theimg: ",eachimage);
						images.push(eachimage);
					} else {
						// console.log("!trace NO MATCH: ",eachimage);
					}
				});

				// Wow, that was screwing me over, setting a variable to an array makes a pointer.
				var imagelistcopy = images.slice(0);

				// Ok, get the nicks for all of these.
				getNickRecurse(images,[],function(nicklist){

					// The nicklist is backwards.
					nicklist.reverse();

					// We should be able to build the document now...
					var smcerslist = [];

					for (var i = 0; i < imagelistcopy.length; i++) {
						smcerslist.push({nick: nicklist[i], url: imagelistcopy[i], uploaded: true});
					}

					// Set the array-of-hashes of smcers.
					smc.smcers = smcerslist;

					// Now, we finally save it!
					smcman.smc.legacyInsert(smc,function(didinsert){
						// Ok, we saved it!
						if (didinsert) {
							console.log("SUCCESS: Inserted '%s' from ",smc.topic,smc.endsat);
						}
						
						// Ok, that's a success, go back to where you came.
						callback();

					});


				}.bind(images));

				

			} else {
				console.log("!ERROR: Couldn't get that URL, in getting an SMC post.");
			}

		});

	}

	var getNickRecurse = function(imglist,result,callback) {

		if (imglist.length) {

			// Ok, make the call to smcman.
			var img = imglist.pop();

			// Ok make the request using that.
			smcman.upload.getNickByLegacyName(img,function(nick){

				result.push(nick);
				getNickRecurse(imglist,result,function(){
					// console.log("!trace Stepping out.");
					callback(result);
				});

			});


		} else {
			// console.log("!trace NICK RECURSE ENDPOINT.");
			callback(result);
		}

	}
	
	// -------------------------- The Handler! (comes at the end, all JS style.

	// schedule.scheduleJob('first', { second: new schedule.Range(0, 59) }, function() { console.log('1 running.');});
	// schedule.scheduleJob('second', { second: new schedule.Range(0, 59) }, function() { console.log('2 running.');});

	var smcshifter = [];

	var postRecurse = function(callback) {

		// Shift off an element.
		var eachsmc = smcshifter.shift();

		if (eachsmc) {
		
			// console.log("!trace going");

			// Delay that a little...
			setTimeout(function() {
					getSMCPost(eachsmc,function(){
						// Now recurse!
						postRecurse(function(){
							// console.log("!trace GOOD, I'm climbing back down.");
							callback(false);
						});
					})
				},
				1000 * SCHEDULE_WAIT
			);
		

		} else {
			
			console.log("!trace POST RECURSE END POINT.");
			callback(true);
		
		}

		// getSMCPost(eachsmc,function(){
		// });

	}

	var listRecurse = function() {
		baListPageNumber--;
		if (baListPageNumber > 0) {
			console.log("!trace getting LIST @",baListPageNumber);

			var options = {
				method: 'GET',
				uri: BASE_URL + baListPageNumber.toString(),
			};

			getPostList(options,function(smcdocs){

				var jobnumber = 0;
				var jobfinished = 0;

				// So, we want to, with each doc...
				// Retrieve a new page.
				// But, we don't want to hammer the service.
				// What shall we do to splay this out over time?
				// So we'll recurse.

				smcshifter = smcdocs;
				postRecurse(function(){
					
					// And here we recurse...
					listRecurse();

				});
				
			}.bind(this));

		} else {
			console.log("!trace IT'S OVER");
		}
	}

	// Kick it all off!!!
	listRecurse();

}