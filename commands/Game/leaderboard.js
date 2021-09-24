const Command = require("../../classes/command.js");
const Embed = require("../../classes/embed.js");
var { translate } = require("../../utils/functions");
const guildModel = require("../../database/models/guild");
const userModel = require("../../database/models/user");

class Leaderboard extends Command {
	constructor(client) {
		super(client, {
			name: "leaderboard",
			aliases: ["lb", "leaderboards"],
			botPermissions: ["sendMessages", "embedLinks", "addReactions"],
			helpOptions: {
				helpArg: true,
				noArgs: false
			},
			category: __dirname // eslint-disable-line
		});
	}

	async run(client, msg, { guildData, prefix }) {
		var language = msg.guild.language;

		guildData = guildData || (await guildModel.findById(msg.guildID));

		if (!guildData) {
			guildData = new guildModel({
				_id: msg.guildID,
				name: msg.guild.name,
				ownerID: msg.guild.ownerID
			});

			await guildData.save();
		}

		var memberStats = guildData.game.stats;

		if (Object.keys(memberStats).length == 0) {
			return msg.error(await translate("game.leaderboard.error.noStats", language, { prefix }));
		}

		var playerArray = Object.keys(memberStats).sort((a, b) => (memberStats[a].rank > memberStats[b].rank ? 1 : -1));

		var leaderboardEmbed = new Embed()
			.setTitle(await translate("game.leaderboard.embed.title", language, { serverName: msg.guild.name }))
			.setDescription(await translate("game.leaderboard.embed.desc", language))
			.setThumbnail("logo");

		for (var i = 0; 5 > i && i < playerArray.length; i++) {
			var playerData = await userModel.findById(playerArray[i]);

			if (!playerData) {
				playerData = {
					_id: "000",
					username: "Unknown",
					discriminator: "0000",
					options: {}
				};
			}

			if (playerData.options.HideStats) {
				playerData = {
					_id: "000",
					username: "Hidden",
					discriminator: "0000",
					options: {}
				};
			}

			leaderboardEmbed.addField(
				`${await translate("game.general.rank", language)} ${i + 1}`,
				`**${playerData.username}${
					playerData.options.HideLeaderboardTag ? "" : `#${playerData.discriminator}`
				}**\n${memberStats[playerArray[i]].totalWins} ${(
					await translate("game.general.totalWins", language)
				).toLowerCase()}.`
			);
		}

		await msg.channel.createMessage(leaderboardEmbed);

		return msg.react("success");
	}
}

module.exports = Leaderboard;
