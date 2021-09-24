const logger = require("../utils/logger.js");
const collections = require("../utils/collections");

module.exports = (client) => {
	logger.log("info", "Loading commands...");

	const { readdirSync } = require("fs");
	const cmdCategories = readdirSync("./commands/");

	cmdCategories.forEach(async (category) => {
		const commands = readdirSync("./commands/" + category + "/");

		for (let file of commands) {
			let commandFile = require(`../commands/${category}/${file}`);

			logger.log("info", ` - ${file}`);

			var command = new commandFile(client);

			if (command.name) collections.commands.set(command.name, command);
			else continue;

			// If there's an aliases key, read the aliases.
			if (command.aliases && Array.isArray(command.aliases)) command.aliases.forEach((alias) => collections.aliases.set(alias, command.name));
		}
	});

	return;
};
