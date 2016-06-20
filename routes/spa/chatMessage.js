"use strict";

const express = require("express");
const router = express.Router();

const config = require("../../config");

router.use("/resource", require("./chatMessage/resource"));

module.exports = router;