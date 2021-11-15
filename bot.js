const Base = require("eris-sharder").Base;
const logger = require("./utils/logger.js");
const { info } = require("./utils/collections");
const { defaultLanguage } = require("./utils/config");
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

		const totalShards = this.bot.options.maxShards - 1;

		if (totalShards == this.bot.options.lastShardID) {
			var clientUsername = this.bot.user.username;
			var date = new Date(this.bot.startTime);

			logger.log("info", await translate("general.readyMessage", defaultLanguage, { clientUsername, date }));
			logger.log(" ");

			var { updateUserRanks } = require("./utils/functions");

			setInterval(async () => {
				await updateUserRanks();
			}, 43200000);
		}
	}
}

module.exports = Shard;
