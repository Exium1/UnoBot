const logger = require("../utils/logger.js");
const { readdirSync } = require("fs");

module.exports = (client, ipc) => {
	logger.log("info", "Loading events...");

	const events = readdirSync(`./events/`).filter((file) => file.endsWith(".js"));

	for (const file of events) {
		const eventName = file.split(".")[0];
		const eventFile = require(`../events/${file}`);

		logger.log("info", ` - ${file}`);

		client.on(eventName, eventFile.bind(null, client, ipc));
	}
};
