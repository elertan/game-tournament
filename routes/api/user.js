'use strict';

const express = require('express');

const router = express.Router();
const paramCheck = require('../../middleware/requiredPostParams');
const isAuth = require('../../middleware/isAuth');
const userHasPriveleges = require('../../middleware/userHasPriveleges');
const config = require('../../config');

const User = require('../../models/user');

router.get('/info', isAuth(), function (req, res) {
	res.json(req.user._doc);
});

router.get('/by-email/:email', isAuth(), userHasPriveleges(['admin']), function (req, res) {
	User.findOne({ email: req.params.email }, function (err, user) {
		if (err) {
			res.json({ err: 'Error has occured' });
			return;
		}
		if (!user) {
			res.json({ err: 'User not found' });
			return;
		}
		res.json({ user: user });
	});
});

module.exports = router;