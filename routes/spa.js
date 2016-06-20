"use strict";

const express = require("express");
const router = express.Router();

router.use("/auth", require("./spa/auth"));
router.use("/groups", require("./spa/groups"));
router.use("/profile", require("./spa/profile.js"));
router.use("/users", require("./spa/users"));
router.use("/inbox", require("./spa/inbox"));
router.use("/chatMessage", require("./spa/chatMessage"));
router.use("/mygames", require("./spa/mygames"));
router.use("/games", require("./spa/games"));

router.get("/index", function (req, res) {
	res.render("spa/index");
});

router.get("/about", function (req, res) {
	res.render("spa/about");
});

module.exports = router;