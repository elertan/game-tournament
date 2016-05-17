'use strict';

const config = require('../config');
const expressJwt = require('express-jwt');

module.exports = function (req, res, next) {
	try {
		expressJwt({ secret: config.secret })(req, res, function (ex) {
			if (!ex) {
				next();
				return;
			}
			if (ex.message == 'jwt expired') {
				res.status(401);
				res.json({ err: 'Jwt Expired', code: "localStorage.removeItem('user'); localStorage.removeItem('jwt');" });
			} else {
				res.status(401);
				res.json({ err: 'Unauthorized' });
			}
		});
	} catch (ex) {
		res.status(401);
		res.json({ err: 'Unauthorized' });
	}
};