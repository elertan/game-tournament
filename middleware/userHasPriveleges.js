'use strict';

const config = require('../config');
const expressJwt = require('express-jwt');

module.exports = function (priveleges) {
	return function (req, res, next) {
		var ownedPriveleges = 0;
		for (var x = 0; x < priveleges.length; x++) {
			for (var i = 0; i < req.user._doc.priveleges.length; i++) {
				if (priveleges[x] == req.user._doc.priveleges[i]) {
					ownedPriveleges++;
					break;
				}
			}
		}
		if (ownedPriveleges == priveleges.length) {
			next();
			return;
		}
		res.json({ err: 'Unauthorized, you don\'t have the required priveleges' });
	};
};