"use strict";

const express = require("express");
const router = express.Router();

const config = require("../../config");
const isAuth = require("../../middleware/isAuth");

router.use("/resource", require("./inbox/resource"));

// Add routes here
router.get("/", isAuth, function (req, res) {
	res.render("spa/inbox");
});

router.get("/show", isAuth, function (req, res) {
	res.render("spa/inbox/show");
});

router.get("/create", isAuth, function (req, res) {
	res.render("spa/inbox/create");
});

module.exports = router;