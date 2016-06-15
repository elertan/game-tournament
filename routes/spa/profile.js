"use strict";

const express = require("express");
const router = express.Router();

const config = require("../../config");
const isAuth = require("../../middleware/isAuth");

router.use("/resource", require("./profile/resource"));

// Add routes here
router.get("/show", function (req, res) {
	res.render("spa/profile/show");
});

module.exports = router;