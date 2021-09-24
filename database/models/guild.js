const mongoose = require("mongoose");
const { prefix, defaultLanguage } = require("../../utils/config");

const guildSchema = new mongoose.Schema(
	{
		_id: String,
		prefix: {
			type: String,
			default: prefix
		},
		ownerID: String,
		language: {
			type: String,
			default: defaultLanguage
		},
		game: {
			type: Object,
			default: {
				defaultGameSettings: {},
				stats: {}
			}
		},
		settings: {
			type: Object,
			default: {
				commands: {}
			}
		}
	},
	{ minimize: false }
);

module.exports = mongoose.connection.model("Guild", guildSchema);
