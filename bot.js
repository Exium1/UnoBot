const { BaseServiceWorker } = require("eris-fleet");
const { info } = require("./utils/collections");
const { defaultLanguage } = require("./utils/config");
const { translate } = require("./utils/functions");

module.exports = class ServiceWorker extends BaseServiceWorker {
	constructor(setup) {
		super(setup);

		this.init(setup);
	}

	async init(setup) {
		console.log(`Launching Shard #${this.workerID}...`);

		require("./helpers/extenders"); // Load class extenders
		require("./handlers/command.js")(setup.bot); // Load commands to commands map
		require("./handlers/event.js")(setup.bot, this.ipc); // Load events
		require("./handlers/language")(); // Load languages to languages map

		await require("./database/connect.js")(); // Connect to database

		info.set("clientUserID", setup.bot.user.id);
		info.set("clientUsername", setup.bot.user.username);

		setup.bot.editStatus("online", { name: "Uno | u!help", type: 0 });

		const totalShards = setup.bot.options.maxShards - 1;

		if (totalShards == setup.bot.options.lastShardID) {
			var clientUsername = setup.bot.user.username;
			var date = new Date(setup.bot.startTime);

			console.log(await translate("general.readyMessage", defaultLanguage, { clientUsername, date }));
		}
	}
};
