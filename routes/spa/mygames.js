"use strict";

const co = require("co");

const express = require("express");
const router = express.Router();

const isAuth = require("../../middleware/isAuth");
var ge = {};
require("../../modules/game-extensions").then(gExtensions => {
	ge = gExtensions;
});

router.get("/", isAuth, (req, res) => {
	co(function *() {
		res.render("spa/mygames/index", {
			ge: ge
		});
	}).catch(err => {

	});
});

module.exports = router;
