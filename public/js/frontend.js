var app = angular.module('app', ['ui.router', 'angular-jwt']);

var loadedScripts = [];

app.config(function ($stateProvider, $urlRouterProvider, $httpProvider, jwtInterceptorProvider) {
	
	jwtInterceptorProvider.tokenGetter = function () {
		return window.localStorage.getItem('jwt');
	};
	
	$httpProvider.interceptors.push('jwtInterceptor');
	
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
		.state('auth/forgotPassword', {
			url: '/auth/forgotPassword',
			templateUrl: '/spa/auth/forgotPassword'
		})
		.state('auth/forgotPassword/verify', {
			url: '/auth/forgotPassword/:verificationCode',
			templateUrl: '/spa/auth/forgotPassword/verify'
		})
		.state('auth/register', {
			url: '/auth/register',
			templateUrl: '/spa/auth/register'
		})
		.state('auth/register/verify', {
			url: '/auth/register/:verificationCode',
			templateUrl: '/spa/auth/register/verify'
		});
		// .state('about', {
		// 	url: '/about',
		// 	templateUrl: '/spa/about'
		// });
});

app.controller('Main', ['$scope', function ($scope) {
	if (localStorage.getItem('jwt') != null) {
		$scope.loggedIn = true;
		$scope.user = JSON.parse(localStorage.user);
	}
	
	$scope.logout = function () {
		localStorage.removeItem('jwt');
		localStorage.removeItem('user');
		$scope.loggedIn = false;
	}
}]);

app.controller('AuthLogin', ['$scope', '$http', '$state', function ($scope, $http, $state) {
		
		if (window.localStorage.jwt) {
			$state.go('index');
		}
		
		$scope.forgotPassword = function () {
			$state.go('auth/forgotPassword');
		};
		
		$scope.processForm = function () {
			var request = $http({
				method: 'POST',
				url: '/spa/auth/login',
				data: $.param({
					studentnumber: $scope.studentNumber,
					password: $scope.password
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
				
				window.localStorage.jwt = data.token;
				window.localStorage.user = JSON.stringify(data.user);
				$state.go('index');
			});
		};
	}]);

app.controller('AuthRegister', ['$scope', '$http', '$state', function ($scope, $http, $state) {
		
		if (window.localStorage.jwt) {
			$state.go('index');
		}
		
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

app.controller('AuthForgotPassword', ['$scope', '$http', '$state', function ($scope, $http, $state) {
		$scope.processForm = function () {
			$scope.errorMsg = '';
			$scope.msg = '';
			
			var studentNumber = $scope.studentNumber;
			
			var request = $http({
				method: 'POST',
				url: '/spa/auth/forgotPassword/',
				data: $.param({
					studentNumber: studentNumber
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
				if (data.msg) {
					$scope.msg = data.msg;
					return;
				}
			});
		};
	}]);

app.controller('AuthForgotPasswordVerify', ['$scope', '$http', '$stateParams', '$state', function ($scope, $http, $stateParams, $state) { 
		var code = $stateParams.verificationCode;
		
		var request = $http({
			method: 'GET',
			url: '/spa/auth/forgotPasswordData/' + code,
		});
		request.success(function (data) {
			var reg = data.passwordReset;
			
			if (data.err) {
				$scope.errorMsg = data.err;
				$scope.error = true;
				return;
			}
			
			$scope.studentnumber = reg.studentnumber;
		});

		$scope.processForm = function () {
			$scope.errorMsg = '';
			$scope.msg = '';
			
			if ($scope.password != $scope.repassword) {
				$scope.errorMsg = 'Wachtwoorden komen niet overeen';
				return;
			}

			$http({
				method: 'POST',
				url: '/spa/auth/forgotPassword/verify',
				data: $.param({
					studentnumber: $scope.studentnumber,
					verificationCode: code,
					password: $scope.password,
					repassword: $scope.repassword
				}),
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded'
				}
			}).success(function (data) {
				if (data.err) {
					$scope.err = data.err;
					return;
				}
				if (data.msg) {
					$scope.msg = data.msg;
				}
				
				if (data.stateChange) {
					$state.go(data.stateChange);
				} else {
					$state.go('auth/login');
				}
			});
		};
		
	}]);

app.controller('AuthRegisterVerify', ['$scope', '$http', '$stateParams', '$state', function ($scope, $http, $stateParams, $state) {
		var code = $stateParams.verificationCode;
		
		var request = $http({
			method: 'GET',
			url: '/spa/auth/register/verifyData/' + code,
		});
		request.success(function (data) {
			var reg = data.registration;
			
			if (data.err) {
				$scope.errorMsg = data.err;
				$scope.error = true;
				return;
			}
			
			$scope.studentnumber = reg.studentnumber;
		});
		
		$scope.processForm = function () {
			$scope.errorMsg = '';
			$scope.msg = '';
			
			if ($scope.password != $scope.repassword) {
				$scope.errorMsg = 'Wachtwoorden komen niet overeen';
				return;
			}
			
			$http({
				method: 'POST',
				url: '/spa/auth/register/verify',
				data: $.param({
					studentnumber: $scope.studentnumber,
					verificationCode: code,
					firstname: $scope.firstname,
					lastname: $scope.lastname,
					password: $scope.password,
					repassword: $scope.repassword
				}),
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded'
				}
			}).success(function (data) {
				if (data.err) {
					return;
				}
				
				if (data.stateChange) {
					$state.go(data.stateChange);
				}
			});
		};
	}]);