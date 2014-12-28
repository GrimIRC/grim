// --------------------------------------
// ------ The login module.
// Setup as a factory / service.
// As it's used between controllers.
// --------------------------------------

function loginModule($rootScope,$http,$cookies) {

	this.username = '';
	this.session = '';

	// Submit a login attempt to the API
	// returns false if the attempt failed, true otherwise.

	this.submitAttempt = function(loginform,callback) {

		$http.post('/api/login', loginform)	
			.success(function(data) {
				
				// Ok.... callback with the result.
				console.log("!trace LOGIN AJAX: ",data);

				if (data.session) {
					
					this.setLoggedIn(loginform.nick,data.session,function(){
						callback(true);
					});

				} else {

					this.setLoggedOut(function(){
						callback(false);
					});
					
				}
			}.bind(this))
			.error(function(data) {
			
				// Couldn't reach the api, seems.
				this.setLoggedOut(function(){
					callback(false);
				});

			}.bind(this));	

	}

	this.validateSession = function(callback) {

		if ($cookies.username) {
			if ($cookies.session) {
				console.log("!trace page load cookie check: ",$cookies.username,$cookies.session);
				
				// Ok, now call up the API.
				$http.post('/api/validateSession', { username: $cookies.username, session: $cookies.session })
					.success(function(data){

						// Nice, are they really verified?
						if (data.valid) {

							// Great!
							this.setLoggedIn($cookies.username,$cookies.session,function(){
								callback(true);
							});

						} else {

							// Nope, that's no good.
							this.setLoggedOut(function(){
								callback(false);
							});
							
						}

					}.bind(this)).error(function(data){

						// That failed.
						this.setLoggedOut(function(){
							callback(false);
						});
						

					}.bind(this));

			}
		}


	}

	this.setLoggedIn = function(nick,session,callback) {

		// Ok, that's good, we can set what we need here.
		// Now set our session cookie.
		$cookies.session = session;
		$cookies.username = nick;

		// And keep our object properties.
		this.username = nick;
		this.session = session;

		// Little console info.
		console.log("!trace Successful login with session: ",$cookies.session);

		// Send an event.
		$rootScope.$broadcast('loginStatus',true);

		callback();

	}

	this.setLoggedOut = function(callback) {


		// Rest everything.
		$cookies.session = '';
		$cookies.username = '';
		this.username = '';
		this.session = '';

		$rootScope.$broadcast('loginStatus',false);
		callback();

	}



}

smcFrontEnd.factory('loginModule', ["$rootScope", "$http", "$cookies", function($rootScope,$http,$cookies) {
	return new loginModule($rootScope,$http,$cookies);
}]);

smcFrontEnd.controller('loginController', ['$scope', '$location', '$http', 'loginModule', function($scope,$location,$http,login) {

	// $scope.message = "quux";
	console.log("!trace login controller instantiated.");

	$scope.clickLogin = function() {

		console.log("!trace click login data: ",$scope.loginForm);

		login.submitAttempt($scope.loginForm,function(sessionid){

			if (sessionid) {
				// Successful login!!!
				// Reset any previous errors.
				$scope.loginfailure = false;

				$location.path("preferences");

			} else {
				// Welp. That's a failure.
				$scope.loginfailure = true;
			}

		});


	}


}]);


