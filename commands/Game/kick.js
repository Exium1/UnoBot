const Command = require("../../classes/command.js");
const Embed = require("../../classes/embed.js");
var {
	hasBotPermissions,
	sendEmbeds,
	updatePosition,
	translate,
	selfPlayCard,
	endGame,
	createCardsImage,
	hasGamePermissions,
	getGameData
} = require("../../utils/functions");
const { readFileSync } = require("fs");

class Kick extends Command {
	constructor(client) {
		super(client, {
			name: "kick",
			aliases: ["remove"],
			botPermissions: ["sendMessages", "embedLinks", "addReactions", "manageMessages", "attachFiles"],
			category: __dirname // eslint-disable-line
		});
	}

	async run(client, msg, { prefix, gameData, args, commandData }) {
		var language = msg.guild.language;

		gameData = await getGameData(gameData, msg.guildID);

		if (gameData) {
			if (!(await hasGamePermissions(msg, gameData, commandData))) return;
		} else {
			return msg.error(await translate("game.general.error.noOngoingGame", language, { prefix }));
		}

		if (!gameData.gameSettings.UseOneChannel) {
			if ((await hasBotPermissions(["manageChannels", "viewChannel"], msg.channel, true)) !== true) return;
		}

		var toKick;

		if (msg.mentions.length > 0) {
			toKick = msg.mentions[0];
			toKick = await msg.guild.members.get(toKick.id);
		}

		if (!toKick) {
			if (args[0].includes("#")) {
				var username = args[0].slice(0, args[0].indexOf("#"));
				var discriminator = args[0].slice(args[0].indexOf("#") + 1);

				toKick = await msg.guild.members.find(
					(m) => m.user.username.toLowerCase() == username && m.user.discriminator == discriminator
				);
			} else {
				toKick = await msg.guild.members.find((m) => m.user.username.toLowerCase() == args[0]);
			}
		}

		if (!toKick) return msg.error(await translate("game.kick.error.noUser", language));

		if (toKick.id == msg.author.id) {
			return msg.error(await translate("game.kick.error.selfKick", language));
		}

		if (gameData.status == "preGame") {
			var { startgameEvent } = require("../../utils/eventEmitters.js");

			startgameEvent.emit("playerLeave", msg.guildID, toKick.id);

			await msg.react("success");
		} else {
			if (!gameData.playerOrder.includes(toKick.id)) {
				return await msg.error(
					await translate("game.kick.error.notInGame", language, {
						user: `${toKick.username}#${toKick.discriminator}`
					})
				);
			}

			await msg.react("loading");

			var kickedUserEmbed = new Embed().setAuthor(
				await translate("game.kick.kicked", language, {
					user: `${toKick.user.username}#${toKick.user.discriminator}`
				}),
				await gameData.players[toKick.id].dynamicAvatarURL
			);

			await gameData.deck.concat(gameData.players[toKick.id].cards);
			await gameData.playerOrder.splice(gameData.playerOrder.indexOf(toKick.id), 1);
			await gameData.kickedPlayers.push(toKick.id);

			if (!gameData.gameSettings.UseOneChannel) {
				gameData.channelIDs.splice(gameData.channelIDs.indexOf(gameData.players[toKick.id].channelID), 1);

				var oldChannel = await msg.guild.channels.get(gameData.players[toKick.id].channelID);

				if (oldChannel) await oldChannel.delete();
			}

			delete gameData.players[toKick.id];

			if (currentPosition > gameData.playerOrder.indexOf(toKick.id)) {
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

			await sendEmbeds([{ embed: kickedUserEmbed }], msg, gameData);

			var { currentGames } = require("../../utils/collections.js");

			if (gameData.playerOrder.length == 1) {
				currentGames.set(msg.guildID, false);

				var winner = gameData.players[gameData.playerOrder[0]];
				var oldUserDisplayName = toKick.nick || toKick.user.username;

				var finishedGameEmbedPrivate = new Embed()
					.setTitle(await translate("game.play.end.privateEmbed.title", language))
					.setDescription(await translate("game.kick.kicked", language, { user: oldUserDisplayName }))
					.setImage(`${msg.author.dynamicAvatarURL(null, 2048)}`)
					.setFooter(await translate("game.kick.incompleteGame", language));

				var finishedGameEmbed = new Embed()
					.setTitle(
						await translate("game.play.end.embed.title", language, { displayName: winner.displayName })
					)
					.setDescription(await translate("game.kick.kicked", language, { user: oldUserDisplayName }))
					.setImage(`${msg.author.dynamicAvatarURL(null, 2048)}`)
					.setFooter(await translate("game.kick.incompleteGame", language));

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
				var currentCardColor = currentCard.match(/(red)|(green)|(blue)|(yellow)/)[0];

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

				await msg.react("success, loading");
			}
		}
	}
}

module.exports = Kick;
