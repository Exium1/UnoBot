const Command = require("../../classes/command.js");
const Embed = require("../../classes/embed.js");
const { translate } = require("../../utils/functions");

class Shards extends Command {
	constructor(client) {
		super(client, {
			name: "shards",
			botPermissions: ["sendMessages", "embedLinks"],
			helpOptions: {
				helpArg: true,
				noArgs: false
			},
			ownerOnly: true,
			category: __dirname // eslint-disable-line
		});
	}

	async run(client, msg, data) {
		var language = msg.guild.language;

		var shardsEmbed = new Embed()
			.setTitle(await translate("admin.shards.embed.title", language, { clientUsername: client.user.username }))
			.setDescription("");

		await client.shards.forEach((s) => {
			shardsEmbed.embed.description += `**Shard ${s.id}:** \`${
				s.status[0].toUpperCase() + s.status.slice(1)
			}\` | \`${s.latency}ms\`\n`;
		});

		return await msg.channel.createMessage(shardsEmbed);
	}
}

module.exports = Shards;
