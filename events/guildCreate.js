var guildModel = require("../database/models/guild");

module.exports = async (client, ipc, guild) => {
	console.log(`${client.user.username} was added to ${guild.name}.`);

	if (await guildModel.findById(guild.id)) return;

	var newGuild = new guildModel({
		_id: guild.id,
		name: guild.name,
		ownerID: guild.ownerID
	});

	await newGuild.save();
};
