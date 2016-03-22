'use strict';

const express = require('express');
const router = express.Router();

const isAuth = require('../../middleware/isAuth');
const requiredPostParams = require('../../middleware/requiredPostParams');

const Group = require('../../models/group');
const User = require('../../models/user');

// Get all
router.get('/', function (req, res) {
	Group.find({}, function (err, groups) {
		if (err) {
			res.status(500);
			return;
		}
		res.json(groups);
	});
});

// Create
router.post('/', isAuth, requiredPostParams(['users', 'name', 'description']), function (req, res) {
	const group = new Group(req.body);
	group.save(function (err) {
		if (err) {
			res.status(500);
			return;
		}
		res.status(200);
	});
});

// Read
router.get('/:id', function (req, res) {
	Group.findOne({ _id: req.params.id }, function (err, group) {
		if (err) {
			res.status(500);
			return;
		}
		res.json(group);
	});
});

// Update
router.put('/:id', isAuth, function (req, res) {
	Group.findOne({ _id: req.params.id }, function (err, group) {
		if (err) {
			res.status(500);
			return;
		}
		group.update(req.body, function (err) {
			res.status(200);
		});
	});
});

// Delete
router.delete('/:id', isAuth, function (req, res) {
	// Do logic to check group is owned by user
	Group.findOne({ _id: req.params.id }, function (err, group) {
		group.delete(function (err) {
			res.status(200);
		});
	});
});

module.exports = router;