var app = angular.module('app', ['ui.router']);

var loadedScripts = [];

app.config(function ($stateProvider, $urlRouterProvider) {
	$urlRouterProvider.otherwise('/');

	$stateProvider
		.state('index', {
			url: '/',
			templateUrl: '/spa/index'
		})
		.state('auth/login', {
			url: '/auth/login',
			templateUrl: '/spa/auth/login'
		})
		.state('auth/register', {
			url: '/auth/register',
			templateUrl: '/spa/auth/register'
		})
		.state('about', {
			url: '/about',
			templateUrl: '/spa/about'
		});
});

app.controller('Main', ['$scope', function ($scope) {
	
}]);

app.controller('AuthRegister', ['$scope', '$http', function ($scope, $http) {
	$scope.processForm = function () {
		$scope.errorMsg = '';
		$scope.msg = '';
		
		var request = $http({
			method: 'POST',
			url: '/spa/auth/register',
			data: $.param({
				studentnumber: $scope.studentnumber
			}),
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			}
		});
		request.success(function (data) {
			if (data.err) {
				$scope.errorMsg = data.err;
				return;
			}
			$scope.msg = data.msg;
		});	
	};
}]);