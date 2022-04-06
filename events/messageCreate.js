const collections = require("../utils/collections");
const { ownerID } = require("../utils/config");
const { hasBotPermissions, getCommandData, translate } = require("../utils/functions");
const gameModel = require("../database/models/game");
const guildModel = require("../database/models/guild");
const userModel = require("../database/models/user");
var commandCooldowns = {};

module.exports = async (client, ipc, msg) => {
	if (msg.channel.type !== 0) return;
	if (msg.author.bot && msg.author.id !== client.user.id) return;
	if (msg.channel.guild && !msg.channel.permissionsOf(client.user.id).has("sendMessages")) return;

	var guildData;
	var msgArray = msg.content.split(/ +/); // Array of words in the message
	var prefix = await collections.prefixes.get(msg.guildID);
	var data = {};

	if (prefix === undefined || !prefix) {
		guildData = await guildModel.findById(msg.guildID);

		if (!guildData || !guildData._id) {
			guildData = await new guildModel({
				_id: msg.guildID,
				name: msg.channel.guild.name,
				ownerID: msg.channel.guild.ownerID
			});

			await guildData.save();
		} else if (guildData.ownerID !== msg.guild.ownerID) await guildData.updateOne({ ownerID: msg.guild.ownerID });

		collections.guildLanguages.set(msg.guildID, guildData.language);
		collections.prefixes.set(msg.guildID, guildData.prefix);
		prefix = guildData.prefix;
	}

	// Get current gameData for no prefix commands
	if (!msg.content.toLowerCase().startsWith(prefix.toLowerCase())) {
		if (msg.author.id == client.user.id) return;

		var currentGame = collections.currentGames.get(msg.guildID);
		var gameData;

		if (currentGame == undefined) {
			gameData = await gameModel.findOne({ guildID: msg.guildID });

			if (!gameData) {
				return collections.currentGames.set(msg.guildID, false);
			} else {
				collections.currentGames.set(msg.guildID, {
					channelIDs: gameData.channelIDs
				});

				currentGame = { channelIDs: gameData.channelIDs };
			}
		}

		// Filters out messages not in game channels
		if (!currentGame || !currentGame.channelIDs.includes(msg.channel.id)) return;

		if (!gameData) gameData = await gameModel.findOne({ guildID: msg.guildID });
		if (!gameData) return;

		msgArray[0] = prefix + msgArray[0];
		data.noPrefixChannel = true;
	}

	// Accommodate for possible gap between prefix and first arg
	if (msgArray[0].toLowerCase() == prefix.toLowerCase()) {
		msgArray[0] = msgArray[0] + msgArray[1];
		msgArray.splice(1, 1);
		msg.content = msgArray.join(" ");
	}

	var commandName = [...msgArray].shift().toLowerCase().slice(prefix.length); // Clones msgArray and gets the command name from the 1st arg

	if (!commandName) return;

	var command = await collections.commands.get(commandName);

	if (!command) command = await collections.commands.get(collections.aliases.get(commandName));

	var userData;

	if ((!command || !command.allowNoPrefix) && data.noPrefixChannel) {
		userData = (await userModel.findById(msg.author.id)) || new userModel();

		if (gameData.playerOrder[gameData.currentPosition] == msg.author.id && userData.options.AutoPlay) {
			command = await collections.commands.get("play");
			msg.content = `${prefix}play ` + msg.content;
		} else if (userData.options.AutoSay) {
			command = await collections.commands.get("say");
			msg.content = `${prefix}say ` + msg.content;
		} else return;
	}

	if (command) {
		if (command.ownerOnly && msg.author.id !== ownerID) return;

		if (msg.guild) {
			msg.guild.language = guildData ? guildData.language : await collections.guildLanguages.get(msg.guildID);
		}

		commandName = command.name.toLowerCase();

		var args = msg.content.toLowerCase().split(/ +/).slice(1);

		// Send the help embed if the command's help options are reached
		if (
			(args[0] == "help" && command.helpOptions.helpArg == true) ||
			(args[0] == null && command.helpOptions.noArgs == true)
		) {
			// Require only basic perms for help embeds
			var textPerms = await hasBotPermissions(["sendMessages", "embedLinks"], msg.channel, true);

			if (textPerms.length > 0) return;
			else return msg.channel.createMessage({ embeds: [await command.helpEmbed(prefix, msg.guild.language)] });
		}

		// Check if bot has necessary permissions for the command
		var missingBotPerms = await hasBotPermissions(command.botPermissions, msg.channel, true);

		if (missingBotPerms.length > 0) return;

		// Note - If retrieving guild data every command is too much, create new commands collection
		if (!guildData) guildData = await guildModel.findById(msg.guildID);
		if (!guildData) return;

		// Check if the command enabled & the user is blacklisted or not whitelisted
		var commandData = await getCommandData(guildData, command);
		var isAdmin = await msg.channel.permissionsOf(msg.author.id).has("administrator");

		// Bypass blacklist and whitelist checks if user is admin
		if (isAdmin == false) {
			if (commandData.enabled == false) {
				return msg.channel.error(await translate("commands.error.disabled"), { emoji: "⛔" });
			}

			if (commandData.mode == "blacklist") {
				for (var i = 0; i < commandData.blacklist.length; i++) {
					var blacklistItem = commandData.blacklist[i];

					// Check for blacklisted roles
					if (blacklistItem.startsWith("&")) {
						if (msg.member.roles.includes(blacklistItem.slice(1))) {
							var role = await msg.guild.roles.get(blacklistItem.slice(1));

							return msg.channel.error(
								await translate("commands.blacklist.error.role", msg.guild.language, {
									roleName: role.name,
									commandName: command.name
								}),
								{ bold: false, emoji: "🔒" }
							);
						}
					}

					// Check for blacklisted users
					else if (blacklistItem.startsWith("!")) {
						if (msg.author.id == blacklistItem.slice(1)) {
							return msg.channel.error(
								await translate("commands.blacklist.error.user", msg.guild.language, {
									commandName: command.name
								}),
								{ emoji: "🔒" }
							);
						}
					}

					// Check for blacklisted channels
					else if (blacklistItem.startsWith("#")) {
						if (msg.channel.id == blacklistItem.slice(1)) {
							return msg.channel.error(
								await translate("commands.blacklist.error.channel", msg.guild.language, {
									channelName: msg.channel.name,
									commandName: command.name
								}),
								{ bold: false, emoji: "🔒" }
							);
						}
					}
				}
			} else if (commandData.mode == "whitelist") {
				var onWhitelist = false;
				var whitelistChannels = 0; // Allows "commands.whitelist.error.channel" to be sent if whitelist only consists of channels

				for (i = 0; i < commandData.whitelist.length; i++) {
					var whitelistItem = commandData.whitelist[i];

					// Check for whitelisted roles
					if (whitelistItem.startsWith("&")) {
						if (msg.member.roles.includes(whitelistItem.slice(1))) {
							onWhitelist = true;
							break;
						}
					}

					// Check for whitelisted users
					if (whitelistItem.startsWith("!")) {
						if (msg.author.id == whitelistItem.slice(1)) {
							onWhitelist = true;
							break;
						}
					}

					// Check for whitelisted channels
					if (whitelistItem.startsWith("#")) {
						if (msg.channel.id == whitelistItem.slice(1)) {
							onWhitelist = true;
							break;
						} else whitelistChannels++;
					}
				}

				if (onWhitelist == false) {
					if (whitelistChannels !== 0 && whitelistChannels == commandData.whitelist.length) {
						return msg.channel.error(
							await translate("commands.whitelist.error.channel", msg.guild.language, {
								commandName: command.name,
								channelName: msg.channel.name
							}),
							{ emoji: "🔒" }
						);
					} else {
						return msg.channel.error(
							await translate("commands.whitelist.error", msg.guild.language, {
								commandName: command.name
							}),
							{ emoji: "🔒" }
						);
					}
				}
			}
		}

		// Check if user has a cooldown
		if (commandCooldowns[msg.author.id] && commandCooldowns[msg.author.id][commandName] && isAdmin == false) {
			if (commandCooldowns[msg.author.id][commandName] >= Date.now()) {
				var secondsLeft = String(
					Math.ceil(commandCooldowns[msg.author.id][commandName] - Date.now()) / 1000
				).substring(0, 3);

				return msg.embedReply(
					await translate("commands.error.cooldown", msg.guild.language, {
						secondsLeft,
						commandName
					}),
					{
						bold: false,
						emoji: "⏱"
					}
				);
			} else delete commandCooldowns[msg.author.id][commandName];
		}

		// Add a cooldown to a user
		if (commandData.cooldown > 0 && isAdmin == false) {
			if (!commandCooldowns[msg.author.id]) commandCooldowns[msg.author.id] = {};
			commandCooldowns[msg.author.id][commandName] = Date.now() + commandData.cooldown * 1000;
		}

		console.log(`[${msg.guild.shard.id}] ${command.name.toUpperCase()} COMMAND`);

		data.guildData = guildData ? guildData : undefined;
		data.args = args;
		data.prefix = prefix;
		data.commandData = commandData;

		try {
			await command.run(client, msg, data, ipc);
		} catch (err) {
			try {
				await msg.react("error");
			} catch {
				console.log("Message deleted.");
			}

			if (err.constructor.name == "Message") return;
			else if (err.constructor.name == "String") await msg.error(err);
			else console.error(err.toString());
		}

		return;
	}
};
