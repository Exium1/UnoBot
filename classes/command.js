const path = require("path");
const Embed = require("./embed");
const { translate } = require("../utils/functions");

class Command {
	constructor(
		client,
		{
			name = null,
			aliases = new Array(),
			botPermissions = new Array(),
			memberPermissions = new Array(),
			helpOptions = {
				helpArg: true,
				noArgs: true
			},
			defaultSettings = new Object(),
			category = false,
			enabled = true,
			guildOnly = true,
			ownerOnly = false,
			allowNoPrefix = false
		}
	) {
		this.client = client;
		this.name = name;
		this.aliases = aliases;
		this.botPermissions = botPermissions;
		this.memberPermissions = memberPermissions;
		this.helpOptions = helpOptions;
		this.category = category ? category.split(path.sep)[parseInt(category.split(path.sep).length - 1, 10)] : false;
		this.enabled = enabled;
		this.guildOnly = guildOnly;
		this.ownerOnly = ownerOnly;
		this.allowNoPrefix = allowNoPrefix;
		this.defaultSettings = Object.assign(
			{
				cooldown: 0,
				whitelist: [],
				blacklist: [],
				mode: "blacklist",
				enabled: true
			},
			defaultSettings
		);
	}

	async helpEmbed(prefix, language) {
		var helpEmbed = new Embed()
			.setTitle(`${prefix}${this.name}`)
			.setThumbnail("logo")
			.addField(
				`${await translate("commands.helpEmbed.description", language)}:`,
				await translate(`${this.category.toLowerCase()}.${this.name}.info.desc`, language, {
					clientUsername: this.client.user.username
				})
			);

		var commandUsage = await translate(`${this.category.toLowerCase()}.${this.name}.info.usage`, language, {
			prefix
		});
		var commandNotes = await translate(`${this.category.toLowerCase()}.${this.name}.info.usage.notes`, language, {
			prefix
		});
		var commandTips = await translate(`${this.category.toLowerCase()}.${this.name}.info.usage.tips`, language, {
			prefix
		});
		var commandExamples = await translate(`${this.category.toLowerCase()}.${this.name}.info.examples`, language, {
			prefix
		});

		// Make sure command info is set to array form to make it simpler
		if (typeof commandNotes == "string") commandNotes = [commandNotes];
		if (typeof commandTips == "string") commandTips = [commandTips];
		if (typeof commandExamples == "string") commandExamples = [commandExamples];

		helpEmbed.addField(`${await translate("commands.helpEmbed.usage", language)}:`, `\`${commandUsage}\``);

		var notesTitle;
		var notesString;

		if (commandNotes.length > 1) {
			notesTitle = `${await translate("commands.helpEmbed.notes", language)}:`;
			notesString = "\n • " + commandNotes.join("\n • ");
		} else if (commandNotes.length == 1) {
			notesTitle = `${await translate("commands.helpEmbed.note", language)}:`;
			notesString = commandNotes[0];
		}
		if (commandNotes.length > 0) helpEmbed.addField(notesTitle, notesString);

		var tipsTitle;
		var tipsString;

		if (commandTips.length > 1) {
			tipsTitle = `${await translate("commands.helpEmbed.tips", language)}:`;
			tipsString = "\n • " + commandTips.join("\n • ");
		} else if (commandTips.length == 1) {
			tipsTitle = `${await translate("commands.helpEmbed.tip", language)}:`;
			tipsString = commandTips[0];
		}
		if (commandTips.length > 0) helpEmbed.addField(tipsTitle, tipsString);

		var examplesTitle;
		var examplesString;

		if (commandExamples.length > 1) {
			examplesTitle = `${await translate("commands.helpEmbed.examples", language)}:`;
			examplesString = "\n • " + commandExamples.join("\n • ");
		} else if (commandExamples.length == 1) {
			examplesTitle = `${await translate("commands.helpEmbed.example", language)}:`;
			examplesString = commandExamples[0];
		}
		if (commandExamples.length > 0) helpEmbed.addField(examplesTitle, examplesString);

		if (this.aliases.length > 0) {
			helpEmbed.addField(
				`${await translate("commands.helpEmbed.aliases", language)}:`,
				`\`${this.aliases.join("`, `")}\``
			);
		}

		return helpEmbed;
	}
}

module.exports = Command;
