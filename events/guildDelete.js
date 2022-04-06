const { prefixes, currentGames, guildLanguages } = require("../utils/collections");
var guildModel = require("../database/models/guild");
var gameModel = require("../database/models/game");

module.exports = async (client, ipc, guild) => {
	console.log(`${client.user.username} was removed from ${guild.name}.`);

	var guildData = await guildModel.findById(guild.id);
	var gameData = await gameModel.findOne({ guildID: guild.id });

	if (guildData) await guildData.remove();
	if (gameData) await gameData.remove();

	prefixes.delete(guild.id);
	currentGames.delete(guild.id);
	guildLanguages.delete(guild.id);
};
