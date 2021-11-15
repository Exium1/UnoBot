const Command = require("../../classes/command.js");
const Embed = require("../../classes/embed.js");
const { endGame, translate, sendEmbeds, hasGamePermissions, getGameData } = require("../../utils/functions");
const gameModel = require("../../database/models/game");

class Endgame extends Command {
	constructor(client) {
		super(client, {
			name: "endgame",
			aliases: ["eg"],
			botPermissions: ["sendMessages", "embedLinks", "addReactions", "manageMessages"],
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

		if (gameData) {
			if (!(await hasGamePermissions(msg, gameData))) return;

			if (gameData.status == "preGame") {
				var { startgameEvent } = require("../../utils/eventEmitters.js");

				startgameEvent.emit("endGameCommand");

				if (gameData.startTime.getTime() + 35000 < new Date().getTime()) {
					await gameModel.findByIdAndDelete(gameData._id);
				}

				await msg.react("success");
			} else {
				await msg.react("loading");

				await gameData.updateOne({ status: "endGame" });

				var embed = new Embed().setAuthor(
					await translate("game.endgame.stopping.embed", language, {
						displayName: msg.member.nick || msg.member.username
					}),
					await msg.author.dynamicAvatarURL()
				);

				var privateEmbed = new Embed().setAuthor(
					await translate("game.endgame.stopping.privateEmbed", language),
					await msg.author.dynamicAvatarURL()
				);

				if (gameData.channelIDs.length > 0) {
					await sendEmbeds([{ embed }, { embed: privateEmbed, recipient: msg.author.id }], msg, gameData);
				}

				var { currentGames } = require("../../utils/collections.js");

				currentGames.set(msg.guildID, false);

				setTimeout(async () => {
					await endGame(msg.guild, gameData);

					// Prevent the bot from reacting to a deleted
					if (!gameData.channelIDs.includes(msg.channel.id) || gameData.gameSettings.UseOneChannel == true) {
						return msg.react("success", "loading");
					}
				}, 5000);
			}
		} else return msg.error(await translate("game.endgame.error.noGame", language, { prefix }));
	}
}

module.exports = Endgame;
