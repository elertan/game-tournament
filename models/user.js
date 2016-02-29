'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;

const schema = new Schema({
	email: String,
	password: String,
	firstname: String,
	lastname: String,
	priveleges: {
		type: String,
		default: 'user'
	},
	updated_at: Date,
	created_at: Date
});

schema.methods.validPassword = function (password, cb) {
	bcrypt.compare(password, this.password, function (err, same) {
		cb(same);
	});
};

// Test code
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

module.exports = mongoose.model('User', schema);