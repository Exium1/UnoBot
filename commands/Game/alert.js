const Command = require("../../classes/command.js");
const Embed = require("../../classes/embed.js");
var { sendEmbeds, translate, getUserData, selfPlayCard, getGameData } = require("../../utils/functions");

class Alert extends Command {
	constructor(client) {
		super(client, {
			name: "alert",
			aliases: ["ping"],
			botPermissions: ["sendMessages", "embedLinks", "addReactions"],
			helpOptions: {
				helpArg: true,
				noArgs: false
			},
			defaultSettings: {
				cooldown: 120
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

		if (gameData.status == "preGame") {
			return msg.error(await translate("game.alert.error.preGame", language));
		}

		if (!gameData.playerOrder.includes(msg.author.id)) {
			return msg.error(await translate("game.general.error.notInGame", language));
		}

		var toPingID = gameData.playerOrder[gameData.currentPosition];
		var toPingOptions = await getUserData(toPingID, "options");

		if (toPingID == msg.author.id) {
			return await msg.error(await translate("game.alert.error.selfAlert", language));
		}

		if (!toPingOptions.AllowAlerts) {
			return await msg.error(
				await translate("game.alert.alertsDisabled", language, {
					displayName: gameData.players[toPingID].displayName
				})
			);
		}

		var toPingChannelID = gameData.players[toPingID].channelID;
		var toPingChannel = await msg.guild.channels.get(toPingChannelID);

		if (toPingChannel) {
			await toPingChannel.createMessage(
				await translate("game.alert.notif", language, { user: `<@${toPingID}>` })
			);
		} else {
			throw await translate("game.general.error.channelNotFound", language, {
				displayName: gameData.players[toPingID].displayName
			});
		}

		var alertEmbed = new Embed().setAuthor(
			await translate("game.alert.alertEmbed", language, {
				alerter: msg.member.nick || msg.author.username,
				alertee: gameData.players[toPingID].displayName
			}),
			gameData.players[toPingID].dynamicAvatarURL
		);

		var alerterEmbed = new Embed().setAuthor(
			await translate("game.alert.alerterEmbed", language, {
				alertee: gameData.players[toPingID].displayName
			}),
			gameData.players[toPingID].dynamicAvatarURL
		);

		var alerteeEmbed = new Embed().setAuthor(
			await translate("game.alert.alerteeEmbed", language, {
				alerter: msg.member.nick || msg.author.username
			}),
			gameData.players[toPingID].dynamicAvatarURL
		);

		await sendEmbeds(
			[
				{ embed: alertEmbed },
				{ embed: alerterEmbed, recipient: gameData.playerOrder.indexOf(msg.author.id) },
				{ embed: alerteeEmbed, recipient: gameData.playerOrder.indexOf(toPingID) }
			],
			msg,
			gameData
		);

		// If it is the bot's turn self play in case it was stuck.
		if (toPingID == client.user.id) {
			await selfPlayCard(msg.guild, gameData, prefix, client.user.id);
		}

		return msg.react("success");
	}
}

module.exports = Alert;
