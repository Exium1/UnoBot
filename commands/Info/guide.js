const Command = require("../../classes/command.js");
const Embed = require("../../classes/embed");
const { translate } = require("../../utils/functions");

class Guide extends Command {
	constructor(client) {
		super(client, {
			name: "guide",
			aliases: ["g", "handbook", "howto"],
			botPermissions: ["sendMessages", "embedLinks", "addReactions"],
			helpOptions: {
				helpArg: false,
				noArgs: false
			},
			category: __dirname // eslint-disable-line
		});
	}

	async run(client, msg, { prefix, args }) {
		var language = msg.guild.language;
		var clientUsername = client.user.username;

		if (args[0] == "start") {
			var startEmbed = new Embed()
				.setTitle(await translate("info.guide.start.title", language, { prefix }))
				.setThumbnail("logo")
				.setDescription(await translate("info.guide.start.desc", language, { prefix }));

			await msg.channel.createMessage({ embeds: [startEmbed] });
		} else if (args[0] == "play") {
			var playEmbed = new Embed()
				.setTitle(await translate("info.guide.play.title", language, { prefix }))
				.setThumbnail("logo")
				.setDescription(await translate("info.guide.play.desc", language, { prefix }));

			await msg.channel.createMessage({ embeds: [playEmbed] });
		} else if (args[0] == "commands") {
			var commandsEmbed = new Embed()
				.setTitle(await translate("info.guide.commands.title", language, { prefix }))
				.setThumbnail("logo")
				.setDescription(await translate("info.guide.commands.desc", language, { prefix }));

			await msg.channel.createMessage({ embeds: [commandsEmbed] });
		} else if (args[0] == "settings") {
			var settingsEmbed = new Embed()
				.setTitle(await translate("info.guide.settings.title", language, { prefix, clientUsername }))
				.setThumbnail("logo")
				.setDescription(await translate("info.guide.settings.desc", language, { prefix, clientUsername }));

			await msg.channel.createMessage({ embeds: [settingsEmbed] });
		} else if (args[0] == "options") {
			var optionsEmbed = new Embed()
				.setTitle(await translate("info.guide.options.title", language, { prefix, clientUsername }))
				.setThumbnail("logo")
				.setDescription(await translate("info.guide.options.desc", language, { prefix }));

			await msg.channel.createMessage({ embeds: [optionsEmbed] });
		} else {
			var guideEmbed = new Embed()
				.setTitle(await translate("info.guide.embed.title", language, { clientUsername }))
				.setThumbnail("logo")
				.setDescription(await translate("info.guide.embed.desc", language, { prefix }));

			await msg.channel.createMessage({ embeds: [guideEmbed] });
		}

		return;
	}
}

module.exports = Guide;
