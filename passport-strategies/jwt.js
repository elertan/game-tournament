'use strict';

const config = require('../config');
const User = require('../models/user');

const passportJwt = require('passport-jwt');
const Strategy = passportJwt.Strategy;
const Extract = passportJwt.ExtractJwt;

const options = {
	secretOrKey: config.secret,
	issuer: config.site,
	audience: config.site,
	jwtFromRequest: Extract.fromAuthHeader()
};

module.exports = new Strategy(options, function (payload, done) {
	User.findOne({ id: payload.sub }, function (err, user) {
		if (err) {
			return done(err, false);
		}
		if (user) {
			done(null, user);
		} else {
			done(null, false);
		}
	});
});