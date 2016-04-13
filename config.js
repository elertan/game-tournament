'use strict';

module.exports = {
	port: process.env.PORT || 1337,
	site: 'http://www.gametournament.nl:1337',
	secret: 'patrickvonkzijnpauperprochat',
	auth: {
		expirationTime: "9999d", // 9999 Days
		blockedLoginInitialTime: 180, // 3 minutes
		blockedLoginIncremental: 1.5 // 1.5 times larger each time
	},
	apiServer: 'http://api.gametournament.nl:1338',
	database: {
		url: 'mongodb://localhost:27017/game-tournament'
	}
};