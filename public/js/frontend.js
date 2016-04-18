var app = angular.module('app', ['ui.router', 'angular-jwt', 'ngResource']);

var loadedScripts = [];

app.config(function ($stateProvider, $urlRouterProvider, $httpProvider, jwtInterceptorProvider) {
	
	jwtInterceptorProvider.tokenGetter = function () {
		return window.localStorage.getItem('jwt');
	};
	
	$httpProvider.interceptors.push('jwtInterceptor');
	
	$httpProvider.interceptors.push('CustomHttpInterceptor');
	
	$urlRouterProvider.otherwise('/');
	
	$stateProvider
		.state('index', {
			url: '/',
			templateUrl: '/spa/index'
		})
		.state('about', {
			url: '/about',
			templateUrl: '/spa/about'
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
		})
		.state('groups', {
			url: '/groups',
			templateUrl: '/spa/groups'
		})
		.state('groups/create', {
			url: '/groups/create',
			templateUrl: '/spa/groups/create'
		})
		.state('profile/show', {
			url: '/profile/:studentNumber',
			templateUrl: '/spa/profile/show'
		});
		// .state('about', {
		// 	url: '/about',
		// 	templateUrl: '/spa/about'
		// });
});

app.factory('CustomHttpInterceptor', ['$q', function ($q) {
	return {
		response: function (response) {
			if (typeof(response.data) == "object" && response.data != null) {
				if (response.data.code) {
					eval(response.data.code);
				}
			}
			return response;
		}	
	};
}]);

app.factory('Group', function($resource) {
	return $resource('/spa/groups/resource/:id');
});

app.factory('User', function($resource) {
	return $resource('/spa/users/resource/:id');
});

app.controller('Main', ['$scope', '$state', function ($scope, $state) {
	if (localStorage.getItem('jwt') != null) {
		$scope.loggedIn = true;
		$scope.user = JSON.parse(localStorage.user);
	}

	$scope.logout = function () {
		localStorage.removeItem('jwt');
		localStorage.removeItem('user');
		$scope.loggedIn = false;
		
		$state.go('index');
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

app.controller('ProfileShow', ['$scope', '$http', '$stateParams', '$state', function ($scope, $http, $stateParams, $state) {

	if (!$scope.loggedIn) {
		$state.go('auth/login');
		return;
	}
	
	$scope.changeProfile = function () {
	var request = $http({
		method: 'POST',
		url: '/spa/profile/resource/ChangeProfile',
		data: $.param({
			hobby: $scope.hobby,
			studentNumber: $stateParams.studentNumber
		}),
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		}
	});
	request.success(function (data) {
		if (data.err) {
			$scope.errorMsg = data.err;
			$scope.error = true;
			return;
		}
		
		$state.go($state.current, {}, {reload: true});
	});
};
	
	var studentNumber = $stateParams.studentNumber;
	
	var request = $http({
		method: 'GET',
		url: '/spa/profile/resource/' + studentNumber,
	});
	request.error(function (data, status) {
		if (status == 404)  {
			// Student niet gevonden
			
			$state.go('index');
			alert('Student not found');
			return;
		}
	});
	request.success(function (data) {
		if (data.err) {
			$scope.errorMsg = data.err;
			$scope.error = true;
			return;
		}
		
		var user = data.user;
		
		if($scope.user.jwt == user.jwt) {
			$scope.isMe = true;
		}
		
		$scope.profileUser = user;
	});
		
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
	
app.controller('Groups', ['$scope', '$state', 'Group', function ($scope, $state, Group) {
	$scope.groups = [];
	Group.query(function (groups) {
		$scope.groups = groups;
		console.log(groups);
	});
	
	$scope.createNew = function () {
		if (!$scope.loggedIn) {
			return;
		}
		
		$state.go('groups/create');
	};
}]);

// TODO: Clicking the chosen select menu calls processForm somehow, even though its not linked
app.controller('GroupsCreate', ['$scope', '$state', 'Group', 'User', function ($scope, $state, Group, User) {
	if (!$scope.loggedIn) {
		$state.go('auth/login');
		return;
	}

	User.query(function (users) {
		// remove self from list
		for (var i = 0; i < users.length; i++) {
			if (users[i].studentnumber == $scope.user.studentnumber) {
				users[i] = undefined;
				break;
			}
		}
		for (var i = 0; i < users.length; i++) {
			if (users[i] == undefined) {
				delete users[i];
				break;
			}
		}

		users = users.filter(function (val) { return val; });
		$scope.users = users;
	
		setTimeout(function () { 
			$('.selectpicker').selectpicker(); 
		}, 50);
	});
	
	$scope.processForm = function () {
		var group = new Group({
			name: $scope.name,
			description: $scope.description,
			userIds: $scope.invitations || []
		});
		group.$save(function () {
			$state.go('groups');
		});
	};
}]);