// public/core.js
smcFrontEnd = angular.module('smcFrontEnd', ['ngRoute','ngAnimate','ngCookies','angularFileUpload']);

smcFrontEnd.config(function($routeProvider) {

		$routeProvider

			// route for the home page
			.when('/', {
				templateUrl : 'views/home.html',
				controller  : 'homeController'
			})

			.when('/home', {
				templateUrl : 'views/home.html',
				controller  : 'homeController'
			})

			// route for the smc page
			.when('/smc', {
				templateUrl : 'views/smc.html',
				controller  : 'smcController'
			})

			// route for the about page
			.when('/about', {
				templateUrl : 'views/about.html',
				controller  : 'aboutController'
			})

			// route for the help page
			.when('/help', {
				templateUrl : 'views/help.html',
				controller  : 'aboutController'
			})

			// route for the upload page
			.when('/upload', {
				templateUrl : 'views/upload.html',
				controller  : 'uploadController'
			})

			// route for the files page
			.when('/files', {
				templateUrl : 'views/files.html',
				controller  : 'filesController'
			})

			// route for the login page
			.when('/login', {
				templateUrl : 'views/login.html',
				controller  : 'loginController'
			})

			// route for the preferences page
			.when('/preferences', {
				templateUrl : 'views/preferences.html',
				controller  : 'preferencesController'
			});

	});

function homeController($scope, $location, $http, $upload) {

	// $scope.message = "quux";

}


function aboutController($scope, $location, $http, $upload) {

	// ..

}


function helpController($scope, $location, $http, $upload) {

	// ..

}


smcFrontEnd.controller('smcMainController', ['$scope', '$location', '$http', '$cookies', 'loginModule', function($scope, $location, $http, $cookies, login) {

	// Defaults!
	$scope.formData = {};
	$scope.uploadMode = "init";

	// We want more in the path than JUST the page. So let's get that.
	// And for that we can pack the URL params into json with:
	// var searchObject = $location.search();
	// ...so awesome.
	// from: https://docs.angularjs.org/api/ng/service/$location
	
	// Stores which page we're currently, specifically on load (as this is the constructor)
	$scope.onPage = $location.path().substring(1) || 'home';

	// We change the navigation depending on the login status.
	$scope.$on("loginStatus",function(event,status){

		$scope.login_status = status;
		$scope.username = login.username;

	}.bind(this));

	// We check their cookies and validate their session if possible.
	login.validateSession(function(){});

	// Sets the navigation's CSS class, depending on the onPage.
	$scope.navClass = function (page) {
		
		// Get the route.
		var currentRoute = $location.path().substring(1) || 'home';

		// Set the onPage if it's wrong.
		if (currentRoute != $scope.onPage) {
			$scope.onPage = currentRoute;
		}

		return page === currentRoute ? 'active' : '';
	};

	// Log the user out, which is a nav-bar drop-down click.
	$scope.logOutUser = function() {
		login.setLoggedOut(function(){});
	}

	// Set which page we're on.
	$scope.switchPage = function (page,initial_load) {
		// Go ahead and create a handler here to do things when the page is changed.
		if ($scope.onPage != page || (typeof initial_load != 'undefined')) {

			// Most importantly, this switches the view angular style.
			$scope.onPage = page;

			/*
		
			// ---------------------------- REMOVED DURING MULTI-FILE / NG-VIEW REFACTOR.

			// Now handle it.
			console.log("!trace switch page to: " + page);

			switch(page) {

				case "upload":
					
					// If someone is in the middle of a process... we don't wanna restart it.
					// !bang

					switch ($scope.uploadMode) {
						// During any of these modes, it's OK to restart.
						case "init":
						case "upload-success":
						case "upload-error":
							$scope.verifyUploadKey();
							break;

						default:
							break;

					}

					break;

			}
			*/


		}

	}

	// We also call this switch page when the page is first loaded.
	$scope.switchPage($scope.onPage,true);

}]);

$(document).ready(function(){
	$("[data-toggle=tooltip]").tooltip({ placement: 'right'});
});




// --------------- shortcut functions
// http://zachsnow.com/#!/blog/2013/angularjs-shortcuts/
