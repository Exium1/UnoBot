const Command = require("../../classes/command.js");
const Embed = require("../../classes/embed.js");
var { addCards, sendEmbeds, updatePosition, translate, getGameData } = require("../../utils/functions");

class Uno extends Command {
	constructor(client) {
		super(client, {
			name: "uno",
			aliases: ["uno!", "callout"],
			botPermissions: ["sendMessages", "embedLinks", "addReactions"],
			helpOptions: {
				helpArg: true,
				noArgs: false
			},
			category: __dirname, // eslint-disable-line
			allowNoPrefix: true
		});
	}

	async run(client, msg, { gameData, prefix }) {
		var language = msg.guild.language;

		gameData = await getGameData(gameData, msg.guildID);

		if (!gameData) {
			return msg.error(await translate("game.general.error.gameRequired", language, { prefix }));
		}

		if (!gameData.playerOrder.includes(msg.author.id)) {
			return msg.error(await translate("game.uno.error.notInGame", language));
		}

		if (!gameData.gameSettings.UnoCallout) {
			return msg.error(await translate("game.uno.error.noUnoCallout", language));
		}

		if (gameData.unoCallout == "") {
			return msg.error(await translate("game.uno.error.noPlayer", language));
		}

		await gameData.updateOne({ unoCallout: "" });

		var displayName = msg.member.nick || msg.author.username;

		if (gameData.unoCallout == msg.author.id) {
			var embed = new Embed().setAuthor(
				await translate("game.uno.embed", language, { callerName: displayName }),
				msg.author.dynamicAvatarURL()
			);
			var embedPrivate = new Embed().setAuthor(
				await translate("game.uno.embedPrivate", language),
				msg.author.dynamicAvatarURL()
			);

			await sendEmbeds(
				[
					{ embed, recipient: "default" },
					{ embed: embedPrivate, recipient: gameData.players[msg.author.id].channelID }
				],
				msg,
				gameData
			);
		} else {
			var callerEmbed = new Embed().setAuthor(
				await translate("game.uno.embed.callerEmbed", language, {
					currentPlayer: gameData.players[gameData.unoCallout].displayName
				}),
				msg.author.dynamicAvatarURL()
			);

			var calledEmbed = new Embed().setAuthor(
				await translate("game.uno.embed.calledEmbed", language, { callerName: displayName }),
				msg.author.dynamicAvatarURL()
			);

			var calloutEmbed = new Embed().setAuthor(
				await translate("game.uno.embed.calloutEmbed", language, {
					callerName: displayName,
					currentPlayer: gameData.players[gameData.unoCallout].displayName
				}),
				msg.author.dynamicAvatarURL()
			);

			await sendEmbeds(
				[
					{ embed: calloutEmbed, recipient: "default" },
					{ embed: callerEmbed, recipient: gameData.players[msg.author.id].channelID },
					{ embed: calledEmbed, recipient: gameData.players[gameData.unoCallout].channelID }
				],
				msg,
				gameData
			);

			var newCards = (
				await addCards(2, gameData, await updatePosition(gameData.currentPosition, -1, gameData.playerOrder))
			).slice(-2);

			await gameData.updateOne({
				[`players.${gameData.unoCallout}.cards`]: gameData.players[gameData.unoCallout].cards
			});

			var calloutCards = new Embed().setAuthor(
				await translate("game.uno.embed.calloutCards", language, {
					currentPlayer: gameData.players[gameData.unoCallout].displayName
				}),
				gameData.players[gameData.unoCallout].dynamicAvatarURL
			);
			var calledCards = new Embed().setAuthor(
				await translate("game.uno.embed.calledCards", language, {
					cards: newCards.join(` ${await translate("general.andA")} `)
				}),
				gameData.players[gameData.unoCallout].dynamicAvatarURL
			);

			await sendEmbeds(
				[
					{ embed: calloutCards, recipient: "default" },
					{ embed: calledCards, recipient: gameData.players[gameData.unoCallout].channelID }
				],
				msg,
				gameData
			);
		}

		await msg.react("success");

		return;
	}
}

module.exports = Uno;
