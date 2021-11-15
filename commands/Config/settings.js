const Command = require("../../classes/command");
const Embed = require("../../classes/embed.js");
const { translate, getCommandData, formatGameSetting, formatLanguage, hasVoted } = require("../../utils/functions");
const { prefixes, commands, aliases, guildLanguages, msgReactions } = require("../../utils/collections");
const config = require("../../utils/config");
const guildModel = require("../../database/models/guild");

class Settings extends Command {
	constructor(client) {
		super(client, {
			name: "settings",
			aliases: ["sett", "stngs", "setting"],
			helpOptions: {
				helpArg: false,
				noArgs: false
			},
			defaultSettings: {
				mode: "whitelist"
			},
			category: __dirname // eslint-disable-line
		});
	}

	async run(client, msg, { guildData, args, prefix }) {
		var language = msg.guild.language;

		guildData = guildData || (await guildModel.findById(msg.guildID));

		if (!guildData) {
			guildData = new guildModel({
				_id: msg.guildID
			});

			await guildData.save();
		}

		if (args[0] == "help" || args[0] == null) {
			var settingsHelp = new Embed()
				.setTitle(
					await translate("config.settings.embed.title", language, { clientUsername: client.user.username })
				)
				.setDescription(
					await translate("config.settings.info.desc", language, { clientUsername: client.user.username })
				)
				.addField(
					await translate("config.settings.embed.prefix", language),
					await translate("config.settings.embed.prefix.text", language, { prefix }),
					true
				)
				.addField(
					await translate("config.settings.embed.commands", language),
					await translate("config.settings.embed.commands.text", language, { prefix }),
					true
				)
				.addField(
					await translate("config.settings.embed.dgs", language),
					await translate("config.settings.embed.dgs.text", language, { prefix }),
					true
				)
				.addField(
					await translate("config.settings.embed.lang", language),
					await translate("config.settings.embed.lang.text", language, { prefix }),
					true
				)
				.addField(
					await translate("config.settings.embed.resetlb", language),
					await translate("config.settings.embed.resetlb.text", language, {
						prefix
					}),
					true
				)
				.addField(
					await translate("config.settings.embed.reset", language, { clientUsername: client.user.username }),
					await translate("config.settings.embed.reset.text", language, {
						prefix
					}),
					true
				);

			msg.channel.createMessage(settingsHelp);
		} else if (args[0] == "prefix") {
			if (args[1] == null || args[1] == "help") {
				var prefixHelpEmbed = new Embed()
					.setTitle(await translate("config.settings.prefix.embed.title", language, { prefix }))
					.addField(
						`${await translate("config.settings.prefix.embed.desc", language)}:`,
						await translate("config.settings.prefix.embed.desc.text", language, {
							clientUsername: client.user.username
						})
					)
					.addField(
						`${await translate("config.settings.prefix.embed.usage", language)}:`,
						await translate("config.settings.prefix.embed.usage.text", language, { prefix })
					)
					.addField(
						`${await translate("config.settings.prefix.embed.example", language)}:`,
						await translate("config.settings.prefix.embed.example.text", language, { prefix })
					);

				return msg.channel.createMessage(prefixHelpEmbed);
			}

			var oldPrefix = guildData.prefix;
			var newPrefix = msg.content.split(/ +/).slice(1)[1];

			if (["default", "remove", "reset"].includes(newPrefix)) newPrefix = config.prefix;

			if (oldPrefix == newPrefix) {
				return await msg.error(
					await translate("config.settings.prefix.error.samePrefix", language, { newPrefix }),
					{
						bold: false
					}
				);
			}

			if (newPrefix.length > 10) {
				return await msg.error(await translate("config.settings.prefix.error.tooLong"));
			}

			await guildData.updateOne({ prefix: newPrefix });
			prefixes.set(msg.guildID, newPrefix);

			return await msg.success(await translate("config.settings.prefix.success", language, { newPrefix }));
		} else if (["commands", "cmds", "cmd"].includes(args[0])) {
			if (args[1] == null) {
				var commandsHelp = new Embed()
					.setTitle(
						await translate("config.settings.cmds.helpEmbed.title", language, { prefix, commandName: "" })
					)
					.addField(
						await translate("config.settings.cmds.helpEmbed.toggleCommand", language),
						await translate("config.settings.cmds.helpEmbed.toggleCommand.text", language, { prefix })
					)
					.addField(
						await translate("config.settings.cmds.helpEmbed.setCooldown", language),
						await translate("config.settings.cmds.helpEmbed.setCooldown.text", language, { prefix })
					)
					.addField(
						await translate("config.settings.cmds.helpEmbed.lists", language),
						await translate("config.settings.cmds.helpEmbed.lists.text", language, { prefix })
					)
					.addField(
						await translate("config.settings.cmds.helpEmbed.info", language),
						await translate("config.settings.cmds.helpEmbed.info.text", language, { prefix })
					)
					.setFooter(await translate("config.settings.cmds.helpEmbed.footer", language));

				return msg.channel.createMessage(commandsHelp);
			}

			if (args[1].startsWith(prefix)) args[1] = args[1].slice(prefix.length); // Remove prefix from command name

			var command = commands.get(args[1]);

			if (!command) command = commands.get(aliases.get(args[1]));
			if (!command || command.ownerOnly == true) {
				return msg.error(
					await translate("config.settings.cmds.error.noCommand", language, {
						commandName: args[1],
						prefix
					}),
					{ bold: false }
				);
			}

			var commandName = command.name;
			var commandData = await getCommandData(guildData, command);

			if (args[2] == "on" || args[2] == "enable") {
				if (commandData.enabled == true) {
					return msg.channel.error(
						await translate("config.settings.cmds.toggle.error.alreadyEnabled", language, {
							commandName
						})
					);
				} else commandData.enabled = true;
			} else if (args[2] == "off" || args[2] == "disable") {
				if (commandData.enabled == false) {
					return msg.channel.error(
						await translate("config.settings.cmds.toggle.error.alreadyDisabled", language, {
							commandName
						})
					);
				} else commandData.enabled = false;
			} else if (["blacklist", "bl", "whitelist", "wl"].includes(args[2])) {
				if (args[2] == "bl") args[2] = "blacklist";
				if (args[2] == "wl") args[2] = "whitelist";

				var listItem = false;
				var listName = args[2];

				async function stringToListItem(input) {
					// List item is like !265362871691640832, where !, &, # are members, roles, and channels respectively.

					async function toRoleString(input) {
						var role = await msg.guild.roles.find((r) => r.name.toLowerCase() == input);

						if (!role) role = await msg.guild.roles.get(input); // Check if string matches roleID

						if (role) return "&" + role.id;
						else return false;
					}

					async function toMemberString(input) {
						var member;

						if (input.includes("#")) {
							member = await msg.guild.members.find(
								(m) =>
									m.username.toLowerCase() == input.split("#")[0] &&
									m.discriminator == input.split("#")[1]
							);

							if (!member) return false;
						} else {
							member = await msg.guild.members.find((m) => m.username.toLowerCase() == input);
							if (!member) member = await msg.guild.members.get(input);
						}

						if (member) return "!" + member.id;
						else return false;
					}

					async function toChannelString(input) {
						var channel = await msg.guild.channels.find((c) => c.name.toLowerCase() == input);

						if (!channel) channel = await msg.guild.channels.get(input);

						if (channel) return "#" + channel.id;
						else return false;
					}

					// Change inputs from mentions and symbols into a string
					if (input.startsWith("&") || input.startsWith("!")) input = `<@${input}`;
					else if (input.startsWith("#")) input = `<${input}`;

					if (input.startsWith("<")) {
						input = input.replace(/<|>|@/g, "");

						if (input.startsWith("&") && (await msg.guild.roles.get(input.slice(1)))) return input;
						if (input.startsWith("!") && (await msg.guild.members.get(input.slice(1)))) return input;
						if (input.startsWith("#") && (await msg.guild.channels.get(input.slice(1)))) return input;

						return false;
					} else {
						// Ran if only an ID or name is given as input. Checks if it is role, member, or channel
						var output;

						output = await toRoleString(input);
						if (!output) output = await toMemberString(input);
						if (!output) output = await toChannelString(input);

						if (!output) return false;
						else return output;
					}
				}

				if (args[3] == "add") {
					var toAdd = args.slice(4, args.length).join(" ");

					listItem = await stringToListItem(toAdd);

					if (!listItem) {
						return await msg.error(
							await translate("config.settings.cmds.list.error.noListItem", language, {
								listItem: toAdd
							}),
							{ bold: false }
						);
					} else if (commandData[listName].includes(listItem)) {
						return await msg.error(
							await translate(`config.settings.cmds.${listName}.error.alreadyAdded`, language, {
								listItem: toAdd
							}),
							{ bold: false }
						);
					} else commandData[listName].push(listItem);
				} else if (args[3] == "remove") {
					var toRemove = args.slice(4, args.length).join(" ");

					// Check if input is an ID (all numbers)
					if (toRemove.length > 15 && toRemove.replace(/[0-9]/g, "") == "") {
						var listItemIndex;

						for (i = 0; i < commandData[listName].length; i++) {
							if (commandData[listName][i].slice(1) == toRemove) {
								listItem = true;
								listItemIndex = i;
							}
						}

						if (listItem) {
							commandData[listName].splice(listItemIndex, 1);
						} else {
							return await msg.error(
								await translate("config.settings.cmds.list.error.noListItem", language, {
									listItem: toRemove
								}),
								{ bold: false }
							);
						}
					} else {
						listItem = await stringToListItem(toRemove);

						if (!listItem) {
							return await msg.error(
								await translate("config.settings.cmds.list.error.noListItem", language, {
									listItem: toRemove
								}),
								{ bold: false }
							);
						} else if (!commandData[listName].includes(listItem)) {
							console.log(listItem);
							return await msg.error(
								await translate(`config.settings.cmds.${listName}.error.alreadyRemoved`, language, {
									listItem: toRemove
								}),
								{ bold: false }
							);
						} else {
							commandData[listName].splice(commandData[listName].indexOf(listItem), 1);
						}
					}
				} else if (["on", "enabled", "true"].includes(args[3])) {
					if (commandData.mode == listName)
						return msg.error(
							await translate(`config.settings.cmds.${listName}.error.alreadySet`, language, {
								commandName
							})
						);
					commandData.mode = listName;
				} else if (["off", "disabled", "false"].includes(args[3])) {
					if (commandData.mode !== listName)
						return msg.error(
							await translate(`config.settings.cmds.${listName}.error.alreadySetOff`, language, {
								commandName
							})
						);
					commandData.mode = "";
				} else if (args[3] == "view" || args[3] == "list") {
					var emptyList = false;
					var roleList = [];
					var userList = [];
					var channelList = [];

					if (commandData[listName].length > 0) {
						var commandDataLength = commandData[listName].length;

						for (var i = 0; i < commandDataLength; i++) {
							listItem = commandData[listName][i];

							var newListItem = listItem.replace(/<|>/g);

							if (newListItem.startsWith("&")) {
								if (await msg.guild.roles.get(newListItem.slice(1))) {
									roleList.push(`• <@${newListItem}>`);
								} else {
									commandData[listName].splice(commandData[listName].indexOf(listItem), 1);
								}
							} else if (newListItem.startsWith("!")) {
								var fetchedMember = await msg.guild.fetchMembers({
									userIDs: newListItem.slice(1),
									limit: 1
								});

								if (fetchedMember) {
									userList.push(`• <@${newListItem}>`);
								} else {
									commandData[listName].splice(commandData[listName].indexOf(listItem), 1);
								}
							} else if (newListItem.startsWith("#")) {
								if (await msg.guild.channels.get(newListItem.slice(1))) {
									channelList.push(`• <${newListItem}>`);
								} else {
									commandData[listName].splice(commandData[listName].indexOf(listItem), 1);
								}
							} else roleList.push(listItem);
						}

						await guildData.updateOne({
							[`settings.commands.${commandName}.${listName}`]: commandData[listName]
						});
					} else emptyList = true;

					var listEmbed = new Embed()
						.setTitle(
							`${commandName.charAt(0).toUpperCase() + commandName.slice(1)} ${await translate(
								"config.general.command",
								language
							)} ${await translate(`config.general.${listName}`, language)}`
						)
						.setDescription(
							commandData.mode == listName
								? `✅ ${await translate("config.general.enabled", language)}`
								: `❌ ${await translate("config.general.disabled", language)}`
						);

					if (roleList.length > 0) {
						listEmbed.addField(
							await translate(`config.settings.cmds.list.listEmbed.${listName}edRoles`, language),
							roleList.join("\n")
						);
					}
					if (userList.length > 0) {
						listEmbed.addField(
							await translate(`config.settings.cmds.list.listEmbed.${listName}edUsers`, language),
							userList.join("\n")
						);
					}
					if (channelList.length > 0) {
						listEmbed.addField(
							await translate(`config.settings.cmds.list.listEmbed.${listName}edChannels`, language),
							channelList.join("\n")
						);
					}
					if (emptyList) {
						listEmbed.embed.description =
							listEmbed.embed.description +
							`\n\n**${await translate(
								`config.settings.cmds.list.listEmbed.${listName}NoItems`,
								language
							)}**`;
					}

					return await msg.channel.createMessage(listEmbed);
				} else {
					return msg.error(
						await translate("config.settings.cmds.list.error", language, {
							prefix,
							commandName,
							listName
						})
					);
				}
			} else if (args[2] == "cooldown" || args[2] == "cd") {
				if (args[3] == "set") {
					if (!args[4]) {
						return msg.error(
							await translate("config.settings.cmds.cooldown.error.noCooldown", language, {
								prefix,
								commandName
							})
						);
					}

					var newCooldown = Number(args[4]);

					if (isNaN(newCooldown)) {
						return msg.error(
							await translate("config.settings.cmds.cooldown.error.notNumber", language, {
								newCooldown: args[4]
							}),
							{ bold: false }
						);
					}

					if (commandData.cooldown == newCooldown) {
						return msg.error(
							await translate("config.settings.cmds.cooldown.error.alreadySet", language, {
								commandName,
								newCooldown
							}),
							{ bold: false }
						);
					} else commandData.cooldown = newCooldown;
				} else if (args[3] == "view" || args[3] == "current") {
					return msg.channel.embedReply(
						await translate("config.settings.cmds.cooldown.currentCooldown", language, {
							commandName,
							cooldown: commandData.cooldown
						}),
						{ bold: false, emoji: "⌚" }
					);
				} else {
					return msg.channel.error(
						await translate("config.settings.cmds.cooldown.error", language, {
							prefix,
							commandName
						})
					);
				}
			} else if (["view", "list", "mode", "state", "info", "current"].includes(args[2])) {
				var commandEmbed = new Embed()
					.setTitle(`${commandName.charAt(0).toUpperCase() + commandName.slice(1)} Command Settings`)
					.setDescription(
						commandData.enabled
							? `✅ ${await translate("config.general.enabled", language)}`
							: `❌ ${await translate("config.general.disabled", language)}`
					)
					.addField(
						`${await translate("config.general.cooldown", language)}`,
						`${commandData.cooldown} ${(await translate("config.general.seconds", language)).toLowerCase()}`
					);

				var whitelistString = "";

				if (commandData.whitelist.length > 0) {
					for (i = 0; i < commandData.whitelist.length; i++) {
						listItem = commandData.whitelist[i];

						if (listItem.startsWith("&") || listItem.startsWith("!")) {
							whitelistString = whitelistString + `• <@${listItem}>\n`;
						} else if (listItem.startsWith("#")) {
							whitelistString = whitelistString + `• <${listItem}>\n`;
						}
					}
				} else whitelistString = await translate("config.general.none", language);

				commandEmbed.addField(
					`${await translate("config.general.whitelist")} ${commandData.mode == "whitelist" ? "✅" : "❌"}`,
					whitelistString
				);

				var blacklistString = "";

				if (commandData.blacklist.length > 0) {
					for (i = 0; i < commandData.blacklist.length; i++) {
						listItem = commandData.blacklist[i];

						if (listItem.startsWith("&") || listItem.startsWith("!")) {
							blacklistString = blacklistString + `• <@${listItem}>\n`;
						} else if (listItem.startsWith("#")) {
							blacklistString = blacklistString + `• <${listItem}>\n`;
						}
					}
				} else blacklistString = await translate("config.general.none", language);

				commandEmbed.addField(
					`${await translate("config.general.blacklist")} ${commandData.mode == "blacklist" ? "✅" : "❌"}`,
					blacklistString
				);

				return msg.channel.createMessage(commandEmbed);
			} else {
				var commandName2 = commandName.charAt(0).toUpperCase() + commandName.slice(1);

				commandsHelp = new Embed()
					.setTitle(
						await translate("config.settings.cmds.cmdHelpEmbed.title", language, {
							prefix,
							commandName,
							commandName2
						})
					)
					.addField(
						await translate("config.settings.cmds.cmdHelpEmbed.toggleCommand", language, {
							commandName2
						}),
						await translate("config.settings.cmds.cmdHelpEmbed.toggleCommand.text", language, {
							prefix,
							commandName,
							commandName2
						})
					)
					.addField(
						await translate("config.settings.cmds.cmdHelpEmbed.setCooldown", language),
						await translate("config.settings.cmds.cmdHelpEmbed.setCooldown.text", language, {
							prefix,
							commandName,
							commandName2
						})
					)
					.addField(
						await translate("config.settings.cmds.cmdHelpEmbed.lists", language),
						await translate("config.settings.cmds.cmdHelpEmbed.lists.text", language, {
							prefix,
							commandName,
							commandName2
						})
					)
					.addField(
						await translate("config.settings.cmds.cmdHelpEmbed.info", language, { commandName2 }),
						await translate("config.settings.cmds.cmdHelpEmbed.info.text", language, {
							prefix,
							commandName,
							commandName2
						})
					);

				return msg.channel.createMessage(commandsHelp);
			}

			await guildData.updateOne({
				[`settings.commands.${commandName}`]: commandData
			});

			return msg.react("success");
		} else if (["dgs", "defaultgamesettings"].includes(args[0])) {
			var settingName = await formatGameSetting(args[1]);

			if (settingName) {
				var guildDGS = guildData.game.defaultGameSettings;

				if (["on", "enable", "add"].includes(args[2])) {
					if (!(await hasVoted(msg.author.id, msg, "config.settings.dgs.error.voteNeeded"))) return false;

					var defaultSettingData = config.gameSettings[settingName];

					if (defaultSettingData.type !== Boolean) {
						return msg.error(
							await translate(
								`game.general.settings.error.not${defaultSettingData.type.name}`,
								language,
								{
									gameSetting: settingName
								}
							)
						);
					}

					if (guildDGS[settingName] == true) {
						return msg.error(
							await translate("config.settings.dgs.error.alreadyOn", language, {
								gameSetting: settingName
							})
						);
					} else {
						if (defaultSettingData.default == true) delete guildDGS[settingName];
						// Delete if default is true
						else guildDGS[settingName] = true;
					}
				} else if (["off", "disable", "remove"].includes(args[2])) {
					if (!(await hasVoted(msg.author.id, msg, "config.settings.dgs.error.voteNeeded"))) return false;

					defaultSettingData = config.gameSettings[settingName];

					if (defaultSettingData.type !== Boolean) {
						return msg.error(
							await translate(
								`game.general.settings.error.not${defaultSettingData.type.name}`,
								language,
								{
									gameSetting: settingName
								}
							)
						);
					}

					if (guildDGS[settingName] == false) {
						return msg.error(
							await translate("config.settings.dgs.error.alreadyOff", language, {
								gameSetting: settingName
							})
						);
					} else {
						if (defaultSettingData.default == false) delete guildDGS[settingName];
						// Delete if default is true
						else guildDGS[settingName] = false;
					}
				} else if (/^\d+$/.test(args[2])) {
					if (!(await hasVoted(msg.author.id, msg, "config.settings.dgs.error.voteNeeded"))) return false;

					defaultSettingData = config.gameSettings[settingName];
					var newValue = Number(args[2]);

					if (defaultSettingData.type !== Number) {
						return msg.error(
							await translate(
								`game.general.settings.error.not${defaultSettingData.type.name}`,
								language,
								{
									gameSetting: settingName
								}
							)
						);
					}

					if (newValue < defaultSettingData.min || newValue > defaultSettingData.max) {
						return msg.error(
							await translate("game.general.settings.error.outOfRange", language, {
								gameSetting: settingName,
								min: defaultSettingData.min,
								max: defaultSettingData.max
							})
						);
					}

					if (guildDGS[settingName] == newValue) {
						return msg.error(
							await translate("config.settings.dgs.error.alreadySet", language, {
								gameSetting: settingName,
								newValue
							})
						);
					} else {
						if (defaultSettingData.default == newValue) delete guildDGS[settingName];
						// Delete if default is true
						else guildDGS[settingName] = newValue;
					}
				} else {
					var gameSettingValue;

					if (guildDGS[settingName] == undefined) {
						guildDGS[settingName] = config.gameSettings[settingName].default;
					}

					if (config.gameSettings[settingName].type == Boolean) {
						if (guildDGS[settingName] == config.gameSettings[settingName].default) {
							gameSettingValue = `${await translate("config.general.disabled", language)} :x:`;
						} else {
							gameSettingValue = `${await translate(
								"config.general.enabled",
								language
							)} :white_check_mark:`;
						}
					} else {
						if (guildDGS[settingName] == config.gameSettings[settingName].default) {
							gameSettingValue = `${config.gameSettings[settingName].default} :x:`;
						} else {
							gameSettingValue = `${guildDGS[settingName]} :white_check_mark:`;
						}
					}

					var gameSettingEmbed = new Embed()
						.setTitle(`${settingName} ${await translate("game.general.gameSetting", language)}`)
						.setDescription(`${gameSettingValue}`)
						.addField(
							`${await translate("commands.helpEmbed.description", language)}:`,
							`${await translate(`game.general.settings.${settingName}`, language, { prefix })}\n
							${await translate("config.settings.dgs.gameSettingEmbed", language, {
								prefix,
								gameSetting: settingName,
								usage: await translate(
									`game.general.settings.usage.${config.gameSettings[
										settingName
									].type.name.toLowerCase()}`,
									language
								)
							})}`
						);

					return msg.channel.createMessage(gameSettingEmbed);
				}

				await guildData.updateOne({
					"game.defaultGameSettings": guildDGS
				});

				return msg.react("success");
			} else if (["list", "view"].includes(args[1])) {
				var gameSettingsEmbed = new Embed().setTitle(await translate("config.settings.dgs", language));

				for (i = 0; i < Object.keys(config.gameSettings).length; i++) {
					settingName = Object.keys(config.gameSettings)[i];
					guildDGS = guildData.game.defaultGameSettings;

					if (guildDGS[settingName] == undefined) {
						guildDGS[settingName] = config.gameSettings[settingName].default;
					}

					if (config.gameSettings[settingName].type == Boolean) {
						if (guildDGS[settingName] == config.gameSettings[settingName].default) {
							gameSettingValue = `${await translate("config.general.disabled", language)} :x:`;
						} else {
							gameSettingValue = `${await translate(
								"config.general.enabled",
								language
							)} :white_check_mark:`;
						}
					} else {
						if (guildDGS[settingName] == config.gameSettings[settingName].default) {
							gameSettingValue = `${config.gameSettings[settingName].default} :x:`;
						} else {
							gameSettingValue = `${guildDGS[settingName]} :white_check_mark:`;
						}
					}

					gameSettingsEmbed.addField(`${settingName}`, gameSettingValue, true);
				}

				return msg.channel.createMessage(gameSettingsEmbed);
			} else if (args[1] == null || args[1] == "help") {
				var DGSEmbed = new Embed()
					.setTitle(await translate("config.settings.dgs.embed.title", language, { prefix }))
					.addField(
						await translate("config.settings.dgs.embed.edit", language),
						await translate("config.settings.dgs.embed.edit.text", language, { prefix })
					)
					.addField(
						await translate("config.settings.dgs.embed.view", language),
						await translate("config.settings.dgs.embed.view.text", language, { prefix })
					);

				return msg.channel.createMessage(DGSEmbed);
			} else {
				return await msg.error(
					await translate("game.general.settings.error.notValid", language, { gameSetting: args[1], prefix })
				);
			}
		} else if (args[0] == "language" || args[0] == "lang") {
			var newLanguage;

			if (args[1]) newLanguage = await formatLanguage(args.slice(1, args.length).join(" "));

			if (newLanguage) {
				if (guildData.language == newLanguage) {
					return msg.error(
						await translate("config.settings.lang.error.alreadySet", language, { newLanguage }),
						{ bold: false }
					);
				}

				msg.guild.language = newLanguage;
				guildLanguages.set(msg.guildID, newLanguage);

				await guildData.updateOne({ language: newLanguage });
			} else {
				if (args[1] == "list") {
					const languages = require("../../lang/languages.json");

					var langListEmbed = new Embed()
						.setTitle(`${await translate("config.settings.lang.list.embed.title", language)}:`)
						.setFooter(await translate("config.settings.lang.list.embed.footer", language, { prefix }));

					for (i = 0; i < languages.length; i++) {
						langListEmbed.addField(
							`${languages[i].language} (${languages[i].region})`,
							`\`${languages[i].code}\``
						);
					}

					await msg.channel.createMessage(langListEmbed);
				} else if (args[1] == "contribute") {
					var clientUsername = client.user.username;
					var contributeEmbed = new Embed()
						.setTitle(await translate("config.settings.lang.contribute.embed.title", language, { prefix }))
						.setThumbnail("logo")
						.setDescription(
							await translate("config.settings.lang.contribute.embed.desc", language, { clientUsername })
						)
						.addField(
							await translate("config.settings.lang.contribute.embed.how", language),
							await translate("config.settings.lang.contribute.embed.how.text", language, {
								clientUsername
							})
						)
						.addField(
							await translate("config.settings.lang.contribute.embed.where", language),
							await translate("config.settings.lang.contribute.embed.where.text", language, {
								clientUsername
							})
						);

					await msg.channel.createMessage(contributeEmbed);
				} else if (args[1] == null || args[1] == "help") {
					const languages = require("../../lang/languages.json");
					var languageData = languages.find((l) => l.code == language);

					var langEmbed = new Embed()
						.setTitle(
							await translate("config.settings.lang.embed.title", language, {
								prefix
							})
						)
						.addField(
							await translate("config.settings.lang.embed.current", language),
							await translate("config.settings.lang.embed.current.text", language, {
								prefix,
								language: languageData.language,
								code: language,
								region: languageData.region
							})
						)
						.addField(
							await translate("config.settings.lang.embed.edit", language),
							await translate("config.settings.lang.embed.edit.text", language, {
								prefix,
								clientUsername: client.user.username
							})
						)
						.addField(
							await translate("config.settings.lang.embed.list", language),
							await translate("config.settings.lang.embed.list.text", language, {
								prefix
							})
						)
						.addField(
							await translate("config.settings.lang.embed.contribute", language),
							await translate("config.settings.lang.embed.contribute.text", language, {
								prefix
							})
						);

					return msg.channel.createMessage(langEmbed);
				} else {
					return await msg.error(
						await translate("config.settings.lang.error.notValid", language, {
							language: args.slice(1, args.length).join(" "),
							prefix
						})
					);
				}
			}
		} else if (args[0] == "resetlb") {
			if (!(await msg.channel.permissionsOf(msg.author.id).has("administrator"))) {
				return msg.error(await translate("config.settings.resetlb.error.noPerm", language));
			}

			var confirmMsg = await msg.channel.embedReply(await translate("config.settings.resetlb.confirm", language));

			msgReactions.set(confirmMsg.id, {
				action: "resetLBConfirm",
				userID: msg.author.id,
				language,
				guildData,
				data: { clientUsername: client.user.username }
			});

			await confirmMsg.addReaction("✅");
			await confirmMsg.addReaction("❌");

			setTimeout(async () => {
				if (msgReactions.get(confirmMsg.id)) {
					msgReactions.delete(confirmMsg.id);
					await confirmMsg.error(
						await translate("config.settings.resetlb.denied", language, {
							clientUsername: client.user.username
						})
					);
					return;
				} else return;
			}, 10000);
		} else if (args[0] == "reset") {
			if (!(await msg.channel.permissionsOf(msg.author.id).has("administrator"))) {
				return msg.error(await translate("config.settings.reset.error.noPerm", language));
			}

			confirmMsg = await msg.channel.embedReply(await translate("config.settings.reset.confirm", language));

			msgReactions.set(confirmMsg.id, {
				action: "resetConfirm",
				userID: msg.author.id,
				language,
				data: { clientUsername: client.user.username }
			});

			await confirmMsg.addReaction("✅");
			await confirmMsg.addReaction("❌");

			setTimeout(async () => {
				if (msgReactions.get(confirmMsg.id)) {
					msgReactions.delete(confirmMsg.id);
					await confirmMsg.error(
						await translate("config.settings.reset.denied", language, {
							clientUsername: client.user.username
						})
					);
					return;
				} else return;
			}, 10000);
		} else return msg.error(await translate("config.settings.error", language, { prefix }));

		return msg.react("success");
	}
}

module.exports = Settings;
