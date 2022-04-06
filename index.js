const { isMaster } = require("cluster");
const { Fleet } = require("eris-fleet");
const path = require("path");
const { inspect } = require("util");
const { botToken, shardCount, topggToken, topggAutoPostStats } = require("./utils/config.js");

const options = {
	path: path.join(__dirname, "./bot.js"), // eslint-disable-line
	token: botToken,
	shards: shardCount,
	statsInterval: 18e5, // 1800000 ms - 30 mins
	clientOptions: {
		messageLimit: 20,
		defaultImageFormat: "png",
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
};

const Admiral = new Fleet(options);

if (isMaster) {
	Admiral.on("log", (m) => console.log(m));
	Admiral.on("debug", (m) => console.debug(m));
	Admiral.on("warn", (m) => console.warn(m));
	Admiral.on("error", (m) => console.error(inspect(m)));
	Admiral.on("stats", async (stats) => {
		var statsString = `Running ${stats.guilds} guilds, ${stats.members} members, and ${shardCount} shards.`;

		console.log("Cluster Manager - ", statsString);

		if (topggToken && topggAutoPostStats) {
			const Topgg = require("@top-gg/sdk");
			const topggApi = new Topgg.Api(topggToken);

			await topggApi.postStats({
				serverCount: stats.guilds,
				shardCount: shardCount
			});

			console.log(`Posted stats to Top.gg.`);
		}
	});

	var { updateUserRanks } = require("./utils/functions");

	setInterval(async () => {
		await updateUserRanks();
	}, 43200000);
}
