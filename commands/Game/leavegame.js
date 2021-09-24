const Command = require("../../classes/command.js");
const Embed = require("../../classes/embed.js");
const { readFileSync } = require("fs");
var {
	hasBotPermissions,
	sendEmbeds,
	updatePosition,
	translate,
	selfPlayCard,
	endGame,
	createCardsImage,
	getCardColor
} = require("../../utils/functions");
const gameModel = require("../../database/models/game");

class Leavegame extends Command {
	constructor(client) {
		super(client, {
			name: "leavegame",
			aliases: ["leave", "lg", "quit"],
			botPermissions: ["sendMessages", "embedLinks", "addReactions", "manageMessages", "attachFiles"],
			memberPermissions: [],
			helpOptions: {
				helpArg: true,
				noArgs: false
			},
			category: __dirname // eslint-disable-line
		});
	}

	async run(client, msg, { prefix, gameData }) {
		var language = msg.guild.language;

		gameData = gameData || (await gameModel.findOne({ guildID: msg.guildID }));

		if (!gameData) {
			return msg.error(await translate("game.joingame.error.noGame", language, { prefix }));
		}

		if (gameData.gameSettings.UseOneChannel == false) {
			if ((await hasBotPermissions(["manageChannels", "viewChannel"], msg.channel, true)) !== true) return;
		}

		if (!gameData.playerOrder.includes(msg.author.id) && gameData.status !== "preGame") {
			return msg.error(await translate("game.leavegame.error.notInGame", language));
		}

		if (gameData.status == "preGame") {
			var { startgameEvent } = require("../../utils/eventEmitters.js");

			startgameEvent.emit("playerLeave", msg.guildID, msg.member.id);

			return msg.react("success");
		} else {
			await msg.react("loading");

			var deletedChannelID = gameData.player[msg.author.id].channelID;

			var leaveGameEmbed = new Embed().setAuthor(
				await translate("game.leavegame.left", language, {
					user: `${msg.author.username}#${msg.author.discriminator}`
				}),
				await msg.author.dynamicAvatarURL()
			);

			await gameData.deck.concat(gameData.players[msg.author.id].cards);
			await gameData.playerOrder.splice(gameData.playerOrder.indexOf(msg.author.id), 1);

			if (!gameData.gameSettings.UseOneChannel) {
				await gameData.channelIDs.splice(
					gameData.channelIDs.indexOf(gameData.players[msg.author.id].channelID),
					1
				);

				var oldChannel = await msg.guild.channels.get(gameData.players[msg.author.id].channelID);

				if (oldChannel) await oldChannel.delete();
			}

			delete gameData.players[msg.author.id];

			if (currentPosition > gameData.playerOrder.indexOf(msg.author.id)) {
				// Shift both the player order and current pos back if current pos is greater than player pos
				gameData.currentPosition = await updatePosition(gameData.currentPosition, -1, gameData.playerOrder);
			} else gameData.currentPosition = await updatePosition(gameData.currentPosition, 0, gameData.playerOrder);

			await gameData.updateOne({
				deck: gameData.deck,
				currentPosition: gameData.currentPosition,
				players: gameData.players,
				playerOrder: gameData.playerOrder,
				channelIDs: gameData.channelIDs
			});

			await sendEmbeds([{ embed: leaveGameEmbed }], msg, gameData);

			var { currentGames } = require("../../utils/collections.js");

			currentGames.set(msg.guildID, false);

			if (gameData.playerOrder.length == 1) {
				var winner = gameData.players[gameData.playerOrder[0]];
				var oldUserDisplayName = msg.member.nick || msg.author.username;

				var finishedGameEmbedPrivate = new Embed()
					.setTitle(await translate("game.play.end.privateEmbed.title", language))
					.setDescription(await translate("game.leavegame.left", language, { user: oldUserDisplayName }))
					.setImage(`${msg.author.dynamicAvatarURL(null, 2048)}`)
					.setFooter(await translate("game.leavegame.incompleteGame", language));

				var finishedGameEmbed = new Embed()
					.setTitle(
						await translate("game.play.end.embed.title", language, { displayName: winner.displayName })
					)
					.setDescription(await translate("game.leavegame.left", language, { user: oldUserDisplayName }))
					.setImage(`${msg.author.dynamicAvatarURL(null, 2048)}`)
					.setFooter(await translate("game.leavegame.incompleteGame", language));

				await sendEmbeds(
					[{ embed: finishedGameEmbed }, { embed: finishedGameEmbedPrivate, recipient: 0 }],
					msg,
					gameData
				);

				setTimeout(async function () {
					await endGame(msg.guild, gameData);
				}, 15000);
			} else {
				currentGames.set(msg.guildID, {
					channelIDs: gameData.channelIDs
				});

				var currentPosition = gameData.currentPosition;
				var currentPlayerID = await gameData.playerOrder[currentPosition];
				var currentPlayerDisplayName = await gameData.players[currentPlayerID].displayName;
				var nextPlayerID = await gameData.playerOrder[
					await updatePosition(currentPosition, +1, gameData.playerOrder)
				];
				var nextPlayerDisplayName = await gameData.players[nextPlayerID].displayName;
				var cardsLength = gameData.players[currentPlayerID].cards.length;
				var currentCard = gameData.currentCard;
				var currentCardColor = getCardColor(currentCard);

				await createCardsImage(gameData.players[currentPlayerID].cards, msg.guildID);

				var embed = new Embed()
					.setTitle(
						await translate("game.play.main.embed.title", language, {
							displayName: currentPlayerDisplayName
						})
					)
					.setColor(currentCardColor)
					.setDescription(
						await translate("game.play.main.embed.desc", language, {
							displayName: currentPlayerDisplayName,
							currentCard: currentCard
						})
					)
					.setThumbnail(`attachment://currentCard.png`)
					.setImage(`attachment://cardsBack.png`)
					.setFooter(
						await translate("game.play.main.embed.footer", language, {
							displayName: nextPlayerDisplayName
						})
					);

				var files = [
					{ file: readFileSync(`./assets/images/defaultCards/${currentCard}.png`), name: `currentCard.png` },
					{
						file: readFileSync(`./assets/images/defaultCards/backs/back${cardsLength}.png`),
						name: `cardsBack.png`
					}
				];

				var privateEmbed = new Embed()
					.setTitle(await translate("game.play.main.privateEmbed.title", language))
					.setColor(currentCardColor)
					.setDescription(
						await translate("game.play.main.privateEmbed.desc", language, {
							currentCard: currentCard
						})
					)
					.setThumbnail(`attachment://currentCard.png`)
					.setImage(`attachment://cardsFront.png`)
					.setFooter(
						await translate("game.play.main.embed.footer", language, {
							displayName: nextPlayerDisplayName
						})
					);

				var privateEmbedFiles = [
					{ file: readFileSync(`./assets/images/defaultCards/${currentCard}.png`), name: `currentCard.png` },
					{
						file: readFileSync(`./assets/images/serverCards/${msg.guildID}_front.png`),
						name: `cardsFront.png`
					}
				];

				await sendEmbeds(
					[
						{ embed, files },
						{ embed: privateEmbed, recipient: currentPosition, files: privateEmbedFiles }
					],
					msg,
					gameData,
					{ dmEmbed: 1 }
				);

				await selfPlayCard(msg.guild, gameData, prefix, client.user.id);
			}

			if (msg.channel.id !== deletedChannelID) {
				return msg.react("success", "loading");
			}
		}
	}
}

module.exports = Leavegame;
