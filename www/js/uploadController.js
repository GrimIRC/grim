
function uploadController($scope, $location, $http, $cookies, $upload) {

	$scope.verifyUploadKey = function() {

		var params = $location.search();
		var uploadkey = params.key;

		var invalid_request = true;
		var logged_in_nokey = false;

		if (typeof uploadkey != 'undefined') {

			// Only accept hex.
			if (uploadkey.match(/^[0-9a-fA-F]+$/)) {

				// Make the API request.
				$http.post('/api/verifyUploadKey', {key: uploadkey})
					.success(function(data) {
						// That's a good key, we can move along.
						if (data.success) {
							$scope.uploadMode = 'upload';
						} else {
							// Not a good upload key.
							$scope.setUploadError("Dude, sorry that key is no longer good (or may never have been.)");
						}
						
					})
					.error(function(data) {
						
						$scope.setUploadError(data);
						
					});

				invalid_request = false;
			}

		} else {
			// Ok, if they're logged in, we can gen a new key for them.
			if ($scope.login_status) {
				// If they're logged in, we'll give 'em the option to upload one.
				logged_in_nokey = true;
				$scope.uploadMode = "loggedin";

				// Alright, we can ask the API to gen us a key now.
				// Then, we'll just forward to the page with that key.
				// ...I think that's best for now.

				// Make the API request.
				$http.post('/api/generateUploadKey', { username: $cookies.username, session: $cookies.session })
					.success(function(data) {
						// Alright, we got the key back, sooo.... we're good to go to move the user along.
						$location.search('key',data.key);
					})
					.error(function(data) {
						
						console.log("ERROR: I had trouble generating an upload key.");
						
					});

			}
		}

		// Give them the sorry / default page if there's no valid key request.
		if (invalid_request && !logged_in_nokey) {
			$scope.uploadMode = "sorry";
		}

	}

	// Go ahead and kick it off by calling the verify upload key.
	$scope.verifyUploadKey();

	$scope.setUploadError = function(err) {

		console.log('!upload error: ',err);
		$scope.uploadMode = 'upload-error';
		$scope.uploadError = err;

	}


	// --------------------------------<<<<<<<<<<<<<<<<<< end reference
	
	$scope.onFileSelect = function($files) {

		$scope.uploadMode = "upload-in-progress";

		var params = $location.search();
		var uploadkey = params.key;

		//$files: an array of files selected, each file has name, size, and type.
		for (var i = 0; i < $files.length; i++) {
			var file = $files[i];
			$scope.upload = $upload.upload({
				url: '/api/upload', //upload.php script, node.js route, or servlet url

				// For other methods, or headers.
				// method: 'POST' or 'PUT',
				// headers: {'header-key': 'header-value'},
				// withCredentials: true,

				// To attach data.
				data: {key: uploadkey},
				file: file, // or list of files: $files for html5 only

				/* set the file formData name ('Content-Desposition'). Default is 'file' */
				//fileFormDataName: myFile, //or a list of names for multiple files (html5).
				/* customize how data is added to formData. See #40#issuecomment-28612000 for sample code */
				//formDataAppender: function(formData, key, val){}

			}).progress(function(evt) {

				$scope.upload_percent = parseInt(100.0 * evt.loaded / evt.total);

			}).success(function(data, status, headers, config) {

				// file is uploaded successfully
				// It's a success!
				$scope.uploadMode = 'upload-success';

				$scope.uploadedURL = data.url;


			}).error(function(err) {

				$scope.setUploadError(err);

			});
		  //.then(success, error, progress); 
		  //.xhr(function(xhr){xhr.upload.addEventListener(...)})// access and attach any event listener to XMLHttpRequest.
		}
		/* alternative way of uploading, send the file binary with the file's content-type.
		   Could be used to upload files to CouchDB, imgur, etc... html5 FileReader is needed. 
		   It could also be used to monitor the progress of a normal http post/put request with large data*/
		// $scope.upload = $upload.http({...})  see 88#issuecomment-31366487 for sample code.
	  };


	// --------------------------------<<<<<<<<<<<<<<<<<< end reference

}
