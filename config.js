'use strict';

module.exports = {
	port: process.env.PORT || 1337,
	site: 'http://www.gametournament.nl:1337',
	secret: 'patrickvonkzijnpauperprochat',
	auth: {
		expirationTime: "9999d" // 7 Days
	},
	apiServer: 'http://api.gametournament.nl:1338',
	database: {
		url: 'mongodb://localhost:27017/game-tournament'
	}
};