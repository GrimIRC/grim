// Manual page: https://docs.angularjs.org/guide/directive
// Nicely written stack overflow: http://stackoverflow.com/questions/13619264/reusable-components-in-angularjs

/*

Example usage:

	<div ng-if="smc_list">
		<paginator baseurl="smc_baseurl" maxperpage="smc_maxperpage" maxpages="smc_maxinpaginator" total="smc_datatotal"></paginator>
	</div>


Note that all of the values of the attributes are relative to the scope of the directive is called. So, there's no need to do a {{variable}} inside them.

Notice the ng-if? We use that to rebuild this DOM element after an ajax call, for example.

*/

smcFrontEnd.directive('paginator', function () {
	return {
		restrict: 'E',
		scope: {
			total_items: '=total',			// Total number of data items.
			max_per_page: '=maxperpage',	// Max items show per page.
			max_number_pages: '=maxpages',	// Max pages shown in paginator.
			baseurl: '=baseurl'				// Base url which tack on ?page=N to.
		},
		templateUrl: '/views/paginationComponent.html',
		controller: function ($scope, $http, $attrs, $location) {

			// Note how this is mapped to attributes by the scope:{} setup for a directive.
			// console.log("!trace items: %s, per page: %s, max pages: %s, baseurl: %s",$scope.total_items,$scope.max_per_page,$scope.max_number_pages,$scope.baseurl);

			// Figure out what to do with the base URL we're given.
			// If it has a hook, we use an ampersand
			// If it has no hook, we add a hook.
			if ($scope.baseurl.match(/\?/)) {
				// Great, add an ampersand.
				$scope.baseurl += "&";
			} else {
				// Add that hook.
				$scope.baseurl += "?";
			}

			// Get the pageon on based on the URL.// Here's our URL params.
			var current_page = $location.search().page;
			if (typeof current_page == 'undefined') {
				// Set that it's the first page.
				current_page = 1;
			}

			$scope.buildPaginator = function(pageon,total) {

				// Ahh maybe strings being passed through the URL.
				var total = parseInt(total);
				var pageon = parseInt(pageon);

				// Ok, we need to figure out max
				var totalpages = Math.ceil(total/$scope.max_per_page);

				// Then, given the pageon, which items do we show in the paginator?
				// Only show up to $scope.max_number_pages entries.
				var paginator = [];

				// We a boundary given the max in paginator... which is /2 and floor it.
				// So, for example if we show a max of 5, we show 2 on either side. 5/2 = 2.5 = 2
				var boundary = Math.floor($scope.max_number_pages / 2);

				// Given that boundary, how close are we to the edge?
				var begin = pageon - boundary;
				if (begin < 1) { begin = 1; }

				var end = pageon + boundary;

				// Push out the end if it's too short.

				if (end > totalpages) { 
					// This is the boundary at the end of the range.
					end = totalpages;
					begin = (totalpages - $scope.max_number_pages) + 1;
					if (begin < 1) { begin = 1;}

				} else {
					// This is the boundary at the beginning of the range.
					if ((end - begin) < $scope.max_number_pages-1) {
						end = $scope.max_number_pages;
					}

					if (end > totalpages) {
						end = totalpages;
					}

				}

				for (var i = begin; i <= end; i++) {

					var myclass = "";
					if (i == pageon) {
						myclass = "active";
					}

					paginator.push({
						page: i,
						class: myclass
					});
				}

				$scope.paginator = paginator;
				$scope.paginator_lastpage = totalpages;

			}

			$scope.buildPaginator(current_page,$scope.total_items);

	    }
	}
});