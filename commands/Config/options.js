const Command = require("../../classes/command");
const Embed = require("../../classes/embed.js");
const { translate, formatOption } = require("../../utils/functions");
const config = require("../../utils/config");
const userModel = require("../../database/models/user");

class Options extends Command {
	constructor(client) {
		super(client, {
			name: "options",
			aliases: ["option"],
			category: __dirname // eslint-disable-line
		});
	}

	async run(client, msg, { args, prefix }) {
		var language = msg.guild.language;
		var userData =
			(await userModel.findById(msg.author.id)) ||
			new userModel({
				_id: msg.author.id,
				username: msg.author.username,
				discriminator: msg.author.discriminator
			});

		var optionName = await formatOption(args[0]);

		if (optionName) {
			if (["on", "enable", "add"].includes(args[1])) {
				var defaultOptionData = config.options[optionName];

				if (defaultOptionData.type !== Boolean) {
					return msg.error(
						await translate(`config.options.error.not${defaultOptionData.type.name}`, language, {
							optionName
						})
					);
				}

				if (
					userData.options[optionName] == true ||
					(userData.options[optionName] == undefined && defaultOptionData.default == true)
				) {
					return msg.error(
						await translate("config.options.error.alreadyOn", language, {
							optionName
						})
					);
				} else {
					userData.options[optionName] = true;
				}
			} else if (["off", "disable", "remove"].includes(args[1])) {
				defaultOptionData = config.options[optionName];

				if (defaultOptionData.type !== Boolean) {
					return msg.error(
						await translate(`config.options.error.not${defaultOptionData.type.name}`, language, {
							optionName
						})
					);
				}

				if (
					userData.options[optionName] == false ||
					(userData.options[optionName] == undefined && defaultOptionData.default == false)
				) {
					return msg.error(
						await translate("config.options.error.alreadyOff", language, {
							optionName
						})
					);
				} else {
					userData.options[optionName] = false;
				}
			} else if (/^\d+$/.test(args[1])) {
				defaultOptionData = config.options[optionName];
				var newValue = Number(args[2]);

				if (defaultOptionData.type !== Number) {
					return msg.error(
						await translate(`config.options.error.not${defaultOptionData.type.name}`, language, {
							optionName
						})
					);
				}

				if (newValue < defaultOptionData.min || newValue > defaultOptionData.max) {
					return msg.error(
						await translate("config.options.error.outOfRange", language, {
							optionName,
							min: defaultOptionData.min,
							max: defaultOptionData.max
						})
					);
				}

				if (userData.options[optionName] == newValue) {
					return msg.error(
						await translate("config.options.error.alreadySet", language, {
							optionName,
							newValue
						})
					);
				} else {
					if (defaultOptionData.default == newValue) delete userData.options[optionName];
					// Delete if default is true
					else userData.options[optionName] = newValue;
				}
			} else {
				var optionValue;

				if (userData.options[optionName] == undefined) {
					userData.options[optionName] = config.options[optionName].default;
				}

				if (config.options[optionName].type == Boolean) {
					if (userData.options[optionName]) {
						optionValue = `${await translate("config.general.enabled", language)} :white_check_mark:`;
					} else {
						optionValue = `${await translate("config.general.disabled", language)} :x:`;
					}
				} else {
					if (userData.options[optionName] == config.options[optionName].default) {
						optionValue = `${config.options[optionName].default} :x:`;
					} else {
						optionValue = `${userData.options[optionName]} :white_check_mark:`;
					}
				}

				var optionEmbed = new Embed()
					.setTitle(`${optionName} ${await translate("config.general.option", language)}`)
					.setDescription(`${optionValue}`)
					.addField(
						`${await translate("commands.helpEmbed.description", language)}:`,
						`${await translate(`config.options.option.${optionName}`, language, { prefix })}\n
						${await translate("config.options.optionEmbed", language, {
							prefix,
							optionName,
							usage: await translate(
								`game.general.settings.usage.${config.options[optionName].type.name.toLowerCase()}`,
								language
							)
						})}`
					);

				return msg.channel.createMessage({ embeds: [optionEmbed] });
			}

			userData.markModified("options");
			await userData.save();

			return msg.react("success");
		} else if (args[0] == null || ["list", "view"].includes(args[0])) {
			var gameSettingsEmbed = new Embed().setTitle(await translate("config.general.options", language));

			for (var i = 0; i < Object.keys(config.options).length; i++) {
				optionName = Object.keys(config.options)[i];

				if (userData.options[optionName] == undefined) {
					userData.options[optionName] = config.options[optionName].default;
				}

				if (config.options[optionName].type == Boolean) {
					if (userData.options[optionName]) {
						optionValue = `${await translate("config.general.enabled", language)} :white_check_mark:`;
					} else {
						optionValue = `${await translate("config.general.disabled", language)} :x:`;
					}
				} else {
					if (userData.options[optionName] == config.options[optionName].default) {
						optionValue = `${config.options[optionName].default} :x:`;
					} else {
						optionValue = `${userData.options[optionName]} :white_check_mark:`;
					}
				}

				gameSettingsEmbed.addField(`${optionName}`, optionValue, true);
			}

			return msg.channel.createMessage({ embeds: [gameSettingsEmbed] });
		} else {
			return await msg.error(
				await translate("config.options.error.notValid", language, { optionName: args[0], prefix })
			);
		}
	}
}

module.exports = Options;
