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
		.state('about', {
			url: '/about',
			templateUrl: '/spa/about'
		});
});