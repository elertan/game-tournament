'use strict';

module.exports = {
	port: process.env.PORT || 1337,
	site: 'localhost:1337',
	secret: 'patrickvonkzijnpauperprochat',
	auth: {
		expirationTime: "7d" // 7 Days
	},
	database: {
		url: 'mongodb://localhost:27017/game-tournament'
	}
};