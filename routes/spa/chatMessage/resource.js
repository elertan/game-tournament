 'use strict';

const co = require('co');

const express = require('express');
const router = express.Router();

const isAuth = require('../../../middleware/isAuth');
const requiredPostParams = require('../../../middleware/requiredPostParams');

const User = require('../../../models/user');
const ChatMessage = require('../../../models/chatMessage');
const Group = require('../../../models/group');

// Complex querying
router.post('/findAllByReceiver', isAuth, (req, res) => {
	co(function *() {
		// Make sure the query is an object
		if (typeof(req.body.id) != 'string') {
			res.status(400);
			res.end('Post data must be an object with an id string');
			return;
		}

		// Find all chat messages by receiver and fill in the sender key with its referenced User
		const messages = yield ChatMessage.find({ receiver: req.body.id }).populate('sender').exec();

		// Check if sender or receiver or group you are in is you (security)
		const groups = yield Group.find({});
		for (var i = 0; i < groups.length; i++) {
			var group = groups[i];
			// Is the receiver an group, if so check if the groups users/owner is in there
			if (group._id == req.body.id) {
				// Is the group owner the requester
				if (group.owner == req.user._doc._id) {
					res.json(messages);
					return;
				}
				for (var x = 0; x < group.users.length; x++) {
					var user = group.users[x];
					// Is one of the users the requester
					if (user == req.user._doc._id) {
						res.json(messages);
						return;		
					}
				}
			}

			// Is the receiver the user
			if (req.user._doc._id == req.body.id) {
				res.json(messages);
				return;
			}
		}

		res.status(401);
		res.end('Unauthorized');
	}).catch(err => {
		// Error occured
		if (err) {
			res.status(500);
			res.end('An error occured with the current query on our resource');
			return;
		}
	});
});

// Get all
router.get('/', isAuth, (req, res) => {
	co(function *() {
		const messages = yield ChatMessage.find().populate('sender').populate('receiver').exec();
		res.json(messages);
	}).catch(err => {
		res.status(500);
		res.end();
	});
});

// Read
router.get('/:id', function (req, res) {
	co(function *() {
		const message = yield ChatMessage.findById(req.params.id).populate('sender').populate('receiver').exec();
		if (!message) {
			res.status(404);
			res.end();
		}
		// DOES NOT WORK YET
		// User must be the receiver
		if (message.receiver._id != req.user._doc._id) {
			res.status(401);
			res.end();
			return;
		}
		res.json(message);
	}).catch(err => {
		console.log(err);
		res.status(500);
		res.end();
	});
});

// Create NOT IMPLEMENTED
// router.post('/', isAuth, requiredPostParams(['title', 'content', 'receiverId']), function (req, res) {
// 	var message = new ChatMessage();
// 	message.sender = req.user._doc._id;
// 	message.receiver = req.body.receiverId;
// 	message.title = req.body.title;
// 	message.content = req.body.content;

// 	message.save(function (err) {
// 		if (err) {
// 			res.status(500);
// 			res.end();
// 			return;
// 		}
// 		res.status(200);
// 		res.end();
// 	});
// });

// Delete
router.delete('/:id', isAuth, (req, res) => {
	ChatMessage.findById(req.params.id, (err, msg) => {
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
		// User must be the sender
		if (msg.sender != req.user._doc._id) {
			res.status(401);
			res.end();
			return;
		}
		msg.remove(err => {
			res.status(200);
			res.end();
		});
	});
});

module.exports = router;