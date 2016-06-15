"use strict";

const co = require("co");
const fs = require("fs");
const path = require("path");

const ge = {};
ge.extensions = [];

module.exports = new Promise((resolve, reject) => {
	var p = path.resolve("./game-extensions");
	const files = fs.readdirSync(p);
	files.forEach(file => {
		ge.extensions.push(require(path.join(p, file)));
		console.log(`GameExtension Loaded: ${file}`);
	});
	resolve(ge);
});