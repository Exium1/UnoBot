const Command = require("../../classes/command.js");
const Embed = require("../../classes/embed.js");
const {
	hasBotPermissions,
	formatGameSetting,
	addCards,
	shuffleArray,
	getUserData,
	updatePosition,
	createCardsImage,
	sendEmbeds,
	selfPlayCard,
	translate,
	arrayToString,
	objectToString,
	hasVoted,
	getGameData,
	getCardColor
} = require("../../utils/functions");
const { readFileSync } = require("fs");
const { topggVoteURL, gameSettings: configGameSettings } = require("../../utils/config.js");
const { msgReactions, currentGames } = require("../../utils/collections");
const guildModel = require("../../database/models/guild");
const gameModel = require("../../database/models/game");

class Startgame extends Command {
	constructor(client) {
		super(client, {
			name: "startgame",
			aliases: ["sg"],
			botPermissions: ["sendMessages", "embedLinks", "addReactions", "manageMessages", "attachFiles"],
			helpOptions: {
				helpArg: true,
				noArgs: false
			},
			category: __dirname // eslint-disable-line
		});
	}

	async run(client, msg, { guildData, gameData, args, prefix }) {
		var language = msg.guild.language;
		var gameSettingArgs = args.filter((a) => a.startsWith("<@") == false);
		var gameSettings = {};
		var customGameSettings = {};
		var warnings = [];
		var playerList = [];

		gameData = await getGameData(gameData, msg.guildID);
		guildData = guildData || (await guildModel.findById(msg.guildID)); // If guildData was already given, use it, if not, find it

		if (gameData) {
			return msg.error(await translate("game.startgame.error.runningGame", language, { prefix }));
		}

		// Assign the gameSettings object with keys and default values from the config file
		Object.keys(configGameSettings).forEach((gameSetting) => {
			gameSettings[gameSetting] = configGameSettings[gameSetting].default;
		});

		// Go through args to find game settings
		for (var i = 0; i < gameSettingArgs.length; i++) {
			var newArg = gameSettingArgs[i].replace(/,|-|\|/g, "");
			var possibleGS;

			if (newArg.includes(":")) {
				possibleGS = await formatGameSetting(newArg.split(":")[0]);

				if (possibleGS) {
					var gameSettingValue = Number(newArg.split(":")[1]);

					if (configGameSettings[possibleGS].type == Number && !isNaN(gameSettingValue)) {
						if (configGameSettings[possibleGS].max < gameSettingValue) {
							warnings.push(
								await translate("game.startgame.warning.gameSettingMax", language, {
									newValue: gameSettingValue,
									maxValue: configGameSettings[possibleGS].max,
									gameSetting: possibleGS
								})
							);
						} else if (configGameSettings[possibleGS].min > gameSettingValue) {
							warnings.push(
								await translate("game.startgame.warning.gameSettingMin", language, {
									newValue: gameSettingValue,
									minValue: configGameSettings[possibleGS].min,
									gameSetting: possibleGS
								})
							);
						} else if (configGameSettings[possibleGS].default == gameSettingValue) {
							warnings.push(
								await translate("game.startgame.warning.alreadyDefault", language, {
									newValue: gameSettingValue,
									gameSetting: possibleGS
								})
							);
						} else {
							gameSettings[possibleGS] = gameSettingValue;
							customGameSettings[possibleGS] = gameSettingValue;
						}
					} else {
						warnings.push(
							await translate("game.startgame.warning.gsRequiresNum", language, {
								gameSetting: possibleGS
							})
						);
					}
				}
			} else {
				possibleGS = await formatGameSetting(newArg);

				if (possibleGS) {
					if (configGameSettings[possibleGS].type == Boolean) {
						gameSettings[possibleGS] = true;
						customGameSettings[possibleGS] = true;
					} else {
						warnings.push(
							await translate("game.startgame.warning.gsRequiresNum", language, {
								gameSetting: possibleGS
							})
						);
					}
				}
			}
		}

		// Apply DGS to gameSettings if there are possible game settings
		if (gameSettingArgs.length == 0 && guildData.game.defaultGameSettings !== {}) {
			customGameSettings = guildData.game.defaultGameSettings;
			Object.assign(gameSettings, guildData.game.defaultGameSettings);
		}

		if (!gameSettings.UseOneChannel) {
			if ((await hasBotPermissions(["manageChannels", "viewChannel"], msg.channel, true)) !== true) return;
		}
		if (gameSettings.SpectateGame) {
			if ((await hasBotPermissions(["manageRoles"], msg.channel, false)) !== true) {
				return msg.error(await translate("game.startgame.error.noManageRoles", language));
			}
		}

		// Select and add players to the playerList
		async function filterPlayer(member) {
			return new Promise(async (resolve) => {
				if (!member.bot || member.id == client.user.id) {
					playerList.push({
						id: member.id,
						username: member.username,
						displayName: member.nick || member.username,
						discriminator: member.discriminator,
						dynamicAvatarURL: member.user.dynamicAvatarURL()
					});
				} else {
					warnings.push(
						await translate("game.startgame.warning.isBot", language, {
							displayName: member.nick || member.username
						})
					);
				}

				resolve();
			});
		}

		for (var m = 0; m < msg.mentions.length; m++) {
			var member = await msg.channel.guild.members.get(msg.mentions[m].id);

			await filterPlayer(member);
		}

		if (gameSettings.QuickStart) {
			if (playerList.length == 0) {
				return msg.error(await translate("game.startgame.error.noPlayersFound", language, { prefix }));
			}

			if (playerList.length < 2) {
				return msg.error(
					await translate("game.startgame.error.notEnoughPlayers", language, {
						clientUsername: client.user.username
					})
				);
			}

			if (playerList.length > 4) {
				if (!(await hasVoted(msg.author.id))) {
					return msg.error(
						await translate("game.startgame.error.4playerCap", language, { voteURL: topggVoteURL })
					);
				}
			}

			if (playerList.length > 8) {
				return msg.error(await translate("game.startgame.error.playerCap", language));
			}

			gameData = await new gameModel({
				guildID: msg.guildID,
				status: "midGame",
				gameCreatorID: msg.author.id,
				startChannelID: msg.channel.id,
				startMessageID: null,
				gameSettings: gameSettings,
				customGameSettings: customGameSettings
			});
		} else {
			async function setupGameEmbed() {
				return new Promise(async (resolve, reject) => {
					var timer = 30;
					var playerListDisplayNames = [];

					playerList.forEach((p) => playerListDisplayNames.push(p.displayName));

					var startgameEmbed = new Embed()
						.setTitle(await translate("game.startgame.main.embed.title", language))
						.setDescription(
							`${await translate("game.startgame.main.embed.desc", language, { timeLeft: timer })}\n\n${
								warnings.length > 0 ? `*⚠ ${warnings.join("\n⚠")}*` : ""
							}`
						)
						.addField(
							`${await translate("game.general.players", language)}:`,
							await arrayToString(playerListDisplayNames, "🔹", language)
						)
						.addField(
							`${await translate("game.general.gameSettings", language)}:`,
							await objectToString(customGameSettings, false, language)
						)
						.addField(
							`${await translate("game.general.gameCreator", language)}:`,
							`${msg.author.username}#${msg.author.discriminator}`
						)
						.setFooter(await translate("game.startgame.main.embed.footer", language));

					var startgameMessage = await msg.channel.createMessage(startgameEmbed);

					gameData = await new gameModel({
						guildID: msg.guildID,
						status: "preGame",
						gameCreatorID: msg.author.id,
						startChannelID: msg.channel.id,
						startMessageID: startgameMessage.id,
						gameSettings: gameSettings,
						customGameSettings: customGameSettings
					});

					await gameData.save();

					msgReactions.set(startgameMessage.id, { action: "startMsgReaction" });

					var { startgameEvent } = require("../../utils/eventEmitters");

					startgameEvent.on("playerJoin", (guildID, guildMember) => playerJoin(guildID, guildMember));
					startgameEvent.on("playerLeave", (guildID, guildMemberID) => playerLeave(guildID, guildMemberID));
					startgameEvent.on("gameSettingUpdate", (guildID, data) => gameSettingUpdate(guildID, data));
					startgameEvent.on("endGameCommand", () => timeoutStop("forceStop"));
					startgameEvent.on("startMsgReaction", ({ guildID, emoji, reactor, action }) =>
						handleMsgReaction(guildID, emoji, reactor, action)
					);

					await startgameMessage.addReaction("🖐️");
					await startgameMessage.addReaction("▶️");
					await startgameMessage.addReaction("❌");

					var startgameCountdown = setTimeout(() => {
						timeoutStop("end");
					}, timer * 1000);

					// Refresh embed every 10 seconds
					var startgameInterval = setInterval(async function () {
						timer -= 10;

						if (timer == 0) {
							clearInterval(startgameInterval);
						} else {
							startgameEmbed.embed.fields[1] = {
								name: `${await translate("game.general.gameSettings", language)}:`,
								value: await objectToString(customGameSettings, false, language),
								inline: false
							};

							startgameEmbed.setDescription(
								await translate("game.startgame.main.embed.desc", language, { timeLeft: timer })
							);

							startgameMessage.edit(startgameEmbed);
						}
					}, 10000);

					async function playerJoin(guildID, guildMember) {
						if (guildID !== msg.guildID) return; // Verify reaction is from same guild

						// Add player to the player list if they aren't there already
						if (!(await playerList.find((p) => p.id == guildMember.id))) {
							playerList.push({
								id: guildMember.id,
								username: guildMember.username,
								displayName: guildMember.nick || guildMember.username,
								discriminator: guildMember.discriminator,
								dynamicAvatarURL: guildMember.user.dynamicAvatarURL()
							});

							playerListDisplayNames = [];
							playerList.forEach((p) => playerListDisplayNames.push(p.displayName));

							startgameEmbed.embed.fields[0] = {
								name: `${await translate("game.general.players", language)}:`,
								value: await arrayToString(playerListDisplayNames, "🔹", language),
								inline: false
							};

							startgameMessage.edit(startgameEmbed);
						}

						return;
					}

					async function playerLeave(guildID, guildMemberID) {
						if (guildID !== msg.guildID) return; // Verify reaction is from same guild

						var userInPlayerList = await playerList.find((p) => p.id == guildMemberID);

						if (userInPlayerList) {
							var index = playerList.indexOf(userInPlayerList);

							playerList.splice(index, 1);

							playerListDisplayNames = [];
							playerList.forEach((p) => playerListDisplayNames.push(p.displayName));

							startgameEmbed.embed.fields[0] = {
								name: `${await translate("game.general.players", language)}:`,
								value: await arrayToString(playerListDisplayNames, "🔹", language),
								inline: false
							};

							startgameMessage.edit(startgameEmbed);
						}

						return;
					}

					async function gameSettingUpdate(guildID, data) {
						if (guildID !== msg.guild.id) return;

						gameSettings = data.gameSettings;
						gameData.gameSettings = data.gameSettings;
						customGameSettings = data.customGameSettings;
						gameData.customGameSettings = data.customGameSettings;
					}

					async function handleMsgReaction(guildID, emoji, reactor, action) {
						if (guildID !== msg.guildID) return; // Verify reaction is from same guild

						if (action == "add") {
							if (emoji.name == "🖐️") {
								await playerJoin(guildID, reactor);
								return;
							}

							if (emoji.name == "▶️" && reactor.id == msg.author.id) {
								await timeoutStop("forceStart");
								return;
							}

							if (emoji.name == "❌" && reactor.id == msg.author.id) {
								await timeoutStop("forceStop");
								return;
							}
						}

						if (action == "remove") {
							if (emoji.name == "🖐️") {
								await playerLeave(guildID, reactor);
								return;
							}
						}
					}

					async function timeoutStop(reason) {
						clearTimeout(startgameCountdown);
						clearInterval(startgameInterval);

						msgReactions.delete(startgameMessage.id);
						startgameEvent.removeAllListeners();

						await startgameMessage.removeReactions();

						if (reason == "forceStop") {
							startgameEmbed.setFooter("");
							startgameEmbed.setTitle(await translate("game.startgame.main.canceledGame", language));
							startgameEmbed.setDescription(
								`:x: ${await translate("game.startgame.main.canceledGameDesc", language)}`
							);
							startgameEmbed.embed.fields[1] = {
								name: `${await translate("game.general.gameSettings", language)}:`,
								value: await objectToString(customGameSettings, false, language),
								inline: false
							};

							await startgameMessage.edit(startgameEmbed);

							return reject();
						} else if (reason == "forceStart") {
							startgameEmbed.setFooter(
								await translate("game.startgame.main.forceStart", language, {
									displayName: msg.member.nick || msg.author.username
								})
							);

							startgameEmbed.embed.fields[1] = {
								name: `${await translate("game.general.gameSettings", language)}:`,
								value: await objectToString(customGameSettings, false, language),
								inline: false
							};
						} else startgameEmbed.setFooter("");

						if (playerList.length < 2) {
							startgameEmbed.setTitle(await translate("game.startgame.main.failedStart", language));
							startgameEmbed.setDescription(
								`:x: ${await translate("game.startgame.error.notEnoughPlayers", language, {
									clientUsername: client.user.username
								})}`
							);

							await startgameMessage.edit(startgameEmbed);

							return reject();
						}

						if (playerList.length > 4) {
							if (!(await hasVoted(msg.author.id))) {
								startgameEmbed.setDescription(
									`:warning: ${await translate("game.startgame.warning.firstFour", language, {
										clientUsername: client.user.username,
										voteURL: topggVoteURL
									})}`
								);
								playerList = playerList.slice(0, 4);
							}
						}

						if (playerList.length > 8) {
							startgameEmbed.setDescription(
								`:warning: ${await translate("game.startgame.warning.firstEight", language)}`
							);
							playerList = playerList.slice(0, 8);
						}

						if (gameSettings.UseOneChannel) {
							startgameEmbed.setDescription(
								`${
									startgameEmbed.embed.description.startsWith(":warning:")
										? `${startgameEmbed.embed.description}\n`
										: ""
								}:white_check_mark: ${await translate(
									"game.startgame.gameStarted.singleChannel",
									language
								)}`
							);
						} else {
							startgameEmbed.setDescription(
								`${
									startgameEmbed.embed.description.startsWith(":warning:")
										? `${startgameEmbed.embed.description}\n`
										: ""
								}:white_check_mark: ${await translate(
									"game.startgame.gameStarted.multiChannel",
									language
								)}`
							);
						}

						startgameEmbed.setTitle(await translate("game.startgame.gameStarted", language));

						await startgameMessage.edit(startgameEmbed);

						return resolve();
					}
				});
			}

			var toReturn = false;

			await setupGameEmbed().catch(async () => {
				// If rejected, delete the document
				await gameModel.deleteOne({ guildID: msg.guildID });

				toReturn = true;

				return;
			});

			if (toReturn) return;
		}

		// Begin setting up the game
		await gameData.updateOne({ status: "loadingGame", startTime: Date.now() });

		await msg.react("loading");

		// Find the card to start the game off with
		var randNumber = Math.floor(Math.random() * 76); // 76 is used to select only normal cards

		gameData.currentCard = gameData.deck[randNumber];
		gameData.deck.splice(randNumber, 1);

		if (gameSettings.UseOneChannel) {
			// Add a player to the gameData
			async function createPlayer(player) {
				return new Promise(async (resolve) => {
					gameData.players[player.id] = {
						username: player.username,
						displayName: player.displayName,
						discriminator: player.discriminator,
						dynamicAvatarURL: player.dynamicAvatarURL,
						channelID: msg.channel.id,
						cards: await addCards(gameData.gameSettings.StartingCards, gameData)
					};

					await gameData.playerOrder.push(player.id); //  Add the player's id to the player order

					resolve();
				});
			}

			//	Run the createPlayer function for each person
			for (i = 0; i < playerList.length; i++) {
				await createPlayer(playerList[i]);
			}

			await msg.channel.createMessage(
				await translate("game.startgame.channelGreeting.single", language, {
					prefix,
					customGameSettings: await objectToString(customGameSettings, false, language)
				})
			);

			// Shuffle the player order and add channel id to channels in that order
			gameData.playerOrder = await shuffleArray(gameData.playerOrder);
			gameData.channelIDs.push(msg.channel.id);
		} else {
			const {
				viewChannel,
				sendMessages,
				addReactions,
				attachFiles,
				manageChannels,
				manageMessages,
				embedLinks,
				readMessageHistory
			} = require("../../node_modules/eris/lib/Constants").Permissions;

			// If a uno category doesn't exist, create one
			var unoCategory = await msg.channel.guild.channels.find((c) => c.name == "uno-category" && c.type == 4);

			if (!unoCategory) {
				unoCategory = await msg.channel.guild.createChannel("uno-category", 4, {
					permissionOverwrites: [
						{
							id: client.user.id,
							allow: [viewChannel, sendMessages, manageChannels, manageMessages]
								.reduce((a, b) => a + b, 0n)
								.toString(),
							type: "member"
						}
					]
				});
			}

			// Find and delete old uno-channel channels
			var scanChannels = await msg.channel.guild.channels.map(async (chan) => {
				async function scanChan() {
					return new Promise(async (resolve, reject) => {
						if (chan.name.includes("-uno-channel")) {
							if ((await hasBotPermissions(["viewChannel", "manageChannels"], chan, false)) == true) {
								await chan.delete();
							}
						}
						resolve();
					});
				}

				await scanChan();
			});

			await Promise.all(scanChannels);

			async function setUpPlayer(player) {
				return new Promise(async (resolve, reject) => {
					gameData.players[player.id] = {
						username: player.username,
						displayName: player.displayName,
						discriminator: player.discriminator,
						dynamicAvatarURL: player.dynamicAvatarURL,
						channelID: "",
						cards: await addCards(gameData.gameSettings.StartingCards, gameData)
					};

					await gameData.playerOrder.push(player.id); //  Add the player's id to the player order

					var channel = await msg.channel.guild.channels.find(
						(c) => c.name == `${player.displayName.toLowerCase()}-uno-channel`
					);

					// Create their uno channel
					if (!channel) {
						channel = await msg.channel.guild.createChannel(`${player.displayName}-uno-channel`, 0, {
							permissionOverwrites: [
								{
									id: msg.channel.guild.id,
									deny: [viewChannel].reduce((a, b) => a + b, 0n).toString(),
									type: "role"
								},
								{
									id: player.id,
									allow: [viewChannel, sendMessages, addReactions]
										.reduce((a, b) => a + b, 0n)
										.toString(),
									type: "member"
								},
								{
									id: client.user.id,
									allow: [
										viewChannel,
										sendMessages,
										addReactions,
										attachFiles,
										manageChannels,
										manageMessages,
										embedLinks,
										readMessageHistory
									]
										.reduce((a, b) => a + b, 0n)
										.toString(),
									type: "member"
								}
							]
						});
					}

					await channel.edit({ parentID: unoCategory.id });
					gameData.players[player.id].channelID = channel.id; //  Set the new channel to the player's data channel

					var pinnedMessages = await channel.getPins();

					if (pinnedMessages) await pinnedMessages.map((m) => m.unpin());

					var greetingMessage = await channel.createMessage(
						await translate("game.startgame.channelGreeting", language, {
							prefix,
							userEnabledOptions: await objectToString(
								await getUserData(player.id, "options"),
								false,
								language
							),
							customGameSettings: await objectToString(customGameSettings, false, language)
						})
					);

					await greetingMessage.pin();

					resolve();
				});
			}

			for (i = 0; i < playerList.length; i++) {
				await setUpPlayer(playerList[i]);
			}

			//	Shuffle the player order and add channel id to channels in that order
			gameData.playerOrder = await shuffleArray(gameData.playerOrder);

			for (var p = 0; p < gameData.playerOrder.length; p++) {
				await gameData.channelIDs.push(gameData.players[gameData.playerOrder[p]].channelID);
			}

			//	Create spectator channel if game settings is enabled
			if (gameSettings.SpectateGame) {
				var spectatorRole = await msg.guild.roles.find((r) => r.name == "Uno Spectator");

				if (!spectatorRole) {
					spectatorRole = await msg.guild.createRole({
						name: "Uno Spectator"
					});
				}

				var spectatorChannel = await msg.guild.channels.find((c) => c.name == "uno-spectators");

				if (!spectatorChannel) {
					spectatorChannel = await msg.channel.guild.createChannel("uno-spectators", 0, {
						permissionOverwrites: [
							{
								id: msg.channel.guild.id,
								deny: [viewChannel].reduce((a, b) => a + b, 0n).toString(),
								type: "role"
							},
							{
								id: spectatorRole.id,
								allow: [viewChannel, sendMessages, addReactions].reduce((a, b) => a + b, 0n).toString(),
								type: "role"
							},
							{
								id: client.user.id,
								allow: [
									viewChannel,
									sendMessages,
									addReactions,
									attachFiles,
									manageChannels,
									manageMessages,
									embedLinks,
									readMessageHistory
								]
									.reduce((a, b) => a + b, 0n)
									.toString(),
								type: "member"
							}
						]
					});
				}

				await gameData.channelIDs.push(spectatorChannel.id);
				await spectatorChannel.edit({ parentID: unoCategory.id });

				await spectatorChannel.createMessage(
					await translate("game.startgame.spectateGreeting", language, {
						prefix,
						customGameSettings: await objectToString(customGameSettings, false, language)
					})
				);
			}
		}

		currentGames.set(msg.guildID, {
			channelIDs: gameData.channelIDs
		});

		if (gameSettings.QuickStart) {
			await gameData.save();
		} else {
			await gameData.updateOne({
				status: "midGame",
				currentCard: gameData.currentCard,
				deck: gameData.deck,
				playerOrder: gameData.playerOrder,
				channelIDs: gameData.channelIDs,
				players: gameData.players
			});
		}

		// Create variables for the embeds
		var currentPosition = gameData.currentPosition;
		var currentPlayerID = gameData.playerOrder[currentPosition];
		var currentPlayerDisplayName = gameData.players[currentPlayerID].displayName;
		var nextPlayerID = gameData.playerOrder[updatePosition(currentPosition, +1, gameData.playerOrder)];
		var nextPlayerDisplayName = gameData.players[nextPlayerID].displayName;
		var currentCard = gameData.currentCard;
		var currentCardColor = getCardColor(currentCard);

		// Write the cards, then send the embeds to the players
		await createCardsImage(gameData.players[gameData.playerOrder[currentPosition]].cards, msg.guildID);

		var cardsLength = gameData.players[gameData.playerOrder[currentPosition]].cards.length;

		// The embed for all other players
		var embed = new Embed()
			.setTitle(
				await translate("game.play.main.embed.title", language, {
					displayName: currentPlayerDisplayName
				})
			)
			.setColor(currentCardColor)
			.setDescription(
				await translate("game.play.main.embed.desc", language, {
					currentCard,
					displayName: currentPlayerDisplayName
				})
			)
			.setThumbnail(`attachment://currentCard.png`)
			.setImage(`attachment://cardsBack.png`)
			.setFooter(
				await translate("game.play.main.embed.footer", language, { displayName: nextPlayerDisplayName })
			);

		// The embed to the person playing the card
		var privateEmbed = new Embed()
			.setTitle(await translate("game.play.main.privateEmbed.title", language))
			.setColor(currentCardColor)
			.setDescription(
				await translate("game.play.main.privateEmbed.desc", language, {
					currentCard
				})
			)
			.setThumbnail(`attachment://currentCard.png`)
			.setImage(`attachment://cardsFront.png`)
			.setFooter(
				await translate("game.play.main.embed.footer", language, { displayName: nextPlayerDisplayName })
			);

		var files = [
			{ file: readFileSync(`./assets/images/defaultCards/${currentCard}.png`), name: `currentCard.png` },
			{ file: readFileSync(`./assets/images/defaultCards/backs/back${cardsLength}.png`), name: `cardsBack.png` }
		];

		var privateEmbedFiles = [
			{ file: readFileSync(`./assets/images/defaultCards/${currentCard}.png`), name: `currentCard.png` },
			{ file: readFileSync(`./assets/images/serverCards/${msg.guildID}_front.png`), name: `cardsFront.png` }
		];

		await sendEmbeds(
			[
				{ embed, files },
				{ recipient: currentPosition, embed: privateEmbed, files: privateEmbedFiles }
			],
			msg,
			gameData,
			{ dmEmbed: 1 }
		);

		await selfPlayCard(msg.channel.guild, gameData, prefix, client.user.id);

		await msg.react("success", "🔄");

		return;
	}
}

module.exports = Startgame;
