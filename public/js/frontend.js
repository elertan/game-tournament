var app = angular.module('app', ['ui.router']);

var loadedScripts = [];

app.config(function ($stateProvider, $urlRouterProvider) {
	$urlRouterProvider.otherwise('/');

	$stateProvider
		.state('index', {
			url: '/',
			templateUrl: '/spa/index'
		})
		.state('login', {
			url: '/auth/login',
			templateUrl: '/spa/auth/login'
		})
		.state('about', {
			url: '/about',
			template: '<h1>ABOUT PAGE</h1>'
		});
});