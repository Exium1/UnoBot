const Command = require("../../classes/command.js");
const Embed = require("../../classes/embed.js");
var {
	hasBotPermissions,
	addCards,
	sendEmbeds,
	updatePosition,
	getUserData,
	translate,
	objectToString,
	selfPlayCard,
	hasVoted,
	getGameData,
	getCardColor
} = require("../../utils/functions");
const { topggVoteURL } = require("../../utils/config");
var { currentGames } = require("../../utils/collections");
const { readFileSync } = require("fs");

class Joingame extends Command {
	constructor(client) {
		super(client, {
			name: "joingame",
			aliases: ["join", "j", "jg"],
			botPermissions: ["sendMessages", "embedLinks", "addReactions", "manageMessages", "attachFiles"],
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

		if (!gameData) {
			return msg.error(await translate("game.general.error.noOngoingGame", language, { prefix }));
		}

		if (gameData.gameSettings.UseOneChannel == false) {
			if ((await hasBotPermissions(["manageChannels", "viewChannel"], msg.channel, true)) !== true) return;
		}

		if (gameData.playerOrder.includes(msg.author.id)) {
			return msg.error(await translate("game.joingame.error.alreadyJoined", language));
		}

		if (gameData.gameSettings.DisableJoin && gameData.status !== "preGame") {
			return msg.error(await translate("game.joingame.error.joinDisabled", language));
		}

		if (gameData.kickedPlayers.includes(msg.author.id)) {
			return msg.error(await translate("game.joingame.error.kickedBefore", language));
		}

		if (gameData.playerOrder.length + 1 > 4) {
			if (!(await hasVoted(msg.author.id))) {
				return msg.error(
					await translate("game.joingame.error.exceedingVoteMax", language, {
						clientUsername: client.user.username,
						voteLink: topggVoteURL
					})
				);
			}
		}

		if (gameData.playerOrder.length + 1 > 8) {
			return msg.error(await translate("game.joingame.error.exceedingMax", language));
		}

		if (gameData.status == "preGame") {
			var { startgameEvent } = require("../../utils/eventEmitters");

			startgameEvent.emit("playerJoin", msg.guildID, msg.member);

			return msg.react("success");
		} else {
			await msg.react("loading");

			var displayName = msg.member.nick || msg.author.username;

			gameData.players[msg.member.id] = {
				username: msg.member.username,
				displayName: displayName,
				discriminator: msg.author.discriminator,
				dynamicAvatarURL: msg.author.dynamicAvatarURL(),
				channelID: null,
				cards: await addCards(gameData.gameSettings.StartingCards, gameData)
			};

			if (gameData.gameSettings.UseOneChannel == false) {
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

				var channel = await msg.channel.guild.channels.find(
					(c) => c.name == `${displayName.toLowerCase()}-uno-channel`
				);

				// Create their uno channel
				if (!channel) {
					// If a uno category doesn't exist, create one
					var unoCategory = await msg.channel.guild.channels.find(
						(c) => c.name == "uno-category" && c.type == 4
					);

					if (!unoCategory) {
						await msg.react(null, "loading");
						return msg.error(await translate("game.joingame.error.noCategory", language));
					}

					channel = await msg.channel.guild.createChannel(`${displayName.toLowerCase()}-uno-channel`, 0, {
						permissionOverwrites: [
							{
								id: msg.channel.guild.id,
								deny: [viewChannel].reduce((a, b) => a + b, 0n).toString(),
								type: "role"
							},
							{
								id: msg.author.id,
								allow: [viewChannel, sendMessages, addReactions].reduce((a, b) => a + b, 0n).toString(),
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

					gameData.players[msg.member.id].channelID = channel.id;

					// Swaps spectate channel with new channel to be at the end of the channels array
					if (gameData.gameSettings.SpectateGame == true) {
						// Confirms an addition spectator channel exists in the channelIDs array
						if (gameData.channelIDs.length > gameData.playerOrder.length) {
							var spectatorChannel = gameData.channelIDs[gameData.channelIDs.length - 1];

							gameData.channelIDs[gameData.channelIDs.length - 1] = channel.id;
							gameData.channelIDs.push(spectatorChannel);
						}
					} else gameData.channelIDs.push(channel.id);

					var pinnedMessages = await channel.getPins();

					if (pinnedMessages) await pinnedMessages.map((m) => m.unpin());

					await channel.edit({ parentID: unoCategory.id });

					var greetingMessage = await channel.createMessage(
						await translate("game.startgame.channelGreeting", language, {
							prefix,
							userEnabledOptions: await objectToString(
								await getUserData(msg.author.id, "options"),
								false,
								language
							),
							customGameSettings: await objectToString(gameData.customGameSettings, false, language)
						})
					);

					await greetingMessage.pin();

					currentGames.set(msg.guildID, {
						channelIDs: gameData.channelIDs
					});
				}
			} else {
				gameData.players[msg.author.id].channelID = gameData.channelIDs[0];
			}

			gameData.playerOrder.push(msg.author.id);

			await gameData.updateOne({
				channelIDs: gameData.channelIDs,
				playerOrder: gameData.playerOrder,
				deck: gameData.deck,
				players: gameData.players
			});

			var joingameEmbed = new Embed().setAuthor(
				await translate("game.joingame.joined", language, {
					user: `${msg.author.username}#${msg.author.discriminator}`
				}),
				await msg.author.dynamicAvatarURL()
			);

			var joingameEmbedPrivate = new Embed().setAuthor(
				await translate("game.joingame.joinedUser", language),
				await msg.author.dynamicAvatarURL()
			);

			await sendEmbeds(
				[
					{ embed: joingameEmbed },
					{ embed: joingameEmbedPrivate, recipient: gameData.players[msg.author.id].channelID }
				],
				msg,
				gameData
			);

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

			return msg.react("success", "loading");
		}
	}
}

module.exports = Joingame;
