const Command = require("../../classes/command.js");
const Embed = require("../../classes/embed.js");
var {
	createCardsImage,
	addCards,
	sendEmbeds,
	selfPlayCard,
	updatePosition,
	translate,
	getGameData,
	getCardColor
} = require("../../utils/functions");
const { readFileSync } = require("fs");

class Draw extends Command {
	constructor(client) {
		super(client, {
			name: "draw",
			aliases: ["d", "pickup", "newcard"],
			botPermissions: ["sendMessages", "embedLinks", "addReactions", "manageMessages"],
			helpOptions: {
				helpArg: true,
				noArgs: false
			},
			category: __dirname, // eslint-disable-line
			allowNoPrefix: true
		});
	}

	async run(client, msg, { prefix, gameData }) {
		var language = msg.guild.language;

		gameData = await getGameData(gameData, msg.guildID);

		if (!gameData) {
			return await msg.error(await translate("game.draw.error.noGame", language, { prefix }));
		}

		var currentPosition = gameData.currentPosition;

		// Filter out dissimilar channels and playerorder while UOC is disabled.
		if (gameData.gameSettings.UseOneChannel) {
			if (gameData.playerOrder[currentPosition] != msg.author.id) {
				var toPlayDisplayName = gameData.players[gameData.playerOrder[currentPosition]].displayName;

				return msg.error(
					await translate("game.play.error.wrongTurn", language, { displayName: toPlayDisplayName }),
					{ bold: false }
				);
			}
		} else {
			if (
				gameData.channelIDs[currentPosition] != msg.channel.id ||
				gameData.playerOrder[currentPosition] != msg.author.id
			) {
				toPlayDisplayName = gameData.players[gameData.playerOrder[currentPosition]].displayName;

				return msg.error(
					await translate("game.play.error.wrongTurn", language, { displayName: toPlayDisplayName }),
					{ bold: false }
				);
			}
		}

		// Handle the UnoCallout game setting
		if (gameData.gameSettings.UnoCallout) {
			// If there is still a user in the unoCallout field
			if (gameData.unoCallout !== "") {
				var noCallEmbed = new Embed().setAuthor(
					await translate("game.play.unoCallout.noCallout.embed", language, {
						displayName: gameData.players[gameData.unoCallout].displayName
					}),
					gameData.players[gameData.unoCallout].dynamicAvatarURL
				);

				var noCallEmbedPrivate = new Embed().setAuthor(
					await translate("game.play.unoCallout.noCallout.privateEmbed", language),
					gameData.players[gameData.unoCallout].dynamicAvatarURL
				);

				await sendEmbeds(
					[
						{ embed: noCallEmbed },
						{ embed: noCallEmbedPrivate, recipient: gameData.playerOrder.indexOf(gameData.unoCallout) }
					],
					msg,
					gameData
				);

				await gameData.updateOne({ unoCallout: "" });
			}
		}

		// Determine draw amount if there are stacked cards
		var drawAmount;

		if (gameData.stackedCards > 0) drawAmount = gameData.stackedCards;
		else drawAmount = 1;

		var gameSettings = gameData.gameSettings;
		var drawnCard = (await addCards(drawAmount, gameData, currentPosition))[0];
		var drawnCardColor = getCardColor(drawnCard);

		var drawnCardEmbed = new Embed().setAuthor(
			await translate("game.draw.drawnCard.embed", language, {
				displayName: gameData.players[msg.author.id].displayName
			}),
			gameData.players[msg.author.id].dynamicAvatarURL
		);

		var drawnCardPrivateEmbed = new Embed()
			.setAuthor(
				await translate("game.draw.drawnCard.privateEmbed", language, { drawnCard }),
				gameData.players[msg.author.id].dynamicAvatarURL
			)
			.setColor(drawnCardColor)
			.setThumbnail(`attachment://${drawnCard}.png`);

		var drawnCardFile = {
			file: readFileSync(`./assets/images/defaultCards/${drawnCard}.png`),
			name: `${drawnCard}.png`
		};

		if (gameData.stackedCards > 0) {
			drawnCardEmbed = new Embed().setAuthor(
				await translate("game.play.drawn.embed", language, {
					displayName: gameData.players[msg.author.id].displayName,
					drawCount: drawAmount
				}),
				gameData.players[msg.author.id].dynamicAvatarURL
			);

			if (drawAmount == 2) {
				drawnCardPrivateEmbed.setAuthor(
					await translate("game.play.drawn.privateEmbed", language, {
						drawnCards: gameData.players[msg.author.id].cards
							.slice(-drawAmount)
							.join(` ${await translate("general.andA", language)} `)
					}),
					gameData.players[msg.author.id].dynamicAvatarURL
				);
			} else {
				drawnCardPrivateEmbed.setAuthor(
					await translate("game.play.drawn.privateEmbed", language, {
						drawnCards: gameData.players[msg.author.id].cards.slice(-drawAmount).join(`, `)
					}),
					gameData.players[msg.author.id].dynamicAvatarURL
				);
			}

			gameData.stackedCards = 0;
		}

		await sendEmbeds(
			[
				{ embed: drawnCardEmbed },
				{ embed: drawnCardPrivateEmbed, recipient: currentPosition, files: drawnCardFile }
			],
			msg,
			gameData,
			{ dmEmbed: 1 }
		);

		if (gameSettings.DrawUntilMatch) {
			await gameData.updateOne({
				[`players.${msg.author.id}.cards`]: gameData.players[msg.author.id].cards,
				deck: gameData.deck,
				stackedCards: gameData.stackedCards
			});

			await selfPlayCard(msg.guild, gameData, prefix, client.user.id);

			return;
		}

		// Moves the current position up
		currentPosition = updatePosition(currentPosition, +1, gameData.playerOrder);
		gameData.currentPosition = currentPosition;

		await gameData.updateOne({
			[`players.${msg.author.id}.cards`]: gameData.players[msg.author.id].cards,
			deck: gameData.deck,
			stackedCards: gameData.stackedCards,
			currentPosition: gameData.currentPosition
		});

		await createCardsImage(gameData.players[gameData.playerOrder[gameData.currentPosition]].cards, msg.guildID);

		var currentCard = await gameData.currentCard;
		var currentCardColor = getCardColor(currentCard);
		var currentPlayerID = await gameData.playerOrder[currentPosition];
		var currentPlayerDisplayName = await gameData.players[currentPlayerID].displayName;
		var nextPlayerID = await gameData.playerOrder[await updatePosition(currentPosition, +1, gameData.playerOrder)];
		var nextPlayerDisplayName = await gameData.players[nextPlayerID].displayName;
		var cardsLength = gameData.players[currentPlayerID].cards.length;

		var embed = new Embed()
			.setTitle(
				await translate("game.play.main.embed.title", language, { displayName: currentPlayerDisplayName })
			)
			.setColor(currentCardColor)
			.setDescription(
				await translate("game.play.main.embed.desc", language, {
					displayName: currentPlayerDisplayName,
					currentCard: currentCard
				})
			)
			.setThumbnail(`attachment://playedCard.png`)
			.setImage(`attachment://cardsBack.png`)
			.setFooter(
				await translate("game.play.main.embed.footer", language, {
					displayName: nextPlayerDisplayName
				})
			);

		var files = [
			{ file: readFileSync(`./assets/images/defaultCards/${currentCard}.png`), name: `playedCard.png` },
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
			.setThumbnail(`attachment://playedCard.png`)
			.setImage(`attachment://cardsFront.png`)
			.setFooter(
				await translate("game.play.main.embed.footer", language, {
					displayName: nextPlayerDisplayName
				})
			);

		var privateEmbedFiles = [
			{ file: readFileSync(`./assets/images/defaultCards/${currentCard}.png`), name: `playedCard.png` },
			{ file: readFileSync(`./assets/images/serverCards/${msg.guildID}_front.png`), name: `cardsFront.png` }
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

		return;
	}
}

module.exports = Draw;
