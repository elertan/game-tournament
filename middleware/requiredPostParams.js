module.exports = function (params) {
	return function (req, res, next) {
		var success = true;	
		for (var i = 0; i < params.length; i++) {
			if (!req.body[params[i]]) {
				res.json({ err: 'Missing Parameter: ' + params[i] });
				success = false;
			}	
		}		
		if (success) {
			next();
		}
	};
};