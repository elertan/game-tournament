'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const User = require('./user');

const schema = new Schema({
	content: String,
	senderId: {
		type: String,
		required: true
	},
	receiverId: {
		type: String,
		required: true
	},
	updated_at: Date,
	created_at: Date
});

schema.methods.getSender = function (cb) {
	User.findById(this.senderId, function (err, user) {
		cb(err, user);
	});
};

schema.methods.getReceiver = function (cb) {
	User.findById(this.receiverId, function (err, user) {
		cb(err, user);
	});
};

schema.pre('save', function (next) {
	if (!this.created_at) {
		this.created_at = new Date();
	}
	
	this.updated_at = new Date();
	next();
});

schema.pre('update', function (next) {
	this.updated_at = new Date();
	next();
});

module.exports = mongoose.model('Message', schema);