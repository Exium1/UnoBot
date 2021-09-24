const Command = require("../../classes/command.js");
var { translate } = require("../../utils/functions");

class Spectate extends Command {
	constructor(client) {
		super(client, {
			name: "spectate",
			aliases: ["spec", "spectator"],
			botPermissions: ["sendMessages", "embedLinks", "addReactions", "manageRoles"],
			category: __dirname // eslint-disable-line
		});
	}

	async run(client, msg, { args }) {
		var language = msg.guild.language;

		var spectatorRole = await msg.guild.roles.find((r) => r.name == "Uno Spectator");

		if (!spectatorRole) {
			spectatorRole = await msg.channel.guild.createRole({
				name: "Uno Spectator"
			});
		}

		if (args[0] == "on" || args[0] == "true") {
			if (msg.member.roles.includes(spectatorRole.id)) {
				return msg.error(await translate("game.spectate.error.alreadyOn", language));
			} else {
				await msg.member.addRole(spectatorRole.id);
				await msg.success(await translate("game.spectate.toggleOn", language));
			}
		} else if (args[0] == "off" || args[0] == "false") {
			if (!msg.member.roles.includes(spectatorRole.id)) {
				return msg.error(await translate("game.spectate.error.alreadyOff", language));
			} else {
				await msg.member.removeRole(spectatorRole.id);
				await msg.success(await translate("game.spectate.toggleOff", language));
			}
		} else return;

		return msg.react("success");
	}
}

module.exports = Spectate;
