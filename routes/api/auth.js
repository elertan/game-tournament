'use strict';

const express = require('express');
const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');

const router = express.Router();
const paramCheck = require('../../middleware/requiredPostParams');
const config = require('../../config');

const User = require('../../models/user');

router.post('/login', paramCheck(['email', 'password']), function (req, res) {
	User.findOne({ email: req.body.email }, function (err, user) {
		if (!user) {
			res.json({ err: 'User not found' });
			return;
		}
		user.validPassword(req.body.password, function (isValid) {
			if (!isValid) {
				res.json({ err: 'Invalid password' });
				return;
			}
			const token = jwt.sign(user, config.secret, { expiresIn: config.auth.expirationTime.toString() });
			res.json({
				token: token
			});
		});
	});
});

router.post('/register', paramCheck(['email', 'password']), function (req, res) {
	// Check pre-existing user
	User.findOne({ email: req.body.email }, function (err, foundUser) {
		if (foundUser) {
			res.json({ err: 'User with given email already exists' });
			return;
		}
		
		bcrypt.genSalt(10, function (err, salt) {
			bcrypt.hash(req.body.password, salt, null, function (err, hash) {
				const user = new User();
				user.email = req.body.email;
				user.password = hash;
				
				user.save(function (err, result) {
					if (err) {
						res.json({ err: 'User could not be saved' });
						return;
					}
					
					res.json({ user: user });
				});
			});
		});
	});
});

router.post('/changePassword', paramCheck(['email', 'oldpassword', 'password']), function (req, res) {
	User.findOne({ email: req.body.email }, function (err, user) {
		if (err) {
			return;
		}
		if (!user) {
			res.json({ err: 'User not found' });
			return;
		}

		if (user.password != req.body.oldpassword) {
			res.json({ err: 'Invalid password' });
			return;
		}

		bcrypt.genSalt(10, function (err, salt) {
			bcrypt.hash(req.body.password, salt, null, function (err, hash) {
				user.password = hash;
				user.save();
				res.json({ success: true, password: hash });
			});
		});
	});
});

module.exports = router;