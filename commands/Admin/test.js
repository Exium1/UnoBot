const Command = require("../../classes/command.js");
const Embed = require("../../classes/embed.js");
var { getCardColor } = require("../../utils/functions");

class Test extends Command {
	constructor(client) {
		super(client, {
			name: "test",
			aliases: ["t"],
			botPermissions: ["sendMessages", "embedLinks", "addReactions", "manageMessages"],
			memberPermissions: [],
			helpOptions: {
				helpArg: false,
				noArgs: false
			},
			category: __dirname, // eslint-disable-line
			ownerOnly: true,
			cooldown: 0
		});
	}

	async run(client, msg, data) {
		await msg.react("success");

		return;
	}
}

module.exports = Test;
