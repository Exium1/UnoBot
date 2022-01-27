const Command = require("../../classes/command.js");
const Embed = require("../../classes/embed.js");
var { translate, getGuildData, getUserData } = require("../../utils/functions");

class Stats extends Command {
	constructor(client) {
		super(client, {
			name: "stats",
			aliases: [],
			botPermissions: ["sendMessages", "embedLinks", "addReactions"],
			helpOptions: {
				helpArg: true,
				noArgs: false
			},
			category: __dirname // eslint-disable-line
		});
	}

	async run(client, msg, { guildData }) {
		var language = msg.guild.language;
		var player;

		if (msg.mentions.length > 0) player = msg.mentions[0];
		else player = msg.author;

		guildData = guildData || (await getGuildData(msg.guildID));

		if (!guildData.game.stats[player.id]) {
			return await msg.error(
				await translate("game.stats.error.noStats", language, { username: player.username }),
				{ bold: false }
			);
		}

		var playerStats = guildData.game.stats[player.id];
		var playerOptions = await getUserData(player.id, "options");

		if (playerOptions.HideStats) {
			if (player.id == msg.author.id) {
				await msg.channel.embedReply(await translate("game.stats.dmStats", language));
			} else {
				return await msg.error(
					await translate("game.stats.error.hiddenStats", language, { username: player.username }),
					{ bold: false }
				);
			}
		}

		var leaderboardEmbed = new Embed()
			.setTitle(
				await translate("game.stats.embed.title", language, {
					username: msg.author.username,
					serverName: msg.guild.name
				})
			)
			.setThumbnail(await player.dynamicAvatarURL())
			.addField(
				`${await translate("game.general.rank", language)}:`,
				await translate("game.stats.embed.rank", language, {
					rank: playerStats.rank == undefined ? "Unknown" : playerStats.rank,
					memberCount: Object.keys(guildData.game.stats).length
				})
			)
			.addField(
				`${await translate("game.general.winPercentage", language)}:`,
				await translate("game.stats.embed.winPercentage", language, {
					winPercentage: playerStats.winPercentage == undefined ? "Unknown" : playerStats.winPercentage
				})
			)
			.addField(
				`${await translate("game.general.totalGames", language)}:`,
				await translate("game.stats.embed.totalGames", language, {
					totalGames: playerStats.totalGames == undefined ? "Unknown" : playerStats.totalGames
				})
			)
			.addField(
				`${await translate("game.general.totalWins", language)}:`,
				await translate("game.stats.embed.totalWins", language, {
					totalWins: playerStats.totalWins == undefined ? "Unknown" : playerStats.totalWins
				})
			)
			.addField(
				`${await translate("game.general.totalLosses", language)}:`,
				await translate("game.stats.embed.totalLosses", language, {
					totalLosses: playerStats.totalLosses == undefined ? "Unknown" : playerStats.totalLosses
				})
			);

		if (playerOptions.HideStats && msg.author.id == player.id) {
			var recipientDMChannel = await player.getDMChannel();

			if (recipientDMChannel) {
				await recipientDMChannel.createMessage({ embeds: [leaderboardEmbed] });
			} else {
				throw await translate("game.general.error.DMChannel", language, {
					displayName: player.username
				});
			}
		} else await msg.channel.createMessage({ embeds: [leaderboardEmbed] });

		return msg.react("success");
	}
}

module.exports = Stats;
