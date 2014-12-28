// Creates a "constants" object with defines
// To use like, well, defined constants, but... pack it up real nice.
// Idea: http://stackoverflow.com/questions/8595509/how-do-you-share-constants-in-nodejs-modules

function define(name, value) {
    Object.defineProperty(exports, name, {
        value:      value,
        enumerable: true
    });
}

define("SERVER_PORT",8001);

define("ALLOWED_TYPES",[
	'image/gif',
	'image/jpeg',
	'image/pjpeg',
	'image/png',
	'image/svg+xml',
	'image/vnd.djvu',
	'image/example',
]);

// Private location of file storage.
define("PATH_UPLOAD_STORAGE","/var/smcstore/");

// URL location where files are accessed from.
// e.g. http://smc/FOO/
// where foo is the path under www/
define("PATH_URL_FILESTORAGE","files");


define("UPLOAD_TIME_LIMIT",20); // In minutes.

// -----------
/*
db.auth("whistler","zerobot!")

'image/gif',
'image/jpeg',
'image/pjpeg',
'image/png',
'image/svg+xml',
'image/vnd.djvu',
'image/example',

*/


Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};