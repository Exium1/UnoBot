const Command = require("../../classes/command.js");
const Embed = require("../../classes/embed.js");
const { translate } = require("../../utils/functions");
const { botInviteURL } = require("../../utils/config");

class Invite extends Command {
	constructor(client) {
		super(client, {
			name: "invite",
			botPermissions: ["sendMessages", "embedLinks"],
			helpOptions: {
				helpArg: false,
				noArgs: false
			},
			category: __dirname // eslint-disable-line
		});
	}

	async run(client, msg, data) {
		var inviteEmbed = new Embed()
			.setTitle(
				await translate("other.invite.embed.title", msg.guild.language, {
					clientUsername: client.user.username
				})
			)
			.setDescription(
				`**${await translate("other.invite.embed.desc", msg.guild.language, {
					botInviteURL,
					clientUsername: client.user.username
				})}**`
			)
			.setThumbnail("logo");

		return await msg.channel.createMessage({ embeds: [inviteEmbed] });
	}
}

module.exports = Invite;
