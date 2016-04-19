'use strict';

const express = require('express');
const router = express.Router();

const User = require('../../../models/user');
const Group = require('../../../models/group');

const isAuth = require('../../../middleware/isAuth');
const requiredPostParams = require('../../../middleware/requiredPostParams');
const apiCall = require('../../../modules/apiCall');


// Get all
router.get('/', isAuth, function (req, res) {
	Group.find({}).populate('owner').populate('users').exec(function (err, groups) {
		if (err) {
			res.status(500);
		}
		res.json(groups);
	});
});

// Create
router.post('/', isAuth, requiredPostParams(['name', 'description', 'userIds']), function (req, res) {
	User.find({ _id: {
		$in: req.body.userIds
	}}, function (err, users) {
		if (err) {
			res.status(500);
			return;
		}

		var emails = [];
		for (var i = 0; i < users.length; i++) {
			emails.push(users[i].studentnumber + '@mydavinci.nl');
		}

		apiCall({
			method: 'post',
			apiUri: '/groups',
			jwt: req.user._doc.jwt,
			form: {
				name: req.body.name,
				description: req.body.description,
				userEmails: emails
			}
		}, function (err, data) {
			if (err || data.err) {
				res.status(500);
				res.end();
				return;
			}

			var group = new Group();
			group.name = req.body.name;
			group.description = req.body.description;
			group.owner = req.user._doc._id;
			group.users = req.body.userIds;
			group.save(function (err) {
				if (err) {
					res.status(500);
					return;
				}
				res.json({ success: true });
			});
		});
	});
});

// Read
router.get('/:id', isAuth, function (req, res) {
	Group.findOne({ _id: req.params.id }, function (err, group) {
		if (err) {
			res.status(500);
			res.end();
		}
		res.json(group);
	});
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