'use strict';

const express = require('express');
const router = express.Router();

const User = require('../../../models/user');

const isAuth = require('../../../middleware/isAuth');
const requiredPostParams = require('../../../middleware/requiredPostParams');
const apiCall = require('../../../modules/apiCall');

// Get all
router.get('/', function (req, res) {
	apiCall({
		method: 'get',
		apiUri: '/groups'
	}, function (err, data) {
		if (err) {
			res.status(500);
			return;
		}
		var i = 0;
		function next(index) {
			if (index == data.length) {
				finished();
				return;
			}
			User.findOne({ studentnumber: Number(data[index].owner.email.substring(0, 8)) }, function (err, user) {
				i++;
				data[index].owner = user;
				next(i);
			});
		}
		function finished() {
			res.json(data);
		}
		next(i);
	});
});

// Create
router.post('/', isAuth, requiredPostParams(['name', 'description']), function (req, res) {
	apiCall({
		method: 'post',
		apiUri: '/groups',
		jwt: req.user._doc.jwt,
		form: {
			name: req.body.name,
			description: req.body.description
		}
	}, function (err, data) {
		if (err) {
			res.status(500);
			res.end();
			return;
		}
		res.status(200); 
		res.json({ success: true });
	});
});

// Read
router.get('/:id', function (req, res) {
	res.status(200);
});

// Update
router.put('/:id', isAuth, function (req, res) {
	const form = req.body;
	res.status(200);
});

// Delete
router.delete('/:id', isAuth, function (req, res) {
	res.status(200);
});

module.exports = router;