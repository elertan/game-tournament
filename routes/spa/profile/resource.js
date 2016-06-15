"use strict";

const request = require("request");

const express = require("express");
const router = express.Router();

const isAuth = require("../../../middleware/isAuth");

const User = require("../../../models/user");

// Get all
router.get("/", function (req, res) {
	res.status(401); // Not Implemented
});

// Read
router.get("/:studentNumber", isAuth, function (req, res) {
	User.findOne({ studentnumber: req.params.studentNumber }, function (err, user) {
		if (err) {
			res.status(500);
			return;
		}
		
		if (!user) {
			res.status(404);
			res.json({ err: "Student was not found" });
			return;
		}
		
		res.json({ user: user });
	});
});

router.post("/ChangeProfile", isAuth, function (req, res) {
	const form = req.body;
	
	if (req.user._doc.studentnumber != form.studentNumber) {
		res.status(401);
		return;
	}
	
	User.findOne({ studentnumber: form.studentNumber }, function (err, user) {
		if(err) {
			res.status(500);
			return;
		}
		
		if (!user) {
			res.status(404);
			res.json({ err: "Student was not found" });
			return;
		}
		
		user.hobby = form.hobby;
		user.save(function (err) {
			res.json({ msg: "Changed Profile" });
		});
	});
})


module.exports = router;