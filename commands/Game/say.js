const Command = require("../../classes/command.js");
const Embed = require("../../classes/embed.js");
var { translate, sendEmbeds, getGameData } = require("../../utils/functions");

class Say extends Command {
	constructor(client) {
		super(client, {
			name: "say",
			aliases: [],
			botPermissions: ["sendMessages", "embedLinks", "addReactions"],
			helpOptions: {
				helpArg: true,
				noArgs: false
			},
			category: __dirname, // eslint-disable-line
			allowNoPrefix: true
		});
	}

	async run(client, msg, { prefix, gameData, args }) {
		var language = msg.guild.language;

		gameData = await getGameData(gameData, msg.guildID);

		if (!gameData || !gameData.playerOrder.includes(msg.author.id)) {
			return msg.error(await translate("game.general.error.gameRequired", language, { prefix }));
		}

		var player;

		if (msg.mentions.length > 0) player = msg.mentions[0];

		if (args[0].startsWith("@")) {
			args[0] = args[0].splice(1);

			if (args[0].includes("#")) {
				var username = args[0].splice(0, args[0].indexOf("#"));
				var discriminator = args[0].splice(args[0].indexOf("#") + 1);

				player = await msg.guild.members.find(
					(m) => m.user.username.toLowerCase() == username && m.user.discriminator == discriminator
				);
			} else {
				player = await msg.guild.members.find((m) => m.user.username.toLowerCase() == args[0]);
			}

			if (player) player = player.user;
			else {
				return msg.error(await translate("game.say.error.noPlayer", language, { player: args[0] }), {
					bold: false
				});
			}

			if (!gameData.playerOrder.includes(player.id)) {
				return msg.error(
					await translate("game.say.error.notInGame", language, { username: player.user.username }),
					{ bold: false }
				);
			}
		}

		var sayEmbed = new Embed();
		var Args = msg.content.split(/ +/).slice(1);
		var displayName = msg.member.nick || msg.author.username;

		if (player) {
			sayEmbed
				.setAuthor(
					`${await translate("game.say.embed.author.dm", language, {
						displayName
					})}:`,
					msg.author.dynamicAvatarURL()
				)
				.setDescription(Args.slice(1).join(" "));

			var playerChannel = await msg.guild.channels.get(gameData.players[player.id].channelID);

			if (playerChannel) {
				await playerChannel.createMessage(sayEmbed);
			} else {
				throw await translate("game.general.error.channelNotFound", language, {
					displayName: gameData.players[player.id].displayName
				});
			}
		} else {
			sayEmbed
				.setAuthor(
					`${await translate("game.say.embed.author", language, {
						displayName
					})}:`,
					msg.author.dynamicAvatarURL()
				)
				.setDescription(Args.join(" "));

			await sendEmbeds([{ embed: sayEmbed }], msg, gameData, { exclude: msg.channel.id });
		}

		return msg.react("success");
	}
}

module.exports = Say;
