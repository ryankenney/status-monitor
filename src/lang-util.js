var LangUtil = {

	// TODO [rkenney]: Remove if unused when JS6 employed
	forEachProperty: function(object, handler) {
		for (var property in object) {
			// Skip injected prototype properties
			if (!object.hasOwnProperty(property)) { continue; }
			handler(property);
		}
	},

	// TODO [rkenney]: Figure out how to do this correctly when I have internet.
	getPropertyCount: function(object) {
		var count = 0;
		LangUtil.forEachProperty(object, () => {
			count++;
		});
		return count;
	}

};

module.exports = LangUtil;
