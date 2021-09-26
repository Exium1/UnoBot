const Command = require("../../classes/command.js");
const Embed = require("../../classes/embed");
const { translate } = require("../../utils/functions");
const { ownerID } = require("../../utils/config");
const { msgReactions, commands, aliases } = require("../../utils/collections");

class Help extends Command {
	constructor(client) {
		super(client, {
			name: "help",
			aliases: ["h"],
			botPermissions: ["sendMessages", "embedLinks", "addReactions"],
			helpOptions: {
				helpArg: false,
				noArgs: false
			},
			category: __dirname // eslint-disable-line
		});
	}

	async run(client, msg, data) {
		var language = msg.guild.language;
		var { prefix, args } = data;
		var command;

		if (args[0]) {
			command = await commands.get(args[0]);
			if (!command) command = await commands.get(aliases.get(args[0]));

			if (command && command.ownerOnly && msg.author.id !== ownerID) command = null;
		}

		if (command) {
			return msg.channel.createMessage(await command.helpEmbed(prefix, language));
		} else {
			var helpEmbed = new Embed()
				.setTitle(
					await translate("info.help.embed.title", language, {
						clientUsername: client.user.username
					})
				)
				.setThumbnail("logo")
				.setDescription(
					await translate("info.help.embed.desc", language, {
						clientUsername: client.user.username,
						prefix
					})
				)
				.setFooter(await translate("info.help.embed.footer", language));

			var helpMessage = await msg.channel.createMessage(helpEmbed);

			await helpMessage.addReaction("❗");
			await helpMessage.addReaction("📕");
			await helpMessage.addReaction("📜");

			msgReactions.set(helpMessage.id, {
				action: "helpReaction",
				msg: helpMessage,
				data: data
			});

			setTimeout(async () => {
				var helpReaction = await msgReactions.get(helpMessage.id);

				if (helpReaction) {
					await helpMessage.removeReactions();
					//msgReactions.delete(helpMessage.id);
				}
			}, 15000);
		}

		await msg.react("success");

		return;
	}
}

module.exports = Help;
