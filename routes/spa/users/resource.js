"use strict";

const express = require("express");
const router = express.Router();

const User = require("../../../models/user");

const isAuth = require("../../../middleware/isAuth");
const requiredPostParams = require("../../../middleware/requiredPostParams");
const apiCall = require("../../../modules/apiCall");

router.get("/", isAuth, function (req, res) {
	User.find({}, function (err, users) {
		if (err || !users) {
			res.status(500);
			res.end();
		}
		for (var i = 0; i < users.length; i++) {
			delete users[i]._doc.jwt;
		}
		res.json(users);
	});
});

module.exports = router;