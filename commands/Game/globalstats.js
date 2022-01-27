const Command = require("../../classes/command.js");
const Embed = require("../../classes/embed.js");
var { translate, getUserData } = require("../../utils/functions");
const userModel = require("../../database/models/user");

class GlobalStats extends Command {
	constructor(client) {
		super(client, {
			name: "globalstats",
			aliases: ["gstats", "globals"],
			botPermissions: ["sendMessages", "embedLinks", "addReactions"],
			helpOptions: {
				helpArg: true,
				noArgs: false
			},
			category: __dirname // eslint-disable-line
		});
	}

	async run(client, msg) {
		var language = msg.guild.language;
		var player;

		if (msg.mentions.length > 0) player = msg.mentions[0];
		else player = msg.author;

		var playerData = await getUserData(player.id);

		if (Object.keys(playerData.stats).length == 0) {
			return await msg.error(
				await translate("game.globalstats.error.noStats", language, { username: player.username }),
				{ bold: false }
			);
		} else {
			await playerData.updateOne({ username: player.username }, { discriminator: player.discriminator });
		}

		var playerStats = playerData.stats;

		if (playerData.options.HideStats) {
			if (player.id == msg.author.id) {
				await msg.channel.embedReply(await translate("game.globalstats.dmStats", language));
			} else {
				return await msg.error(
					await translate("game.globalstats.error.hiddenStats", language, { username: player.username }),
					{ bold: false }
				);
			}
		}

		var gLeaderboardEmbed = new Embed()
			.setTitle(
				await translate("game.globalstats.embed.title", language, {
					username: player.username
				})
			)
			.setThumbnail(await player.dynamicAvatarURL())
			.addField(
				`${await translate("game.general.rank", language)}:`,
				await translate("game.globalstats.embed.rank", language, {
					rank: playerStats.rank == undefined ? "Unknown" : playerStats.rank,
					memberCount: await userModel.countDocuments()
				})
			)
			.addField(
				`${await translate("game.general.winPercentage", language)}:`,
				await translate("game.globalstats.embed.winPercentage", language, {
					winPercentage: playerStats.winPercentage == undefined ? "Unknown" : playerStats.winPercentage
				})
			)
			.addField(
				`${await translate("game.general.totalGames", language)}:`,
				await translate("game.globalstats.embed.totalGames", language, {
					totalGames: playerStats.totalGames == undefined ? "Unknown" : playerStats.totalGames
				})
			)
			.addField(
				`${await translate("game.general.totalWins", language)}:`,
				await translate("game.globalstats.embed.totalWins", language, {
					totalWins: playerStats.totalWins == undefined ? "Unknown" : playerStats.totalWins
				})
			)
			.addField(
				`${await translate("game.general.totalLosses", language)}:`,
				await translate("game.globalstats.embed.totalLosses", language, {
					totalLosses: playerStats.totalLosses == undefined ? "Unknown" : playerStats.totalLosses
				})
			);

		if (playerData.options.HideStats && msg.author.id == player.id) {
			var recipientDMChannel = await player.getDMChannel();

			if (recipientDMChannel) {
				await recipientDMChannel.createMessage({ embeds: [gLeaderboardEmbed] });
			} else {
				throw await translate("game.general.error.DMChannel", language, {
					displayName: msg.member.nick || msg.author.username
				});
			}
		} else await msg.channel.createMessage({ embeds: [gLeaderboardEmbed] });

		return msg.react("success");
	}
}

module.exports = GlobalStats;
