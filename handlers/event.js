const { readdirSync } = require("fs");

module.exports = (client, ipc) => {
	console.log("Loading events...");

	const events = readdirSync(`./events/`).filter((file) => file.endsWith(".js"));

	for (const file of events) {
		const eventName = file.split(".")[0];
		const eventFile = require(`../events/${file}`);

		console.log(` - ${file}`);

		client.on(eventName, eventFile.bind(null, client, ipc));
	}
};
