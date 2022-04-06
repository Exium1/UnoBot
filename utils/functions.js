const sharp = require("sharp");
const mongoose = require("mongoose");
const { existsSync, unlink } = require("fs");
const guildModel = require("../database/models/guild");
const userModel = require("../database/models/user");
const gameModel = require("../database/models/game");
const collections = require("../utils/collections");
const config = require("../utils/config");

module.exports = {
	addCards: async function (count, gameData, position) {
		return new Promise(async (resolve, reject) => {
			var newArrayDeck = [];
			var card;

			for (var num = 0; num < count; num++) {
				if (gameData.deck.length > 0) {
					card = gameData.deck[Math.floor(Math.random() * gameData.deck.length)];

					gameData.deck.splice(gameData.deck.indexOf(card), 1);
				} else {
					var deck = config.cardsArray;

					card = deck[Math.floor(Math.random() * deck.length)];
				}

				newArrayDeck.push(card);
				if (typeof position == "number") gameData.players[gameData.playerOrder[position]].cards.push(card);
			}

			return resolve(newArrayDeck);
		});
	},

	arrayToString: async function (array, bullet, language) {
		var string = "";

		if (!bullet) bullet = "•";

		for (var item = 0; item < array.length; item++) {
			string = string + ` ${bullet} ${array[item]}\n`;
		}
		if (string == "") string = await module.exports.translate("game.general.none", language);

		return string;
	},

	createCardsImage: function (cards, guildID, side = "both") {
		return new Promise(async (resolve, reject) => {
			function createCardsFront() {
				return new Promise(async (resolve, reject) => {
					var cardPaths = [];
					var cardsImageMax = config.cardsImageMax;

					for (var i = 0; i <= cardsImageMax - 1 && i < cards.length; i++) {
						cardPaths.push({
							input: `./assets/images/defaultCards/${cards[i]}.png`,
							left: 95 * i,
							top: 0
						});
					}

					await sharp(`./assets/images/defaultCards/blank.png`, {
						create: {
							width: cardPaths.length * 95,
							height: 137,
							channels: 4,
							background: { r: 0, g: 0, b: 0, alpha: 0 }
						}
					})
						.composite(cardPaths)
						.toFile(`./assets/images/serverCards/${guildID}_front.png`);

					resolve();
				});
			}

			function createCardsBack() {
				return new Promise(async (resolve, reject) => {
					var cardsImageMax = config.cardsImageMax;

					if (
						existsSync(
							`./assets/images/defaultCards/backs/back${
								cards.length < cardsImageMax ? cards.length : cardsImageMax
							}.png`
						)
					)
						return resolve();

					var cardPaths = [];

					for (var i = 0; i <= config.cardsImageMax - 1 && i < cards.length; i++) {
						cardPaths.push({
							input: `./assets/images/defaultCards/back.png`,
							left: 95 * i,
							top: 0
						});
					}

					await sharp(`./assets/images/defaultCards/blank.png`, {
						create: {
							width: cardPaths.length * 95 - 10,
							height: 135,
							channels: 4,
							background: { r: 0, g: 0, b: 0, alpha: 0 }
						}
					})
						.composite(cardPaths)
						.toFile(`./assets/images/defaultCards/backs/back${cards.length}.png`);

					resolve();
					return;
				});
			}

			if (side == "front" || side == "both") await createCardsFront();

			if (side == "back" || side == "both") await createCardsBack();

			return resolve();
		});
	},

	endGame: async function (guild, gameData) {
		return new Promise(async (resolve, reject) => {
			if (!gameData.gameSettings.UseOneChannel) {
				for (var i = 0; i < gameData.channelIDs.length; i++) {
					var channel = guild.channels.get(gameData.channelIDs[i]);

					if (channel) await channel.delete();
				}
			}

			await gameModel.findByIdAndDelete(gameData._id);

			if (existsSync(`./images/serverCards/${guild.id}_front.png`)) {
				//  Delete cards from this server
				unlink(`./images/serverCards/${guild.id}_front.png`, (err) => {
					if (err) {
						console.error(err);
						return;
					}
				});
			}

			collections.currentGames.set(guild.id, false);

			resolve();
			return;
		});
	},

	formatGameSetting: async function (setting) {
		if (["drawuntilmatch", "dum"].includes(setting)) return "DrawUntilMatch";
		else if (["disablejoin", "dj"].includes(setting)) return "DisableJoin";
		else if (["quickstart", "qs"].includes(setting)) return "QuickStart";
		else if (["spectategame", "sg"].includes(setting)) return "SpectateGame";
		else if (["stackcards", "sc"].includes(setting)) return "StackCards";
		else if (["startingcards", "sc"].includes(setting)) return "StartingCards";
		else if (["unocallout", "uc"].includes(setting)) return "UnoCallout";
		else if (["useonechannel", "uoc"].includes(setting)) return "UseOneChannel";
		else return false;
	},

	formatLanguage: async function (language) {
		const languages = require("../lang/languages.json");
		var newLanguage;

		if (!language) return false;

		for (var i = 0; i < languages.length; i++) {
			var languageData = languages[i];
			var languageString = [languageData.code, languageData.language, languageData.region]
				.join(" ")
				.toLowerCase();

			languageString = languageString.replace(/[^a-z ]/g, "");

			if (languageString.includes(language.replace(/[^a-z ]/g, ""))) newLanguage = languageData.code;
		}

		if (newLanguage) return newLanguage;
		else return false;
	},

	formatOption: async function (setting) {
		if (["allowalerts"].includes(setting)) return "AllowAlerts";
		else if (["autoalert", "aa"].includes(setting)) return "AutoAlert";
		else if (["autosay", "as"].includes(setting)) return "AutoSay";
		else if (["autoplay", "ap"].includes(setting)) return "AutoPlay";
		else if (["blockcarderrors", "bce"].includes(setting)) return "BlockCardErrors";
		else if (["dmcards", "dc"].includes(setting)) return "DMCards";
		else if (["hideleaderboardtag", "hlt"].includes(setting)) return "HideLeaderboardTag";
		else if (["hidegloballeaderboardtag", "hglt"].includes(setting)) return "HideGlobalLeaderboardTag";
		else if (["hidestats", "hs"].includes(setting)) return "HideStats";
		else if (["hideglobalstats", "hgs"].includes(setting)) return "HideGlobalStats";
		else return false;
	},

	getCardColor: function (card, raw = false) {
		if (card) {
			var cardColor = card.match(/(red)|(green)|(blue)|(yellow)/);

			if (!cardColor) {
				if (card.includes("wild") && !raw) return "red";
				return false;
			} else return cardColor[0];
		} else return false;
	},

	getCommandData: async function (guildData, command) {
		if (typeof guildData == "string") {
			guildData = await guildModel.findById(guildData);
			if (!guildData) guildData = new guildModel({ _id: guildData });
		}

		if (typeof command == "string") {
			if (!guildData.settings.commands || !guildData.settings.commands[command]) {
				command = await collections.commands.get(command);
				return command.defaultSettings;
			} else return guildData.settings.commands[command];
		} else {
			if (!guildData.settings.commands || !guildData.settings.commands[command.name]) {
				return command.defaultSettings;
			} else return guildData.settings.commands[command.name];
		}
	},

	getGameData: async function (gameData, guildID, create = false) {
		if (gameData) {
			return gameData;
		} else {
			gameData = await gameModel.findOne({ guildID });

			if (gameData) return gameData;
			else if (create) return new gameModel();
			else return false;
		}
	},

	getGuildData: async function (guildID, field) {
		var guildData = (await guildModel.findById(guildID)) || new guildModel({ _id: guildID });

		if (field) return guildData[field];
		else return guildData;
	},

	getUserData: async function (userID, field) {
		var userData = (await userModel.findById(userID)) || new userModel({ _id: userID });

		if (field) return userData[field];
		else return userData;
	},

	hasBotPermissions: async function (permsNeeded, channel, respond = false) {
		var botPermissions = channel.permissionsOf(channel.guild.me);
		var permsMissing = [];

		await permsNeeded.forEach((perm) => {
			if (botPermissions.has(perm) == false) permsMissing.push(perm);
		});

		if (respond && !permsMissing.includes("sendMessages")) {
			if (permsMissing.length > 1) {
				channel.error(
					await module.exports.translate("commands.missingPerms", channel.guild.language, {
						permsMissing
					})
				);
			} else if (permsMissing.length == 1) {
				channel.error(
					await module.exports.translate("commands.missingPerm", channel.guild.language, {
						permsMissing: permsMissing[0]
					})
				);
			}
		}

		return permsMissing.length == 0 ? true : permsMissing;
	},

	hasGamePermissions: async function (msg, gameData) {
		return new Promise(async (resolve, reject) => {
			// Check the user for perms
			var hasPerm = await msg.channel.permissionsOf(msg.author.id).has("administrator");

			if (!hasPerm) hasPerm = gameData.gameCreatorID == msg.author.id;

			if (!hasPerm) {
				await msg.error(await module.exports.translate("game.general.error.noGamePerm", msg.guild.language));
				resolve(false);
			} else resolve(true);

			return;
		});
	},

	hasVoted: async function (userID, toRespond = null, langKey = "commands.error.voteNeeded") {
		return new Promise(async (resolve, reject) => {
			if (!config.voteRestrictions) return resolve(true);
			if (!config.topggToken) return resolve(true);
			if (!config.topggVoteURL) return resolve(true);
			if (config.ownerID == userID) return resolve(true);

			const Topgg = require("@top-gg/sdk");
			const topggApi = new Topgg.Api(config.topggToken);

			if (await topggApi.hasVoted(userID)) {
				return resolve(true);
			} else {
				if (toRespond && toRespond.constructor.name == "Message") {
					await toRespond.error(
						await module.exports.translate(langKey, toRespond.guild.language, {
							clientUsername: await collections.info.get("clientUsername"),
							voteURL: config.topggVoteURL
						})
					);
				}

				return resolve(false);
			}
		});
	},

	matchCards: async function (playedCard, currentCard) {
		if (playedCard.includes("red") && currentCard.includes("red")) return true;
		if (playedCard.includes("yellow") && currentCard.includes("yellow")) return true;
		if (playedCard.includes("green") && currentCard.includes("green")) return true;
		if (playedCard.includes("blue") && currentCard.includes("blue")) return true;

		for (var i = 0; i < 10; i++) {
			if (i == 2) {
				if (playedCard.includes("draw2") && currentCard.includes("draw2")) return true;
				if (
					playedCard.includes(i) &&
					currentCard.includes(i) &&
					!currentCard.includes("draw2") &&
					!playedCard.includes("draw2")
				)
					return true;
			} else if (i == 4) {
				if (playedCard.includes("draw4")) return true;
				if (
					playedCard.includes(i) &&
					currentCard.includes(i) &&
					!currentCard.includes("draw4") &&
					!playedCard.includes("draw4")
				)
					return true;
			} else {
				if (playedCard.includes(i) && currentCard.includes(i)) return true;
			}
		}

		if (playedCard.includes("reverse") && currentCard.includes("reverse")) return true;
		if (playedCard.includes("skip") && currentCard.includes("skip")) return true;
		if (playedCard.includes("draw2") && currentCard.includes("draw2")) return true;
		if (playedCard.includes("wild")) return true;

		return false;
	},

	objectToString: async function (object, bullet, language) {
		var string = "";

		if (!bullet) bullet = "•";

		var objectKeys = Object.keys(object);

		for (var item = 0; item < objectKeys.length; item++) {
			if (typeof object[objectKeys[item]] == "boolean") string = string + ` ${bullet} ${objectKeys[item]}\n`;
			else string = string + ` ${bullet} ${objectKeys[item]}: ${object[objectKeys[item]]}\n`;
		}
		if (string == "") string = await module.exports.translate("game.general.none", language);

		return string;
	},

	selfPlayCard: async function (guild, gameData, prefix, clientUserID) {
		return new Promise(async (resolve, reject) => {
			if (!gameData.playerOrder.includes(clientUserID)) return resolve();
			else if (gameData.playerOrder[gameData.currentPosition] !== clientUserID) return resolve();

			setTimeout(async () => {
				var channelID = gameData.players[clientUserID].channelID;
				var cards = gameData.players[clientUserID].cards;
				var currentCard = gameData.currentCard;
				var gameSettings = gameData.gameSettings;

				var colorOfCard = module.exports.getCardColor(currentCard);
				var typeOfCard = currentCard.match(/draw2|draw4|reverse|skip|wild|[0-9]/)[0];
				var colors = [];
				var matchingCards = [];

				if (gameSettings.StackCards == true && gameData.stackedCards > 0) {
					cards.forEach((c) =>
						(c.includes("draw2") && currentCard.includes("draw2")) || c.includes("draw4")
							? matchingCards.push(c)
							: false
					);

					if (matchingCards.length > 0) {
						matchingCards.sort((a, b) => {
							if (b.includes("draw2") && b.includes(colorOfCard)) return 1;
							if (b.includes("draw2") && !b.includes(colorOfCard)) return -1;
							if (b.includes("draw4")) return -1;
							else return 0;
						});
					}
				} else {
					// Runs when the bot cannot stack cards

					for (var i = 0; i < cards.length; i++) {
						// Push colors into colors array for most common color
						if (module.exports.getCardColor(cards[i], true)) {
							colors.push(module.exports.getCardColor(cards[i]));
						}

						// Color match
						if (cards[i].includes(colorOfCard)) {
							matchingCards.push(cards[i]);
						}

						// Number match
						else if (cards[i].includes(typeOfCard) && !cards[i].includes("draw")) {
							matchingCards.push(cards[i]);
						}

						// Type match
						else if (cards[i].includes(typeOfCard) && typeOfCard.includes("draw")) {
							matchingCards.push(cards[i]);
						}

						// Wild card matches always
						else if (cards[i].includes("wild")) {
							matchingCards.push(cards[i]);
						}
					}

					matchingCards.sort((a, b) => {
						if (a.includes(colorOfCard) && b.includes(colorOfCard)) {
							if (a.match(/(draw)|(skip)|(reverse)/)) return 1;
							else return -1;
						}
						if (a == "wilddraw4") return 1;
						if (b == "wilddraw4") return -1;
						if (a.includes("wild")) return 1;
						if (b.includes("wild")) return -1;
						if (a.includes(colorOfCard)) return -1;
						if (b.includes(colorOfCard)) return 1;
						else return 0;
					});
				}

				if (matchingCards.length == 0) {
					var channel = await guild.channels.get(channelID);

					console.log("> SelfPlay => Draw");

					channel.createMessage(`${prefix}draw`);

					return resolve("DREW");
				}

				var bestCard = matchingCards[0];

				if (bestCard.includes("wild")) {
					var commonColor = "";
					var counts = {};
					var compare = 0;

					//caching length in len variable
					for (i = 0; i < colors.length; i++) {
						var color = colors[i];

						if (!counts[color]) counts[color] = 1;
						else counts[color] = counts[color] + 1;

						if (counts[color] > compare) {
							compare = counts[color];
							commonColor = colors[i];
						}
					}

					if (!commonColor) commonColor = "red";

					bestCard = commonColor + bestCard;
				}

				channel = await guild.channels.get(channelID);

				await channel.createMessage(`${prefix}play ${bestCard}`);

				return resolve(`PLAYED ${bestCard}`);
			}, 1000);
		});
	},

	sendEmbeds: async function (addresses = [], msg, gameData, options) {
		return new Promise(async (resolve, reject) => {
			var guild = msg.channel.guild;
			var defaultOptions = {
				autoPing: false,
				dmEmbed: false,
				exclude: null
			};

			options = Object.assign(defaultOptions, options); // Override the default options with new options

			if (typeof addresses == "object" && addresses.constructor !== Array) addresses = [addresses];

			if (addresses.constructor.name == "Embed") addresses = [{ addresses }];
			else if (addresses[0].constructor.name == "Embed") addresses[0] = { embed: addresses[0] };

			if (!addresses[0].recipient) addresses[0].recipient = "default";

			//if (!options.forceDM) options.forceDM = false;
			if (!options.autoPing) options.autoPing = false;
			if (!options.dmEmbed) options.dmEmbed = false;

			// Add new fields to items referenced in options before reordering addresses
			if (options.autoPing !== false) addresses[options.autoPing].autoPing = true;
			if (options.dmEmbed !== false) addresses[options.dmEmbed].dmEmbed = true;

			var sentChannels = []; // Channels that have had an embed sent to them. Channels not here will be sent default embeds
			var defaultEmbed = await addresses.find((a) => a.recipient == "default");

			// Move default embed to the end of addresses
			if (defaultEmbed) {
				var defaultEmbedIndex = addresses.indexOf(defaultEmbed);

				addresses.splice(defaultEmbedIndex, 1);
				addresses.push(defaultEmbed);
			}

			async function sendEmbed(address) {
				return new Promise(async (resolve, reject) => {
					var { recipient, embed, files } = address;
					var userOptions = {};
					var channelID;
					var playerID;

					// If recipient is a channelID
					if (typeof recipient == "string") {
						userOptions = {};
						channelID = recipient;
						playerID = null;
					} else {
						// If recipient is a playerOrder number
						channelID = gameData.players[gameData.playerOrder[recipient]].channelID;
						playerID = gameData.playerOrder[recipient];
					}

					if (playerID) userOptions = await userModel.findById(gameData.playerOrder[playerID]);
					if (userOptions && userOptions.options) userOptions = userOptions.options;
					else userOptions = {};

					// Send embed to dm channel
					if (address.dmEmbed && (userOptions.DMCards || gameData.gameSettings.UseOneChannel)) {
						// Send embed to DM's if requested & user has enabled option
						if (playerID == (await collections.info.get("clientUserID"))) return resolve("BOT DM CHANNEL");

						var recipientUser = (await guild.members.get(playerID)).user;
						var recipientDMChannel = await recipientUser.getDMChannel();

						await recipientDMChannel.createMessage({ embeds: [embed] }, files);

						resolve(recipientDMChannel.id);
					} else {
						if (!address.dmEmbed && !address.default && gameData.gameSettings.UseOneChannel) {
							resolve();
						} else {
							var recipientChannel = await guild.channels.get(channelID);

							if (!recipientChannel) return reject(`No channel found with ID ${channelID}.`);

							await recipientChannel.createMessage({ embeds: [embed] }, files);
							if (address.autoPing && userOptions.AutoPing) {
								await recipientChannel.createMessage(
									await module.exports.translate("game.general.autoPing.notif", msg.guild.language, {
										userMention: `<@${playerID}>`
									})
								);
							}
						}

						resolve(channelID);
					}
				});
			}

			for (var index = 0; index < addresses.length; index++) {
				if (addresses[index].recipient == "default") {
					defaultEmbed = addresses[index];
					addresses.pop();

					async function addAddress(gameChannelID) {
						return new Promise((resolve) => {
							var newAddress = Object.assign({}, defaultEmbed);

							newAddress.recipient = gameChannelID;
							newAddress.default = true;
							addresses.push(newAddress);

							resolve();
						});
					}

					for (var i = 0; i < gameData.channelIDs.length; i++) {
						var gameChannelID = gameData.channelIDs[i];

						if (!sentChannels.includes(gameChannelID) && options.exclude !== gameChannelID) {
							await addAddress(gameChannelID);
						}
					}
				}

				if (!addresses[index]) continue;
				if (!addresses[index].files) addresses[index].files = [];

				if (addresses[index]) {
					await sendEmbed(addresses[index])
						.then((sentChannelID) => {
							sentChannels.push(sentChannelID);

							//console.log(`Sent #${sentChannelID}.`);
						})
						.catch((err) => console.log(err));
				}
			}

			resolve();
		});
	},

	shuffleArray: function (array) {
		// Shuffles an ar+ray
		var currentIndex = array.length,
			temporaryValue,
			randomIndex;

		// While there remain elements to shuffle...
		while (0 !== currentIndex) {
			// Pick a remaining element...
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex -= 1;

			// And swap it with the current element.
			temporaryValue = array[currentIndex];
			array[currentIndex] = array[randomIndex];
			array[randomIndex] = temporaryValue;
		}

		return array;
	},

	solveCard: async function (toSolve) {
		return new Promise(async (resolve, reject) => {
			var solvedCard = "";
			var originalCard = toSolve.join(" ");

			toSolve = toSolve
				.join("")
				.toLowerCase()
				.replace(/[^a-zA-Z0-9+]|card|play/g, ""); //  Removes everything but letters, numbers, and + symbol

			//  Replace spelt out numbers with numbers
			if (toSolve.match(/zero|one|two|three|four|five|six|seven|eight|nine/)) {
				if (toSolve.includes("zero")) toSolve = toSolve.replace(/zero/g, "0");
				else if (toSolve.includes("one")) toSolve = toSolve.replace(/one/g, "1");
				else if (toSolve.includes("two")) toSolve = toSolve.replace(/two/g, "2");
				else if (toSolve.includes("three")) toSolve = toSolve.replace(/three/g, "3");
				else if (toSolve.includes("four")) toSolve = toSolve.replace(/four/g, "4");
				else if (toSolve.includes("five")) toSolve = toSolve.replace(/five/g, "5");
				else if (toSolve.includes("six")) toSolve = toSolve.replace(/six/g, "6");
				else if (toSolve.includes("seven")) toSolve = toSolve.replace(/seven/g, "7");
				else if (toSolve.includes("eight")) toSolve = toSolve.replace(/eight/g, "8");
				else if (toSolve.includes("nine")) toSolve = toSolve.replace(/nine/g, "9");
			}

			//  Searches string for a color
			if (toSolve.includes("red")) {
				toSolve = toSolve.replace(/red/g, "");
				solvedCard += "red";
			} else if (toSolve.includes("green")) {
				toSolve = toSolve.replace(/green/g, "");
				solvedCard += "green";
			} else if (toSolve.includes("blue")) {
				toSolve = toSolve.replace(/blue/g, "");
				solvedCard += "blue";
			} else if (toSolve.includes("yellow")) {
				toSolve = toSolve.replace(/yellow/g, "");
				solvedCard += "yellow";
			}

			//  Check for abbreviated colors
			if (solvedCard == "") {
				if (toSolve.startsWith("r") && !toSolve.startsWith("rev")) {
					solvedCard += "red";
					toSolve = toSolve.substring(1);
					if (toSolve.startsWith("ed")) toSolve = toSolve.substring(2);
				} else if (toSolve.startsWith("g")) {
					solvedCard += "green";
					toSolve = toSolve.substring(1);
					if (toSolve.startsWith("reen")) toSolve = toSolve.substring(4);
				} else if (toSolve.startsWith("b")) {
					solvedCard += "blue";
					toSolve = toSolve.substring(1);
					if (toSolve.startsWith("lue")) toSolve = toSolve.substring(3);
				} else if (toSolve.startsWith("y")) {
					solvedCard += "yellow";
					toSolve = toSolve.substring(1);
					if (toSolve.startsWith("ellow")) toSolve = toSolve.substring(5);
				}
			}

			//  Searches string for numbers
			if (toSolve.match(/[0-9]/g)) {
				if (toSolve.match(/(\+2)|(draw2)|(d2)|(plus2)|(p2)/)) {
					toSolve = toSolve.replace(/(\+2)|(draw2)|(d2)|(plus2)|(p2)/g, "");
					solvedCard += "draw2";
				} else if (toSolve.match(/(\+4)|(w\+4)|(wildraw4)|(draw4)|(d4)|wild4|(w4)|(plus4)|(p4)|(wild)/)) {
					toSolve = toSolve.replace(
						/(\+4)|(w\+4)|(wildraw4)|(draw4)|(d4)|wild4|(w4)|(plus4)|(p4)|(wild)/g,
						""
					);
					solvedCard += "wilddraw4";
				} else {
					solvedCard += toSolve.match(/[0-9]/);
					toSolve = toSolve.replace(/[0-9]/g, "");
				}
			}

			//  If no number is found, look for skip, reverse, or wild cards
			else {
				if (toSolve.startsWith("s")) {
					solvedCard += "skip";
					toSolve = toSolve.substring(1);
					if (toSolve.startsWith("kip")) toSolve = toSolve.substring(3);
				} else if (toSolve.startsWith("r")) {
					solvedCard += "reverse";
					toSolve = toSolve.substring(1);
					if (toSolve.startsWith("eversed")) toSolve = toSolve.substring(7);
					else if (toSolve.startsWith("everse")) toSolve = toSolve.substring(6);
				} else if (toSolve.startsWith("w")) {
					solvedCard += "wild";
					toSolve = toSolve.substring(1);
					if (toSolve.startsWith("ild")) toSolve = toSolve.substring(3);
				} else {
					console.log(`> ${originalCard} => NO NUMBER`);
					return reject("NO_NUMBER");
				}
			}

			//  Check for colors if solvedCard still does not have them
			if (!module.exports.getCardColor(solvedCard, true)) {
				if (toSolve.startsWith("r")) solvedCard = "red" + solvedCard;
				else if (toSolve.startsWith("g")) solvedCard = "green" + solvedCard;
				else if (toSolve.startsWith("b")) solvedCard = "blue" + solvedCard;
				else if (toSolve.startsWith("y")) solvedCard = "yellow" + solvedCard;
				else {
					if (solvedCard.includes("wild")) {
						console.log(`> ${originalCard} => NO WILD COLOR`);
						return reject("WILD_NO_COLOR");
					} else {
						console.log(`> ${originalCard} => NO COLOR`);
						return reject("NO_COLOR");
					}
				}
			}

			console.log(`> ${originalCard} => ${solvedCard}`);
			return resolve(solvedCard);
		});
	},

	translate: async function (text, language, keys = {}) {
		return new Promise(async (resolve, reject) => {
			if (!language || language == undefined) language = config.defaultLanguage;
			if (language.length !== 5) language = await collections.guildLanguages.get(language); // Allows the guildID to be passed through instead of language

			var languageFile = await collections.languages.get(language);

			if (!languageFile) return resolve("Language error");

			var translatedText = languageFile[text];

			if (!translatedText) {
				return resolve(`Missing \`${text}\``);
			}

			var isArray = Array.isArray(translatedText);

			if (isArray) {
				if (translatedText.length == 0) return resolve(false);
				if (translatedText.length > 1) {
					translatedText = translatedText.join("&&&"); // Temp join the arr elements to replace with keys
				} else {
					translatedText = translatedText[0];
					isArray = false;
				}
			} else {
				if (translatedText == undefined) return resolve("No translation available");
			}

			for (var i = 0; i < Object.keys(keys).length; i++) {
				var key = Object.keys(keys)[i];
				var regex = new RegExp(`({{${key}}})`, "g");

				translatedText = await translatedText.replace(
					regex,
					Array.isArray(keys[key]) ? keys[key].join(", ") : keys[key]
				);
			}

			translatedText = await translatedText.replace(/(\[\[)|(\]\])/g, "");

			if (isArray) {
				translatedText = translatedText.split("&&&");
			}

			resolve(translatedText);
		});
	},

	updateGuildStats: async function (winnerID, loserIDs, guild) {
		return new Promise(async (resolve, reject) => {
			var guildData = await guildModel.findById(guild.id);
			var newUser = false;

			if (!guildData) {
				newUser = true;
				guildData = new guildModel({
					_id: guild.id,
					name: guild.name
				});
			}

			async function updatePlayer(playerID, result) {
				var userStats = guildData.game.stats[playerID];

				if (!userStats) {
					userStats = {
						totalGames: 0,
						totalWins: 0,
						totalLosses: 0,
						winPercentage: "0%"
					};
				}

				userStats.totalGames++;
				if (result == "win") userStats.totalWins++;
				if (result == "loss") userStats.totalLosses++;
				userStats.winPercentage = Math.round(100 * (userStats.totalWins / userStats.totalGames)) + "%";
				guildData.game.stats[playerID] = userStats;
			}

			await updatePlayer(winnerID, "win");

			for (var i = 0; i < loserIDs.length; i++) {
				await updatePlayer(loserIDs[i], "loss");
			}

			var memberStats = guildData.game.stats;

			var newMemberStats = {};
			var keys = Object.keys(memberStats);
			var values = Object.values(memberStats);

			//  Sort the values and keys by totalWins separately
			values.sort((a, b) => (a.totalWins < b.totalWins ? 1 : -1));
			keys.sort((a, b) => (memberStats[a].totalWins < memberStats[b].totalWins ? 1 : -1));

			//  Give rank by position in array
			for (i = 0; i < values.length; i++) {
				values[i].rank = i + 1;
			}

			//  Combine values and keys back together
			for (i = 0; i < keys.length; i++) {
				newMemberStats[keys[i]] = values[i];
			}

			if (newUser) await guildData.save();
			else await guildData.updateOne({ "game.stats": newMemberStats });

			resolve();
			return;
		});
	},

	updatePosition: function (currentPosition, index, playerOrder) {
		// Adjust/update the current position, used to loop around the playerOrder
		currentPosition = currentPosition + index;

		if (currentPosition == playerOrder.length) {
			currentPosition = 0;
		}
		if (currentPosition == playerOrder.length + 1) {
			currentPosition = 1;
		}
		if (currentPosition == -1) {
			currentPosition = playerOrder.length - 1;
		}
		if (currentPosition == -2) {
			currentPosition = playerOrder.length - 2;
		}

		return currentPosition;
	},

	updateUserStats: async function (winner, losers) {
		return new Promise(async (resolve, reject) => {
			async function adjustPlayer(player, result) {
				var playerData = await userModel.findById(player.id);
				var newUser = false;

				if (!playerData) {
					newUser = true;
					playerData = new userModel({
						_id: player.id,
						username: player.username,
						discriminator: player.discriminator
					});
				}

				var playerStats = playerData.stats;

				if (Object.keys(playerStats).length == 0) {
					playerStats = {
						totalGames: 0,
						totalWins: 0,
						totalLosses: 0,
						winPercentage: "0%"
					};
				}

				playerStats.totalGames++;
				if (result == "win") playerStats.totalWins++;
				if (result == "loss") playerStats.totalLosses++;
				playerStats.winPercentage = Math.round(100 * (playerStats.totalWins / playerStats.totalGames)) + "%";
				playerData.stats = playerStats;

				if (newUser) await playerData.save();
				else
					await playerData.updateOne({
						stats: playerStats,
						username: player.username,
						discriminator: player.discriminator
					});
			}

			await adjustPlayer(winner, "win");

			for (var i = 0; i < losers.length; i++) {
				await adjustPlayer(losers[i], "loss");
			}

			resolve();
			return;
		});
	},

	updateUserRanks: async function () {
		return new Promise(async (resolve, reject) => {
			console.log("Updating Global User Ranks...");

			var db = mongoose.connection;
			var docCount = await db.collection("users").countDocuments();

			// Finds the amount of docs where total wins are void
			await userModel.find({ "stats.totalWins": null }, async (err, res) => {
				docCount = docCount - res.length;
			});

			// Sorts "users" collection by total wins, then total games
			await db
				.collection("users")
				.aggregate([{ $sort: { "stats.totalWins": -1, "stats.totalGames": -1, _id: 1 } }], {
					allowDiskUse: true
				})
				.toArray()
				.then(async (data) => await updateDocuments(data));

			// Updates users in order while assigning ranks
			async function updateDocuments(data) {
				var sortedUsersAmount = 0;

				data.forEach(async (user) => {
					if (typeof user.stats.totalWins == "number") {
						sortedUsersAmount++;
						await db
							.collection("users")
							.updateOne({ _id: user._id }, { $set: { "stats.rank": sortedUsersAmount } });
					}
				});
			}

			console.log("Updated Global User Ranks.");

			return resolve();
		});
	}
};
