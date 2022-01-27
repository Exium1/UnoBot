const Command = require("../../classes/command.js");
const Embed = require("../../classes/embed.js");
const { translate } = require("../../utils/functions");

class Rules extends Command {
	constructor(client) {
		super(client, {
			name: "rules",
			botPermissions: ["sendMessages", "embedLinks"],
			helpOptions: {
				helpArg: true,
				noArgs: false
			},
			category: __dirname // eslint-disable-line
		});
	}

	async run(client, msg, data) {
		var rulesEmbed = new Embed()
			.setTitle(
				await translate("info.rules.embed.title", msg.guild.language, { clientUsername: client.user.username })
			)
			.setDescription(
				`**${await translate("info.rules.embed.desc", msg.guild.language, {
					clientUsername: client.user.username
				})}**`
			)
			.setThumbnail("logo");

		return await msg.channel.createMessage({ embeds: [rulesEmbed] });
	}
}

module.exports = Rules;
