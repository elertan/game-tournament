'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');
const Schema = mongoose.Schema;

const schema = new Schema({
	email: String,
	password: String,
	priveleges: [String],
	updated_at: Date,
	created_at: Date
});

schema.methods.validPassword = function (password, cb) {
	bcrypt.compare(password, this.password, function (err, same) {
		cb(same);
	});
};

schema.pre('save', function (next) {
	if (!this.created_at) {
		this.created_at = new Date();
		this.priveleges = ['user']; 
	}
	
	this.updated_at = new Date();
	next();
});

schema.pre('update', function (next) {
	this.updated_at = new Date();
	next();
});

module.exports = mongoose.model('User', schema);