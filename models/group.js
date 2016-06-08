'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
	owner: { type: Schema.Types.ObjectId, ref: 'User' },
	invitations: [{ type: Schema.Types.ObjectId, ref: 'User' }],//	invitations: [{ invitationSend: Boolean, user: { type: Schema.Types.ObjectId, ref: 'User' } }],
	joinRequests: [{ type: Schema.Types.ObjectId, ref: 'User' }],
	users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
	name: String,
	description: String,
	created_at: Date,
	updated_at: Date
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

module.exports = mongoose.model('Group', schema);