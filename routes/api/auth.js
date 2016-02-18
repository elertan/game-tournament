'use strict';

const express = require('express');
const router = express.Router();
const paramCheck = require('../../middleware/requiredPostParams');

const User = require('../../models/user');

router.post('/register', paramCheck(['email', 'password']), function (req, res) {
	const user = new User();
	user.email = req.body.email;
	
	user.save(function (err, result) {
		if (err) {
			res.json({ err: 'User could not be saved' });
			return;
		}
		
		res.json({ user: user });
	});
	res.end();
});

module.exports = router;