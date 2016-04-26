 'use strict';

const express = require('express');
const router = express.Router();

const isAuth = require('../../../middleware/isAuth');
const requiredPostParams = require('../../../middleware/requiredPostParams');

const User = require('../../../models/user');
const Message = require('../../../models/message');

// Get all
router.get('/', isAuth, function (req, res) {
	Message.find({ receiver: req.user._doc._id }).populate('sender').populate('receiver').exec(function (err, messages) {
		if (err) {
			res.status(500);
			res.end();
			return;
		}
		res.json(messages);
	});
});

// Read
router.get('/:id', isAuth, function (req, res) {
	Message.findById(req.params.id).populate('sender').populate('receiver').exec(function (err, message) {
		if (err) {
			res.status(500);
			res.end();
			return;
		}
		if (!message) {
			res.status(404);
			res.end();
			return;
		}
		// User must be the receiver
		if (message.receiver._id != req.user._doc._id) {
			res.status(401);
			res.end();
			return;
		}
		res.json(message);
	});
});

// Create
router.post('/', isAuth, requiredPostParams(['title', 'content', 'receiverId']), function (req, res) {
	var message = new Message();
	message.sender = req.user._doc._id;
	message.receiver = req.body.receiverId;
	message.title = req.body.title;
	message.content = req.body.content;

	message.save(function (err) {
		if (err) {
			res.status(500);
			res.end();
			return;
		}
		res.status(200);
		res.end();
	});
});

// Delete
router.delete('/:id', isAuth, function (req, res) {
	Message.findById(req.params.id, function (err, msg) {
		if (err) {
			res.status(500);
			res.end();
			return;
		}
		if (!msg) {
			res.status(404);
			res.end();
			return;
		}
		// User must be the receiver
		if (msg.receiver != req.user._doc._id) {
			res.status(401);
			res.end();
			return;
		}
		msg.remove(function (err) {
			res.status(200);
			res.end();
		});
	});
});

module.exports = router;