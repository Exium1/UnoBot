const Sharder = require("eris-sharder").Master;
const { botToken, shardCount } = require("./utils/config.js");
const logger = require("./utils/logger");

const sharder = new Sharder(botToken, "/bot.js", {
	name: "UnoBot",
	stats: false,
	shards: shardCount,
	clientOptions: {
		messageLimit: 20,
		disableEvents: {
			GUILD_BAN_ADD: true,
			GUILD_BAN_REMOVE: true,
			GUILD_MEMBER_ADD: true,
			GUILD_MEMBER_REMOVE: true,
			GUILD_MEMBER_UPDATE: true,
			GUILD_ROLE_CREATE: true,
			GUILD_ROLE_DELETE: true,
			MESSAGE_DELETE: true,
			MESSAGE_DELETE_BULK: true,
			PRESENCE_UPDATE: true,
			TYPING_START: true,
			USER_UPDATE: true,
			VOICE_STATE_UPDATE: true
		},
		allowedMentions: {
			everyone: false,
			roles: false,
			users: true,
			repliedUser: true
		},
		guildSubscriptions: false,
		intents: ["guilds", "guildMessages", "guildMessageReactions", "directMessages", "directMessageReactions"]
	}
});

sharder.on("stats", (stats) => {
	logger.log("info", stats);
});
