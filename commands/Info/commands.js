const Command = require("../../classes/command.js");
const Embed = require("../../classes/embed");
const { translate } = require("../../utils/functions");
const { readdirSync } = require("fs");
const { ownerID } = require("../../utils/config");
var { commands, aliases } = require("../../utils/collections");

class Commands extends Command {
	constructor(client) {
		super(client, {
			name: "commands",
			aliases: ["list", "cmds"],
			botPermissions: ["sendMessages", "embedLinks"],
			helpOptions: {
				helpArg: false,
				noArgs: false
			},
			category: __dirname // eslint-disable-line
		});
	}

	async run(client, msg, { args, prefix }) {
		var language = msg.guild.language;
		var command;

		if (args[0]) {
			command = await commands.get(args[0]);
			if (!command) command = await commands.get(aliases.get(args[0]));

			if (command.ownerOnly && msg.author.id !== ownerID) command = null;
		}

		if (command) {
			return msg.channel.createMessage(await command.helpEmbed(prefix, language));
		} else {
			var commandCategories = ["Game", "Config", "Info", "Other"];
			var commandsEmbed = new Embed()
				.setTitle(
					await translate("info.commands.embed.title", language, { clientUsername: client.user.username })
				)
				.setThumbnail("logo")
				.setFooter(await translate("info.commands.embed.footer", language, { prefix }));

			for (var i = 0; i < commandCategories.length; i++) {
				var category = commandCategories[i];
				var commandString = "";
				const commands = readdirSync("./commands/" + category + "/");

				if (commands.length > 0) {
					for (let file of commands) {
						var commandName = file.split(".")[0];

						commandString =
							commandString +
							`\`${commandName}\` - ${await translate(
								`${category.toLowerCase()}.${commandName.toLowerCase()}.info.desc`,
								language,
								{ clientUsername: client.user.username }
							)}\n`;
						command = null;
					}

					commandsEmbed.addField(await translate(category.toLowerCase(), language), commandString);
				}
			}

			await msg.channel.createMessage(commandsEmbed);
		}

		await msg.react("success");

		return;
	}
}

module.exports = Commands;
