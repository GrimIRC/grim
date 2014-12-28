smcFrontEnd.controller('filesController', ['$scope', '$location', '$http', '$cookies', 'smcSocketService', function($scope,$location,$http,$cookies,socketservice) {

	// Our default label (e.g. when none is selected)
	var DEFAULT_LABEL = "{All Labels}";
	var TOP_FILES_LIMIT = 100;

	// Figure out what page we're on.
	$scope.files_pageon = $location.search().page;
	if (typeof $scope.files_pageon == 'undefined') {
		// Set that it's the first page.
		$scope.files_pageon = 1;
	}

	// See if there's a filter in the URL.
	$scope.filterlabel = $location.search().label;
	if (typeof $scope.filterlabel == 'undefined') {
		// Default it if need be.
		$scope.filterlabel = DEFAULT_LABEL;
	}

	// In our "constructor" we set if the label is editable.

	// Maximums for pagination.
	$scope.MAX_PER_PAGE = 15;
	$scope.MAX_PAGES = 5;

	// Default the actual list we use.
	$scope.files_list = false;
	$scope.files_baseurl = "#/files";

	// Default that a user cannot edit.
	$scope.can_edit = false;

	// Default that we're not editing labels.
	var EDIT_STATUS_NONE = "none";
	var EDIT_STATUS_ADD = "add";
	var EDIT_STATUS_EDIT = "edit";

	$scope.label_edit_status = EDIT_STATUS_NONE;


	// Constructor at the bottom, so I can define the methods....

	// ------------------------- Label Edit Methods

	$scope.labelEditMode = function() {
		console.log("!trace filterlabel: ",$scope.filterlabel);
		// Save the current label, we'll use it on cancel, and for saving.
		$scope.saved_label = $scope.filterlabel;

		// Set the mode.
		$scope.label_edit_status = EDIT_STATUS_EDIT;
	}

	$scope.labelAddMode = function() {
		$scope.label_edit_status = EDIT_STATUS_ADD;

	}

	$scope.cancelLabelEdit = function() {

		// Reset the old label.
		$scope.filterlabel = $scope.saved_label;

		// Reset any possible new label.
		$scope.new_label = "";

		// Go back to not-editing-mode.
		$scope.label_edit_status = EDIT_STATUS_NONE;

	}

	$scope.saveLabelAdd = function() {

		// Ok, save the added label.
		console.log("!trace adding new label: ",$scope.new_label);

		$http.post('/api/addLabel', { username: $cookies.username, session: $cookies.session, label: $scope.new_label })
			.success(function(data){

				// And we can virtually cancel edits, to reset the edit mode.
				$scope.cancelLabelEdit();

				// Ok, that's great, let's reload it all.
				$scope.getLabelsForUser();
				$scope.getFileList();
				
			}.bind(this)).error(function(data){

				// Log an error with our API request.
				console.log("ERROR: No bueno, couldn't save a new label");

			}.bind(this));

	}

	$scope.saveLabelEdit = function() {

		// Save edits to a label.
		console.log("!trace saving edit to: %s / new label: %s",$scope.saved_label,$scope.filterlabel);

		$http.post('/api/editLabel', { username: $cookies.username, session: $cookies.session, previous: $scope.saved_label, newlabel: $scope.filterlabel })
			.success(function(data){


				// Reload the labels.
				$scope.getLabelsForUser();

				// We need to set our URL, which will reload files.
				$scope.filterByLabel();

				// We also need to leave the edit mode.
				$scope.label_edit_status = EDIT_STATUS_NONE;
				
			}.bind(this)).error(function(data){

				// Log an error with our API request.
				console.log("ERROR: No bueno, couldn't save a new label");

			}.bind(this));

	}

	$scope.deleteLabel = function() {

		console.log("!trace deleting label: ",$scope.filterlabel);

		$http.post('/api/deleteLabel', { username: $cookies.username, session: $cookies.session, label: $scope.filterlabel })
			.success(function(data){

				// Reload the labels.
				$scope.getLabelsForUser();

				// Since we deleted a label, we wanna go back to the default.
				$scope.filterlabel = DEFAULT_LABEL;

				// We need to set our URL, which will reload files.
				$scope.filterByLabel();

				// We also need to leave the edit mode.
				$scope.label_edit_status = EDIT_STATUS_NONE;
				
			}.bind(this)).error(function(data){

				// Log an error with our API request.
				console.log("ERROR: Zut alors! Couldn't delete that label.");

			}.bind(this));

	}

	// ------------------------- File Edit Methods

	$scope.editIt = function(idx) {

		// Set an edit mode on the file in list @ index.
		if (!$scope.files_list[idx].edit_mode) {
			$scope.files_list[idx].edit_mode = true;
		} else {
			$scope.files_list[idx].edit_mode = false;
		}

	}

	$scope.saveIt = function(idx,callback) {

		if (typeof callback === 'undefined') {
			callback = function(){};
		}

		// console.log("!trace saveIt: ",$scope.files_list[idx]);

		// Alright, ship the whole thing back to the API.
		$http.post('/api/editFile', { username: $cookies.username, session: $cookies.session, file: $scope.files_list[idx] })
			.success(function(data){

				// console.log("!trace success saving resulted in: ",data);
				// Ok, I think you can close the edit mode.
				$scope.files_list[idx].edit_mode = false;

				callback();

			}.bind(this)).error(function(data){

				// Log an error with our API request.
				console.log("ERROR: That's a downer, I couldn't save changes to a file.");

			}.bind(this));

	}

	$scope.cancelIt = function(idx) {
		// Set edit mode as false.
		$scope.files_list[idx].edit_mode = false;
		// Set delete warning false.
		$scope.files_list[idx].delete_warning = false;
		// You could, if you wanted...
		// Reset all the data for it.
		// But that'd require some non-destructive save of an instance of it.
		// maybe later.
	}

	$scope.deleteIt = function(idx) {
		// console.log("!trace deleteIt: ",idx);
		// Ok, we should just be able to set the deleted property, and ship it back via save it.
		$scope.files_list[idx].deleted = true;

		$scope.saveIt(idx,function(){

			// Ok, we deleted it.
			// Let's refresh.
			$scope.getFileList();

		});

	}

	$scope.filterByLabel = function() {

		// Ok, i want to use a location param for this.
		// So i've refactored it.

		// Flip back to the first page.
		$scope.files_pageon = 1;
		$location.search('page', null);

		// Reset the delete warning.
		$scope.label_delete_warning = false;

		// Find out what it is.
		// Filter by all, but clear the URL if it's default.
		if ($scope.filterlabel == DEFAULT_LABEL) {
			// Ok, it's a default.
			// You can clear it with a null.
			$location.search('label', null);
		} else {
			// That in the URL.
			$location.search('label', $scope.filterlabel);
		}

		// Check if it's editable.
		$scope.setIfLabelIsEditable();

		// Set our base URLs for pagination.
		$scope.setBaseURLForPagination();

		// Now we can refresh that file list.
		$scope.getFileList();

	}

	$scope.getFileList = function() {

		var label = $scope.filterlabel;
		var nick = $scope.filesuser;

		// console.log("!trace CHECKING LABEL: ",label);

		// Change the label if it's the default.
		// ...We'll just clear it.
		if (label == DEFAULT_LABEL) {
			label = false;
		}

		// Now let's make that ajax call.
		$http.post('/api/listFiles', { nick: nick, label: label, page: $scope.files_pageon, limit: $scope.MAX_PER_PAGE })
			.success(function(data){

				// console.log("!trace file RAW: ",data);

				// Set the total for the paginator.
				$scope.files_datatotal = data.total;

				// We'll groom the uploads to do some nice things for display.
				var uploads = data.uploads;

				/*
				for (var i = 0; i < uploads.length; i++) {
					// Go ahead and do a few things:
					// 1. Set a pretty date.
					// 2. Set if is an image.

					uploads[i].is_image = $scope.isImage(uploads[i].mime_type);

				}
				*/

				// Now, go and set the file list scope item.
				$scope.files_list = uploads;

				// We set this range for bootstrap scaffolding.
				// http://stackoverflow.com/questions/11056819/how-would-i-use-angularjs-ng-repeat-with-twitter-bootstraps-scaffolding
				$scope.files_list.range = function() {
					var range = [];
					for ( var i = 0; i < $scope.files_list.length; i = i + 3 ) {
						range.push(i);
					}
					return range;
				}

				// Check if this user can edit this.
				if ($cookies.username == nick) {
					$scope.can_edit = true;
				} else {
					$scope.can_edit = false;
				}

				// console.log("!trace file list: ",uploads);


			}.bind(this)).error(function(data){

				// Log an error with our API request.
				console.log("ERROR: Dangit, screwed up when I went to get a list of files.");

			}.bind(this));

	}

	// List files for a particular user.
	$scope.getLabelsForUser = function() {

		$http.post('/api/getLabels', { nick: $scope.filesuser })
			.success(function(data){

				// Add the default at the beginning.
				data.unshift(DEFAULT_LABEL);
	
				$scope.labellist = data;

				// console.log("!trace label list: ",data);


			}.bind(this)).error(function(data){

				// Log an error with our API request.
				console.log("ERROR: Fudge, unable to get list of labels for user.");

			}.bind(this));


	}


	// Search by nick, to get a list of nicks.

	$scope.searchByNick = function() {

		// Ok, send this only if there's 
		if ($scope.searchnick.length > 2) {

			$http.post('/api/searchForFilesNick', { nick: $scope.searchnick })
				.success(function(data){

					// Cool, see if there's anything there.
					
					if (data.nicks.length > 0) {

						// Send the list to the UI.
						$scope.search_result = data.nicks;
						
						// cool, that's good.
						$scope.search_status = "results";

					} else {

						// Show that we have no results.
						$scope.search_status = "noresults";

					}

				}.bind(this)).error(function(data){

					// Log an error with our API request.
					console.log("ERROR: Sooo, had trouble submitting that vote. sucks.");

				}.bind(this));

		} else {

			// Let 'em know they need to use 3 or more characters.
			$scope.search_status = "tooshort";
		}

	}

	$scope.topFiles = function() {

		$http.post('/api/topFilesList', { limit: TOP_FILES_LIMIT })
			.success(function(data){

				// Add the default at the beginning.
				// console.log("!trace top files list: ",data);
				$scope.top_files = data;


			}.bind(this)).error(function(data){

				// Log an error with our API request.
				console.log("ERROR: Crap, couldn't get the topFilesList");

			}.bind(this));

	}

	$scope.setBaseURLForPagination = function() {
		// Hook that onto our baseurl.
		$scope.files_baseurl += "?user=" + $scope.filesuser;

		// Do we need a label there too?
		if ($scope.filterlabel != DEFAULT_LABEL) {
			$scope.files_baseurl += "&label=" + $scope.filterlabel;
		}
	}

	$scope.setIfLabelIsEditable = function() {

		// Can the user edit this label?
		$scope.label_is_editable = false;
		// If this is their user, and, it's not the default label, yes they can.
		if ($scope.filesuser == $cookies.username && $scope.filterlabel != DEFAULT_LABEL) {
			$scope.label_is_editable = true;
		}

	}

	// Constructor type actions....
	$scope.search_status = "emptysearch";

	// Here's our URL params.
	$scope.filesuser = $location.search().user;

	if (typeof $scope.filesuser != 'undefined') {

		// So that's great, there's a username there.
		// Let's start the request to pull up the user's files.
		$scope.getLabelsForUser();

		// Check if that label is editable.
		$scope.setIfLabelIsEditable();

		// Set the base URLs for pagination.
		$scope.setBaseURLForPagination();

		// And also get the default page for 'em.
		$scope.getFileList();

	} else {
		// Set that it's the search page, this is the default way you come into the page.
		$scope.filesuser = false;

		// Let's kick off getting the list of users to fill out this page.
		$scope.topFiles();
	}

}]);