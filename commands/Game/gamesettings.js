const Command = require("../../classes/command.js");
const Embed = require("../../classes/embed.js");
var { translate, formatGameSetting, hasGamePermissions, getGameData } = require("../../utils/functions");
const { gameSettings: configGameSettings } = require("../../utils/config");

class GameSettings extends Command {
	constructor(client) {
		super(client, {
			name: "gamesettings",
			aliases: ["gs", "gamesett", "gamestngs"],
			botPermissions: ["sendMessages", "embedLinks", "addReactions"],
			category: __dirname // eslint-disable-line
		});
	}

	async run(client, msg, { prefix, gameData, args, commandData }) {
		var language = msg.guild.language;

		gameData = await getGameData(gameData, msg.guildID, true);

		var settingName = await formatGameSetting(args[0]);

		if (settingName) {
			async function isGame() {
				if (gameData.guildID) {
					return true;
				} else {
					await msg.error(await translate("game.gamesettings.error.noGame", language));
					return false;
				}
			}

			async function isLocked() {
				if (gameData.status !== "preGame" && configGameSettings[settingName].midGameLock) {
					await msg.error(
						await translate("game.gamesettings.error.lockedGS", language, { gameSetting: settingName })
					);

					return true;
				} else return false;
			}

			if (["on", "enable", "add"].includes(args[1])) {
				if (!(await isGame())) return;
				if (!(await hasGamePermissions(msg, gameData, commandData))) return;
				if (await isLocked()) return;

				var defaultSettingData = configGameSettings[settingName];

				if (defaultSettingData.type !== Boolean) {
					return msg.error(
						await translate(`game.general.settings.error.not${defaultSettingData.type.name}`, language, {
							gameSetting: settingName
						})
					);
				}

				if (gameData.customGameSettings[settingName] == true) {
					return msg.error(
						await translate("game.gamesettings.error.alreadyOn", language, {
							gameSetting: settingName
						})
					);
				} else {
					if (defaultSettingData.default == true) delete gameData.customGameSettings[settingName];
					else gameData.customGameSettings[settingName] = true;
				}
			} else if (["off", "disable", "remove"].includes(args[1])) {
				if (!(await isGame())) return;
				if (!(await hasGamePermissions(msg, gameData, commandData))) return;
				if (await isLocked()) return;

				defaultSettingData = configGameSettings[settingName];

				if (defaultSettingData.type !== Boolean) {
					return msg.error(
						await translate(`game.general.settings.error.not${defaultSettingData.type.name}`, language, {
							gameSetting: settingName
						})
					);
				}

				if (gameData.customGameSettings[settingName] == false) {
					return msg.error(
						await translate("game.gamesettings.error.alreadyOff", language, {
							gameSetting: settingName
						})
					);
				} else {
					if (defaultSettingData.default == false) delete gameData.customGameSettings[settingName];
					else gameData.customGameSettings[settingName] = false;
				}
			} else if (/^\d+$/.test(args[1])) {
				if (!(await isGame())) return;
				if (!(await hasGamePermissions(msg, gameData, commandData))) return;
				if (await isLocked()) return;

				defaultSettingData = configGameSettings[settingName];
				var newValue = Number(args[2]);

				if (defaultSettingData.type !== Number) {
					return msg.error(
						await translate(`game.general.settings.error.not${defaultSettingData.type.name}`, language, {
							gameSetting: settingName
						})
					);
				}

				if (newValue < defaultSettingData.min || newValue > defaultSettingData.max) {
					return msg.error(
						await translate("config.settings.dgs.error.outOfRange", language, {
							gameSetting: settingName,
							min: defaultSettingData.min,
							max: defaultSettingData.max
						})
					);
				}

				if (gameData.customGameSettings[settingName] == newValue) {
					return msg.error(
						await translate("game.gamesettings.error.alreadySet", language, {
							gameSetting: settingName,
							newValue
						})
					);
				} else {
					if (defaultSettingData.default == newValue) delete gameData.customGameSettings[settingName];
					else gameData.customGameSettings[settingName] = newValue;
				}
			} else {
				var gameSettingValue;

				if (gameData.gameSettings[settingName] == undefined) {
					gameData.gameSettings[settingName] = configGameSettings[settingName].default;
				}

				if (configGameSettings[settingName].type == Boolean) {
					if (gameData.gameSettings[settingName] == configGameSettings[settingName].default) {
						gameSettingValue = `${await translate("config.general.disabled", language)} :x:`;
					} else {
						gameSettingValue = `${await translate("config.general.enabled", language)} :white_check_mark:`;
					}
				} else {
					if (gameData.gameSettings[settingName] == configGameSettings[settingName].default) {
						gameSettingValue = `${configGameSettings[settingName].default} :x:`;
					} else {
						gameSettingValue = `${gameData.gameSettings[settingName]} :white_check_mark:`;
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
								`game.general.settings.usage.${configGameSettings[
									settingName
								].type.name.toLowerCase()}`,
								language
							)
						})}`
					);

				return msg.channel.createMessage({ embeds: [gameSettingEmbed] });
			}

			if (gameData.customGameSettings[settingName] == undefined) {
				gameData.gameSettings[settingName] = defaultSettingData.default;
			} else gameData.gameSettings = Object.assign(gameData.gameSettings, gameData.customGameSettings);

			if (gameData.status == "preGame") {
				var { startgameEvent } = require("../../utils/eventEmitters.js");

				startgameEvent.emit("gameSettingUpdate", msg.guildID, {
					guildID: gameData.guildID,
					gameSettings: gameData.gameSettings,
					customGameSettings: gameData.customGameSettings
				});
			}

			await gameData.updateOne({
				gameSettings: gameData.gameSettings,
				customGameSettings: gameData.customGameSettings
			});
		} else if (["list", "view"].includes(args[0])) {
			var gameSettingsEmbed = new Embed()
				.setTitle(await translate("game.gamesettings", language))
				.setDescription(gameData._id ? "" : await translate("game.gamesettings.list.desc", language))
				.setFooter(await translate("game.gamesettings.list.footer", language, { prefix }));

			for (var i = 0; i < Object.keys(configGameSettings).length; i++) {
				settingName = Object.keys(configGameSettings)[i];

				var gameSettings = gameData.gameSettings;

				if (gameSettings[settingName] == undefined) {
					gameSettings[settingName] = configGameSettings[settingName].default;
				}

				if (configGameSettings[settingName].type == Boolean) {
					if (gameSettings[settingName] == configGameSettings[settingName].default) {
						gameSettingValue = `${await translate("config.general.disabled", language)} :x:`;
					} else {
						gameSettingValue = `${await translate("config.general.enabled", language)} :white_check_mark:`;
					}
				} else {
					if (gameSettings[settingName] == configGameSettings[settingName].default) {
						gameSettingValue = `${configGameSettings[settingName].default} :x:`;
					} else {
						gameSettingValue = `${gameSettings[settingName]} :white_check_mark:`;
					}
				}

				gameSettingsEmbed.addField(`${settingName}`, gameSettingValue, true);
			}

			return msg.channel.createMessage({ embeds: [gameSettingsEmbed] });
		} else {
			return await msg.error(
				await translate("game.general.settings.error.notValid", language, { gameSetting: args[0], prefix })
			);
		}

		return msg.react("success");
	}
}

module.exports = GameSettings;
