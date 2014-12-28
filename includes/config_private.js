// Creates a "constants" object with defines
// ------- THAT ARE PRIVATE ----------------
// -- COPY THIS FILE TO A NEW FILE NAMED: config_private_mine.js
// BUT! To safely make these private, it should be a file that's not in the repository.
// So that's why we have you copy this.

function define(name, value) {
    Object.defineProperty(exports, name, {
        value:      value,
        enumerable: true
    });
}

// Define your mongo connect string, including your auth.
// like: mongoose.connect('mongodb://username:password@host:port/database?options...');
// see also: 
// 		http://mongoosejs.com/docs/connections.html
//		http://docs.mongodb.org/manual/tutorial/enable-authentication/
define("MONGO_CONNECT_STRING",'mongodb://localhost/smcman');

define("IRC_SERVER",'irc.freenode.net');
define("IRC_CHANNEL",'#smcbot');
define("IRC_BOTNAME",'zenodebottest');
define("IRC_REALNAME", 'nodeJS IRC client');
// -- Identification
define("IRC_DO_IDENTIFY",false);
define("IRC_IDENTPASS",'imnotregistered');
// -- Debugging
define("IRC_ENABLED",true);
define("IRC_DEBUG",true);

define("REST_API_ENABLED",true);

define("URL_SMCSITE","http://smc/");

define("COMMAND_CHARACTER","!");

define("BLENDERARTISTS_USERNAME", "protocoldoug");
define("BLENDERARTISTS_PASSWORD", "thesmcbot");
define("VBULLETIN_POST_ENABLED",false);

// This is the place where we put symlinks to the actual files.
define("PATH_UPLOAD_WEBDIR","/home/doug/codebase/smcman/www/files/");
