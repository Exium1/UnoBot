const Sharder = require("eris-sharder").Master;
const { botToken, shardCount, topggToken, topggAutoPostStats } = require("./utils/config.js");
const logger = require("./node_modules/eris-sharder/src/utils/logger.js");

const sharder = new Sharder(botToken, "/bot.js", {
	name: "UnoBot",
	stats: true,
	statsInterval: 1800000,
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

sharder.on("stats", async (stats) => {
	var statsString = `Running ${stats.guilds} guilds, ${stats.users} users, and ${shardCount} shards.`;

	logger.info("Cluster Manager", statsString);

	if (topggToken && topggAutoPostStats) {
		const Topgg = require("@top-gg/sdk");
		const topggApi = new Topgg.Api(topggToken);

		await topggApi.postStats({
			serverCount: stats.guilds,
			shardCount: shardCount
		});

		logger.info("Cluster Manager", `Posted stats to Top.gg.`);
	}
});
