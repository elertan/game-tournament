'use strict';

const express = require('express');
const router = express.Router();

const mailer = require('../../../modules/mailer');

const User = require('../../../models/user');
const Group = require('../../../models/group');
const Message = require('../../../models/message');

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
		
			var group = new Group();
			group.name = req.body.name;
			group.description = req.body.description;
			group.owner = req.user._doc._id;
			group.users = [];
			group.invitations = [];

			for (var i = users.length - 1; i >= 0; i--) {
				var msg = new Message();
				msg.sender = req.user._doc._id;
				msg.receiver = users[i]._id;
				msg.title = 'Invitation to group ' + group.name;
				msg.content = 'You have been invited to ' + group.name + '.\n Click the link <a href="/#/groups/show/'+ group._id +'">here</a> to see the group';
				msg.save(function (err) {});
				group.invitations.push(users[i]._id);
			}

			group.save(function (err) {
				if (err) {
					res.status(500);
					return;
				}

				apiCall({
				method: 'post',
				apiUri: '/groups',
				jwt: req.user._doc.jwt,
				form: {
					name: req.body.name,
					description: req.body.description
				}
			}, function (err, data) {
				if (err || data.err) {
					res.status(500);
					res.end();
					return;
				}
				
				res.json({ success: true });
			});
		});
	});
});

// Read
router.get('/:id', isAuth, function (req, res) {
	Group.findOne({ _id: req.params.id }).populate('owner').populate('users').populate('joinRequests').populate('invitations').exec(function (err, group) {
		if (err) {
			res.status(500);
		}
		
		res.json(group);
	});
});

// Update
router.put('/:id', isAuth, function (req, res) {	
	Group.findOne({ _id: req.body._id }).populate('owner').populate('users').exec(function (err, group) {
		if (err) {
			res.status(500);
			return;
		}
		if (!group) {
			res.status(404);
			return;
		}
		
		group.owner = req.body.owner;
		group.description = req.body.description;
		group.name = req.body.name;
		group.users = req.body.users;
		group.joinRequests = req.body.joinRequests;
		group.invitations = req.body.invitations;
		
		// for (var i = 0; i < req.body.invitations.length; i++) 
		// {
		// 	var inv = req.body.invitations[i];
		// 	group.invitations.push(inv);
		// 	console.log(inv);
		// }
		
		group.save(function (err) {
			res.status(200);
			res.end();
		});
	});
});

// Delete
router.delete('/:id', isAuth, function (req, res) {
	var query = Group.findOne({ _id: req.params.id }).exec();
	query.then((err, group) => {
		if (err) {
			res.status(500);
			return;
		}
		if (!group) {
			res.status(404);
			return;
		}
		// Delete request user isn't the same as the group owner
		if (group.owner._id != req.user._doc._id) {
			res.status(401);
			return;
		}

	});
});

module.exports = router;