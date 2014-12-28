// Creates a "constants" object with defines
// To use like, well, defined constants, but... pack it up real nice.
// Idea: http://stackoverflow.com/questions/8595509/how-do-you-share-constants-in-nodejs-modules

function define(name, value) {
    Object.defineProperty(exports, name, {
        value:      value,
        enumerable: true
    });
}

// ---------------------------------- IRC Constants
define("IRC_CHANNEL",'#grim-fb');
define("IRC_BOTNAME",'grimbot-fb');
define("IRC_IDENTPASS",'imnotregistered');
define("IRC_SERVER",'irc.freenode.net');
define("IRC_ENABLED",true);
define("IRC_DEBUG",true);
