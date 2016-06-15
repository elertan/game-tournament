"use strict";

const express = require("express");
const router = express.Router();

const isAuth = require("../../middleware/isAuth");

router.use("/resource", require("./groups/resource"));

router.get("/", isAuth, function (req, res) {
	res.render("spa/groups/index");
});

router.get("/create", isAuth, function (req, res) {
	res.render("spa/groups/create");
});

router.get("/show", isAuth, function (req, res) {
	res.render("spa/groups/show");
});

router.get("/manage", isAuth, function (req, res) {
	res.render("spa/groups/manage");
});

router.get("/chat", isAuth, function (req, res) {
	res.render("spa/groups/chat");
});

module.exports = router;