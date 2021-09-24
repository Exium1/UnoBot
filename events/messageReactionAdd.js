const collections = require("../utils/collections");
const { defaultLanguage } = require("../utils/config");
const { translate, endGame } = require("../utils/functions");
const guildModel = require("../database/models/guild.js");
const gameModel = require("../database/models/game.js");

module.exports = async (client, ipc, msg, emoji, reactor) => {
	var msgReaction = collections.msgReactions.get(msg.id);

	if (!msgReaction) return;

	if (msgReaction.action == "helpReaction") {
		if (reactor.id == client.user.id) return;

		var command;

		if (emoji.name == "❗") {
			await msg.delete();

			command = await collections.commands.get("commands");

			await command.run(client, msg, msgReaction.data);
			collections.msgReactions.delete(msg.id);
		}

		if (emoji.name == "📕") {
			await msg.delete();
			collections.msgReactions.delete(msg.id);

			command = await collections.commands.get("guide");

			await command.run(client, msg);
		}

		if (emoji.name == "📜") {
			await msg.delete();
			collections.msgReactions.delete(msg.id);

			command = await collections.commands.get("rules");

			await command.run(client, msg);
		}
	}

	if (msgReaction.action == "startMsgReaction") {
		if (reactor.id == client.user.id) return;

		var { startgameEvent } = require("../utils/eventEmitters.js");

		startgameEvent.emit("startMsgReaction", { guildID: msg.guildID, emoji, reactor, action: "add" });
	}

	if (msgReaction.action == "resetConfirm") {
		if (reactor.id !== msgReaction.userID) return;

		if (emoji.name == "✅") {
			collections.msgReactions.delete(msg.id);

			var guildData = await guildModel.findById(msg.guild.id);
			var gameData = await gameModel.findOne({ guildID: msg.guild.id });

			if (gameData) await endGame(msg.guild, gameData);
			if (guildData) await guildData.remove();

			collections.prefixes.delete(msg.guildID);
			collections.currentGames.set(msg.guildID, false);
			collections.guildLanguages.set(msg.guildID, defaultLanguage);

			await msg.success(
				await translate("config.settings.reset.confirmed", msgReaction.language, msgReaction.data)
			);
		} else if (emoji.name == "❌") {
			collections.msgReactions.delete(msg.id);

			await msg.error(await translate("config.settings.reset.denied", msgReaction.language, msgReaction.data));
		}
	}

	if (msgReaction.action == "resetLBConfirm") {
		if (reactor.id !== msgReaction.userID) return;

		if (emoji.name == "✅") {
			collections.msgReactions.delete(msg.id);

			await msgReaction.guildData.updateOne({ "game.playerStats": {} });

			await msg.success(
				await translate("config.settings.resetlb.confirmed", msgReaction.language, msgReaction.data)
			);
		} else if (emoji.name == "❌") {
			collections.msgReactions.delete(msg.id);

			await msg.error(await translate("config.settings.resetlb.denied", msgReaction.language, msgReaction.data));
		}
	}
};
