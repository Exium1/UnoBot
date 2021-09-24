const mongoose = require("mongoose");
const configOptions = require("../../utils/config").options;
var defaultOptions = {};

Object.keys(configOptions).map((o) => {
	configOptions[o].default ? (defaultOptions[o] = true) : "";
});

const userSchema = new mongoose.Schema(
	{
		_id: String,
		username: {
			type: String,
			default: ""
		},
		discriminator: {
			type: String,
			default: ""
		},
		options: {
			type: Object,
			default: defaultOptions
		},
		stats: {
			type: Object,
			default: {}
		},
		rankedStats: {
			type: Object,
			default: {}
		}
	},
	{ minimize: false }
);

module.exports = mongoose.connection.model("Users", userSchema);
