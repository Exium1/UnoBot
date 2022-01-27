const Command = require("../../classes/command.js");
const Embed = require("../../classes/embed.js");
const { translate } = require("../../utils/functions");
const { topggVoteURL } = require("../../utils/config");

class Vote extends Command {
	constructor(client) {
		super(client, {
			name: "vote",
			botPermissions: ["sendMessages", "embedLinks"],
			helpOptions: {
				helpArg: true,
				noArgs: false
			},
			category: __dirname // eslint-disable-line
		});
	}

	async run(client, msg, data) {
		var voteEmbed = new Embed()
			.setTitle(
				await translate("other.vote.embed.title", msg.guild.language, { clientUsername: client.user.username })
			)
			.setDescription(
				`**${await translate("other.vote.embed.desc", msg.guild.language, {
					voteURL: topggVoteURL,
					clientUsername: client.user.username
				})}**`
			)
			.setThumbnail("logo");

		return await msg.channel.createMessage({ embeds: [voteEmbed] });
	}
}

module.exports = Vote;
