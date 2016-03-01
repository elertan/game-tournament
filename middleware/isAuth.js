'use strict';

const config = require('../config');
const expressJwt = require('express-jwt');

module.exports = function () {
	return expressJwt({ secret: config.secret });
};