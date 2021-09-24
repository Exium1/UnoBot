const Base = require("eris-sharder").Base;
const logger = require("./utils/logger.js");
const { info } = require("./utils/collections");
const { defaultLanguage, topggToken, topggAutoPostStats } = require("./utils/config");
const { translate } = require("./utils/functions");

class Shard extends Base {
	constructor(bot) {
		super(bot);
	}

	async launch() {
		require("./helpers/extenders"); // Load class extenders
		require("./handlers/command.js")(this.bot); // Load commands to commands map
		require("./handlers/event.js")(this.bot, this.ipc); // Load events
		require("./handlers/language")(); // Load languages to languages map

		await require("./database/connect.js")(); // Connect to database

		info.set("clientUserID", this.bot.user.id);
		info.set("clientUsername", this.bot.user.username);

		this.bot.editStatus("online", { name: "Uno | u!help", type: 0 });

		const shardID = this.bot.shards.entries().next().value[1].id;
		const totalShards = this.bot.options.maxShards - 1;

		var clientUsername = this.bot.user.username;
		var guildCount = this.bot.guilds.size;
		var date = new Date(this.bot.startTime * 1000);

		if (shardID == totalShards) {
			logger.log(
				"info",
				await translate("general.readyMessage", defaultLanguage, { clientUsername, guildCount, date })
			);
			logger.log(" ");

			const { AutoPoster } = require("topgg-autoposter");

			if (topggToken && topggAutoPostStats) {
				const poster = AutoPoster(topggToken, this);

				poster.on("posted", (stats) => {
					logger.log("info", `Posted stats to Top.gg | ${stats.serverCount} servers`);
				});
			}

			var { updateUserRanks } = require("./utils/functions");

			setInterval(async () => {
				await updateUserRanks();
			}, 43200000);
		}
	}
}

module.exports = Shard;
