const Command = require("../../classes/command.js");
const Embed = require("../../classes/embed.js");
const {
	hasBotPermissions,
	createCardsImage,
	addCards,
	sendEmbeds,
	solveCard,
	matchCards,
	updatePosition,
	updateGuildStats,
	updateUserStats,
	endGame,
	selfPlayCard,
	translate,
	objectToString,
	arrayToString,
	getUserData,
	getGameData,
	getCardColor
} = require("../../utils/functions");
const { readFileSync } = require("fs");

class Play extends Command {
	constructor(client) {
		super(client, {
			name: "play",
			aliases: ["p"],
			botPermissions: ["sendMessages", "embedLinks", "addReactions", "attachFiles"],
			helpOptions: {
				helpArg: true,
				noArgs: false
			},
			category: __dirname, // eslint-disable-line
			allowNoPrefix: true
		});
	}

	async run(client, msg, { gameData, args, prefix }) {
		var language = msg.guild.language;

		gameData = await getGameData(gameData, msg.guildID);

		if (!gameData) return msg.error(await translate("game.play.error.noGame", language, { prefix }));

		if (!gameData.channelIDs.includes(msg.channel.id)) return msg.error("game.play.error.noUnoChannel", language);

		if (gameData.gameSettings.UseOneChannel == false) {
			if ((await hasBotPermissions(["manageChannels", "readMessages"], msg.channel, true)) !== true) return;
		}

		var { gameSettings, currentPosition } = gameData;
		var toPlayDisplayName = gameData.players[gameData.playerOrder[currentPosition]].displayName;

		if (gameSettings.UseOneChannel) {
			if (
				gameData.playerOrder[currentPosition] !== msg.author.id &&
				gameData.channelIDs[currentPosition] !== msg.channel.id
			) {
				return msg.error(
					await translate("game.play.error.wrongTurn", language, { displayName: toPlayDisplayName }),
					{ bold: false }
				);
			}
		} else if (gameData.playerOrder[currentPosition] !== msg.author.id) {
			return msg.error(
				await translate("game.play.error.wrongTurn", language, { displayName: toPlayDisplayName }),
				{ bold: false }
			);
		}

		// Turn the msg into the played card
		var playedCard = await solveCard(args).catch(async (reason) => {
			var userOptions = await getUserData(msg.author.id, "options");

			// Check and respond to card errors
			if (!userOptions.BlockCardErrors) {
				if (reason == "NO_COLOR") {
					await msg.error(await translate("game.play.error.noColor", language, { prefix }), {
						bold: false
					});
				} else if (reason == "WILD_NO_COLOR") {
					await msg.error(await translate("game.play.error.wildNoColor", language, { prefix }), {
						bold: false
					});
				} else if (reason == "NO_NUMBER") {
					await msg.error(await translate("game.play.error.noNumber", language, { prefix }), {
						bold: false
					});
				}
			}

			return "return";
		});

		if (playedCard == "return") return;

		function washCard(card) {
			if (card.includes("wild")) {
				if (card.includes("wilddraw4")) card = "wilddraw4";
				else card = "wild";
			}

			return card;
		}

		var washedCard = await washCard(playedCard); // Clear card from wild colors
		var currentCard = gameData.currentCard;
		var oldPlayerID = gameData.playerOrder[currentPosition];
		var oldPlayer = gameData.players[oldPlayerID];

		//  Check if the player has the playedCard
		if (!gameData.players[oldPlayerID].cards.includes(washedCard)) {
			return msg.error(await translate("game.play.error.noCard", language, { washedCard }), {
				bold: false
			});
		}

		// Prevent player from playing a card, other than a draw card, when there are stacked cards
		if (gameData.stackedCards > 0 && playedCard.includes("draw") == false) {
			var requiredDrawCard = currentCard.includes("draw2") ? "draw2/draw4" : "draw4";

			return msg.error(await translate("game.play.error.forcedToStack", language, { requiredDrawCard }));
		}

		//  See if the played card matches the current card
		if ((await matchCards(playedCard, currentCard)) == false) {
			return msg.error(await translate("game.play.error.noMatch", language, { washedCard, currentCard }), {
				bold: false
			});
		}

		var currentCardColor = getCardColor(playedCard);

		var playedCardEmbedPrivate = new Embed()
			.setAuthor(
				await translate("game.play.playedCard.privateEmbed", language, { playedCard }),
				gameData.players[msg.author.id].dynamicAvatarURL
			)
			.setColor(currentCardColor);

		var playedCardEmbed = new Embed()
			.setAuthor(
				await translate("game.play.playedCard.embed", language, {
					playedCard,
					displayName: oldPlayer.displayName
				}),
				gameData.players[msg.author.id].dynamicAvatarURL
			)
			.setColor(currentCardColor);

		if (gameSettings.UseOneChannel == true) await msg.channel.createMessage(playedCardEmbed);
		else {
			await sendEmbeds(
				[{ embed: playedCardEmbed }, { embed: playedCardEmbedPrivate, recipient: currentPosition }],
				msg,
				gameData
			);
		}

		// StackCards game setting handler
		if (gameSettings.StackCards) {
			// Only runs when a player can add to the stack
			if (playedCard.includes("draw")) {
				// Check if the next player can add to the s tack
				var nextPosition = await updatePosition(currentPosition, +1, gameData.playerOrder);
				var nextCanStack = false;

				gameData.players[gameData.playerOrder[nextPosition]].cards.forEach((c) =>
					(c.includes("draw2") && playedCard.includes("draw2")) || c.includes("draw4")
						? (nextCanStack = true)
						: false
				);

				var cardNumber = Number(playedCard.match(/\d+/)[0]);
				var drawCount = cardNumber + gameData.stackedCards;

				if (nextCanStack == true) {
					gameData.stackedCards = drawCount;

					var privateEmbed = new Embed().setAuthor(
						await translate("game.play.stackCards.privateEmbed", language, {
							stackedCards: gameData.stackedCards
						}),
						gameData.players[gameData.playerOrder[nextPosition]].dynamicAvatarURL
					);

					var embed = new Embed().setAuthor(
						await translate("game.play.stackCards.embed", language, {
							displayName: gameData.players[gameData.playerOrder[nextPosition]].displayName,
							stackedCards: gameData.stackedCards
						}),
						gameData.players[gameData.playerOrder[nextPosition]].dynamicAvatarURL
					);

					await sendEmbeds([{ embed }, { embed: privateEmbed, recipient: currentPosition }], msg, gameData);
				} else {
					currentPosition = await updatePosition(currentPosition, +1, gameData.playerOrder);
					await addCards(drawCount, gameData, currentPosition);

					embed = new Embed().setAuthor(
						await translate("game.play.drawn.embed", language, {
							displayName: gameData.players[gameData.playerOrder[currentPosition]].displayName,
							drawCount
						}),
						gameData.players[gameData.playerOrder[currentPosition]].dynamicAvatarURL
					);

					if (drawCount == 2) {
						privateEmbed = new Embed().setAuthor(
							await translate("game.play.drawn.privateEmbed", language, {
								drawnCards: gameData.players[gameData.playerOrder[currentPosition]].cards
									.slice(-drawCount)
									.join(` ${await translate("general.andA", language)} `)
							}),
							gameData.players[gameData.playerOrder[currentPosition]].dynamicAvatarURL
						);
					} else {
						privateEmbed = new Embed().setAuthor(
							await translate("game.play.drawn.privateEmbed", language, {
								drawnCards: gameData.players[gameData.playerOrder[currentPosition]].cards
									.slice(-drawCount)
									.join(`, `)
							}),
							gameData.players[gameData.playerOrder[currentPosition]].dynamicAvatarURL
						);
					}

					await sendEmbeds([embed, { embed: privateEmbed, recipient: currentPosition }], msg, gameData, {
						dmEmbed: 1
					});

					gameData.stackedCards = 0;
				}
			}
		}

		// If a reverse card, reverse the player order & channelIDs
		if (playedCard.includes("reverse")) {
			if (gameData.channelIDs.length > gameData.playerOrder.length) {
				var spectatorChannel = gameData.channelIDs[gameData.channelIDs.length - 1];

				gameData.channelIDs.splice(-1);
				gameData.channelIDs.reverse().push(spectatorChannel);
				gameData.playerOrder.reverse();
				currentPosition = gameData.playerOrder.indexOf(msg.author.id);
			} else {
				gameData.channelIDs.reverse();
				gameData.playerOrder.reverse();
				currentPosition = gameData.playerOrder.indexOf(msg.author.id);
			}

			embed = new Embed().setAuthor(await translate("game.play.reversedOrder", language));

			await sendEmbeds([{ embed }], msg, gameData);
		}

		// If a skip card, skip next player
		if (playedCard.includes("skip")) {
			currentPosition = await updatePosition(currentPosition, +1, gameData.playerOrder);

			privateEmbed = new Embed().setAuthor(
				await translate("game.play.skipped.privateEmbed", language),
				gameData.players[gameData.playerOrder[currentPosition]].dynamicAvatarURL
			);

			embed = new Embed().setAuthor(
				await translate("game.play.skipped.embed", language, {
					displayName: gameData.players[gameData.playerOrder[currentPosition]].displayName
				}),
				gameData.players[gameData.playerOrder[currentPosition]].dynamicAvatarURL
			);

			await sendEmbeds([{ embed }, { embed: privateEmbed, recipient: currentPosition }], msg, gameData);
		}

		// If a draw2 card, add 2 cards and skip
		if (playedCard.includes("draw2") && !gameSettings.StackCards) {
			currentPosition = await updatePosition(currentPosition, +1, gameData.playerOrder);
			await addCards(2, gameData, currentPosition);

			embed = new Embed().setAuthor(
				await translate("game.play.drawn.embed", language, {
					displayName: gameData.players[gameData.playerOrder[currentPosition]].displayName,
					drawCount: "2"
				}),
				gameData.players[gameData.playerOrder[currentPosition]].dynamicAvatarURL
			);

			privateEmbed = new Embed().setAuthor(
				await translate("game.play.drawn.privateEmbed", language, {
					drawnCards: gameData.players[gameData.playerOrder[currentPosition]].cards
						.slice(-2)
						.join(` ${await translate("general.andA", language)} `)
				}),
				gameData.players[gameData.playerOrder[currentPosition]].dynamicAvatarURL
			);

			await sendEmbeds([embed, { embed: privateEmbed, recipient: currentPosition }], msg, gameData, {
				dmEmbed: 1
			});
		}

		// If a wilddraw4, check if user specified color, and give 4 cards to the next player and skip them
		if (playedCard.includes("draw4") && !gameSettings.StackCards) {
			currentPosition = await updatePosition(currentPosition, +1, gameData.playerOrder);
			await addCards(4, gameData, currentPosition);

			privateEmbed = new Embed().setAuthor(
				await translate("game.play.drawn.privateEmbed", language, {
					drawnCards: gameData.players[gameData.playerOrder[currentPosition]].cards.slice(-4).join(`, `)
				}),
				gameData.players[gameData.playerOrder[currentPosition]].dynamicAvatarURL
			);

			embed = new Embed().setAuthor(
				await translate("game.play.drawn.embed", language, {
					displayName: gameData.players[gameData.playerOrder[currentPosition]].displayName,
					drawCount: "4"
				}),
				gameData.players[gameData.playerOrder[currentPosition]].dynamicAvatarURL
			);

			await sendEmbeds([embed, { embed: privateEmbed, recipient: currentPosition }], msg, gameData, {
				dmEmbed: 1
			});
		}

		// Transfers cards: playedCard -> currentCard -> deck
		gameData.deck.push(washedCard); // Add played card to deck
		gameData.currentCard = playedCard; // Set the currentcard to the played card
		var index = gameData.players[oldPlayerID].cards.indexOf(washedCard);

		gameData.players[oldPlayerID].cards.splice(index, 1); // Removes played card from player's deck

		// Handle the UnoCallout game setting
		if (gameSettings.UnoCallout) {
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

			if (gameData.players[oldPlayerID].cards.length == 1) await gameData.updateOne({ unoCallout: oldPlayerID });
		}

		// If the player still has cards left
		if (gameData.players[oldPlayerID].cards.length > 0) {
			// Change the current position
			currentPosition = await updatePosition(currentPosition, +1, gameData.playerOrder);
			gameData.currentPosition = currentPosition;

			await gameData.updateOne({
				currentCard: gameData.currentCard,
				currentPosition: gameData.currentPosition,
				stackedCards: gameData.stackedCards,
				players: gameData.players,
				playerOrder: gameData.playerOrder,
				channelIDs: gameData.channelIDs,
				deck: gameData.deck
			});

			var currentPlayerID = await gameData.playerOrder[currentPosition];
			var currentPlayerDisplayName = await gameData.players[currentPlayerID].displayName;
			var nextPlayerID = await gameData.playerOrder[
				await updatePosition(currentPosition, +1, gameData.playerOrder)
			];
			var nextPlayerDisplayName = await gameData.players[nextPlayerID].displayName;
			var cardsLength = gameData.players[currentPlayerID].cards.length;
			var playedCardColor = getCardColor(playedCard);

			// Write the cards, then send the embeds to the players
			await createCardsImage(gameData.players[currentPlayerID].cards, msg.guildID);

			embed = new Embed()
				.setTitle(
					await translate("game.play.main.embed.title", language, { displayName: currentPlayerDisplayName })
				)
				.setColor(playedCardColor)
				.setDescription(
					await translate("game.play.main.embed.desc", language, {
						displayName: currentPlayerDisplayName,
						currentCard: playedCard
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
				{ file: readFileSync(`./assets/images/defaultCards/${playedCard}.png`), name: `playedCard.png` },
				{
					file: readFileSync(`./assets/images/defaultCards/backs/back${cardsLength}.png`),
					name: `cardsBack.png`
				}
			];

			privateEmbed = new Embed()
				.setTitle(await translate("game.play.main.privateEmbed.title", language))
				.setColor(playedCardColor)
				.setDescription(
					await translate("game.play.main.privateEmbed.desc", language, {
						currentCard: playedCard
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
				{ file: readFileSync(`./assets/images/defaultCards/${playedCard}.png`), name: `playedCard.png` },
				{ file: readFileSync(`./assets/images/serverCards/${msg.guildID}_front.png`), name: `cardsFront.png` }
			];

			await sendEmbeds(
				[
					{ embed, files },
					{ embed: privateEmbed, recipient: currentPosition, files: privateEmbedFiles }
				],
				msg,
				gameData,
				{ autoPing: 1, dmEmbed: 1 }
			);

			await selfPlayCard(msg.guild, gameData, prefix, client.user.id);
		} else {
			await gameData.updateOne({
				status: "postGame",
				currentCard: gameData.currentCard,
				currentPosition: gameData.currentPosition,
				stackedCards: gameData.stackedCards,
				players: gameData.players,
				playerOrder: gameData.playerOrder,
				channelIDs: gameData.channelIDs,
				deck: gameData.deck
			});

			// Send finished game embeds with winner's dynamicAvatarURL
			var finishedGameEmbed = new Embed()
				.setTitle(
					await translate("game.play.end.embed.title", language, {
						displayName: msg.member.nick || msg.member.username
					})
				)
				.setImage(`${msg.author.dynamicAvatarURL(null, 2048)}`);

			var finishedGameEmbedPrivate = new Embed()
				.setTitle(await translate("game.play.end.privateEmbed.title", language))
				.setImage(`${msg.author.dynamicAvatarURL(null, 2048)}`);

			await sendEmbeds(
				[
					{ embed: finishedGameEmbed },
					{ embed: finishedGameEmbedPrivate, recipient: gameData.playerOrder.indexOf(msg.author.id) }
				],
				msg,
				gameData
			);

			// Say "GG" to all players
			if (gameData.playerOrder.includes(client.user.id)) {
				var channel = await msg.guild.channels.get(gameData.players[client.user.id].channelID);

				if (channel) await channel.createMessage(`${prefix}say GG!`);
			}

			// Separate winner from player order
			var playerOrder = gameData.playerOrder;
			var playerNames = [];

			playerOrder.splice(gameData.playerOrder.indexOf(msg.author.id), 1);

			var winner = {
				id: msg.author.id,
				username: msg.author.username,
				discriminator: msg.author.discriminator
			};

			playerNames.push(`${winner.username}#${winner.discriminator}`);

			var losers = [];

			for (var l = 0; l < playerOrder.length; l++) {
				var loser = gameData.players[playerOrder[l]];

				losers.push({
					id: playerOrder[l],
					username: loser.username,
					discriminator: loser.discriminator
				});

				playerNames.push(
					`${gameData.players[playerOrder[l]].username}#${gameData.players[playerOrder[l]].discriminator}`
				);
			}

			await updateGuildStats(msg.author.id, playerOrder, msg.channel.guild);
			await updateUserStats(winner, losers);

			var startGameChannel = await msg.guild.channels.get(gameData.startChannelID);

			var logEmbed = new Embed()
				.setTitle(
					await translate("game.play.end.log.title", language, {
						username: msg.author.username,
						discriminator: msg.author.discriminator
					})
				)
				.setThumbnail(gameData.players[msg.author.id].dynamicAvatarURL)
				.addField(
					`${await translate("game.play.end.log.players", language)}:`,
					await arrayToString(playerNames, null, language),
					true
				)
				.addField(
					`${await translate("game.general.gameSettings", language)}:`,
					await objectToString(gameData.customGameSettings, null, language),
					true
				)
				.addField(
					`${await translate("game.play.end.log.startDate", language)}:`,
					gameData.startTime.toUTCString(),
					true
				)
				.addField(`${await translate("game.play.end.log.endDate", language)}:`, new Date().toUTCString(), true);

			if (startGameChannel) await startGameChannel.createMessage(logEmbed);

			//  Run this after 30 seconds
			setTimeout(async () => {
				await endGame(msg.channel.guild, gameData);
			}, 30000);
		}

		return;
	}
}

module.exports = Play;
