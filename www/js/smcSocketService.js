// ------------------------------------------------------------------ -
// ------ The socket module.
// Setup as a factory / service.
// It might be used between controllers, and for organization.
// ----------------------------------------------------------------- -

function smcSocketService($rootScope,$http,$cookies) {

	console.log("!trace SMC SOCKET SERVER, HERE I AM.");

	var socket = io();

	socket.on('pushsmc',function(smcdata){
		console.log("!trace SMC data FOR BROADCAST: ",smcdata);
		$rootScope.$broadcast('smcUpdate',smcdata);
	});

	this.manuallyGetSMC = function() {

		socket.emit('getsmc', 'dingo');

	}

}

smcFrontEnd.factory('smcSocketService', ["$rootScope", "$http", "$cookies", function($rootScope,$http,$cookies) {
	return new smcSocketService($rootScope,$http,$cookies);
}]);
