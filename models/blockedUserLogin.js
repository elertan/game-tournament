'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');
const Schema = mongoose.Schema;

const schema = new Schema({
	blockedIp: String,
	timesFailed: Number,
	blockedTillDate: Date,
	updated_at: Date,
	created_at: Date
});

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

module.exports = mongoose.model('blockedUserLogin', schema);