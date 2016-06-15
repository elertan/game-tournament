"use strict";

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const User = require("./user");

const schema = new Schema({
	sender: {
		type: Schema.Types.ObjectId,
		ref: "User"
	},
	receiver: {
		type: Schema.Types.ObjectId,
		ref: "User"
	},
	title: String,
	content: String,
	updated_at: Date,
	created_at: Date
});

schema.pre("save", function (next) {
	if (!this.created_at) {
		this.created_at = new Date();
	}
	
	this.updated_at = new Date();
	next();
});

schema.pre("update", function (next) {
	this.updated_at = new Date();
	next();
});

module.exports = mongoose.model("Message", schema);