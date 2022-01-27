const Command = require("../../classes/command.js");
const Embed = require("../../classes/embed.js");
var { translate, getUserData, getGameData } = require("../../utils/functions");

class Cards extends Command {
	constructor(client) {
		super(client, {
			name: "cards",
			aliases: [],
			botPermissions: ["sendMessages", "embedLinks", "addReactions", "attachFiles"],
			helpOptions: {
				helpArg: true,
				noArgs: false
			},
			category: __dirname // eslint-disable-line
		});
	}

	async run(client, msg, { prefix, gameData }) {
		var language = msg.guild.language;

		gameData = await getGameData(gameData, msg.guildID);

		if (!gameData || !gameData.playerOrder.includes(msg.author.id)) {
			return msg.error(await translate("game.general.error.gameRequired", language, { prefix }));
		}

		var userOptions = await getUserData(msg.author.id, "options");
		var cards = `\`${gameData.players[msg.author.id].cards.join("`, `")}\``;

		var cardsEmbed = new Embed()
			.setTitle(
				await translate("game.cards.embed.title", language, {
					cardCount: gameData.players[msg.author.id].cards.length
				})
			)
			.setDescription(cards);

		if (gameData.gameSettings.UseOneChannel || userOptions.DMCards) {
			var recipientDMChannel = await msg.author.getDMChannel();

			if (recipientDMChannel) {
				await recipientDMChannel.createMessage({ embeds: [cardsEmbed] });
			} else {
				throw await translate("game.general.error.DMChannel", language, {
					displayName: msg.member.nick || msg.author.username
				});
			}
		} else {
			if (msg.channel.id == gameData.players[msg.author.id].channelID) {
				await msg.channel.createMessage({ embeds: [cardsEmbed] });
			} else {
				var unoChannel = await msg.guild.channels.get(gameData.players[msg.author.id].channelID);

				if (unoChannel) {
					await unoChannel.createMessage({ embeds: [cardsEmbed] });
				} else {
					throw await translate("game.general.error.channelNotFound", language, {
						displayName: msg.member.nick || msg.author.username
					});
				}
			}
		}

		return msg.react("success");
	}
}

module.exports = Cards;
