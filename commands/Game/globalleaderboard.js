const Command = require("../../classes/command.js");
const Embed = require("../../classes/embed.js");
var { translate } = require("../../utils/functions");
const guildModel = require("../../database/models/guild");
const userModel = require("../../database/models/user");

class GlobalLeaderboard extends Command {
	constructor(client) {
		super(client, {
			name: "globalleaderboard",
			aliases: ["glb", "gleaderboard", "globallb"],
			botPermissions: ["sendMessages", "embedLinks", "addReactions"],
			helpOptions: {
				helpArg: true,
				noArgs: false
			},
			category: __dirname // eslint-disable-line
		});
	}

	async run(client, msg, { prefix, guildData }, ipc) {
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

		var totalUsers = await userModel.estimatedDocumentCount();

		var gLeaderboardEmbed = new Embed()
			.setTitle(await translate("game.globalleaderboard.embed.title", language, { serverName: msg.guild.name }))
			.setDescription(
				await translate("game.globalleaderboard.embed.desc", language, {
					totalPlayers: totalUsers
				})
			)
			.setFooter(await translate("game.globalleaderboard.embed.footer", language, { prefix }))
			.setThumbnail("logo");

		for (var i = 0; i < 10 && i < totalUsers; i++) {
			var playerData = await userModel.findOne({ "stats.rank": i + 1 });

			if (!playerData) {
				playerData = {
					_id: "000",
					username: "Not Found",
					discriminator: "0000",
					options: {},
					stats: {
						totalWins: "Unknown"
					}
				};
			}

			if (playerData.options.HideGlobalStats) {
				Object.assign(playerData, {
					username: "Hidden",
					discriminator: "0000"
				});
			} else if (!playerData.username || !playerData.discriminator) {
				var fetchedPlayerData = await ipc.fetchUser(playerData._id);

				playerData.username = fetchedPlayerData.username;
				playerData.discriminator = fetchedPlayerData.discriminator;

				await playerData.updateOne({
					username: playerData.username,
					discriminator: playerData.discriminator
				});
			}

			gLeaderboardEmbed.addField(
				`${await translate("game.general.rank", language)} ${i + 1}`,
				`**${playerData.username}${
					playerData.options.HideGlobalLeaderboardTag ? "" : `#${playerData.discriminator}`
				}**\n${playerData.stats.totalWins} ${(
					await translate("game.general.totalWins", language)
				).toLowerCase()}.`
			);
		}

		await msg.channel.createMessage({ embeds: [gLeaderboardEmbed] });

		return msg.react("success");
	}
}

module.exports = GlobalLeaderboard;
