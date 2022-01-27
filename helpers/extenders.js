const { Message, TextChannel } = require("eris");
const Eris = require("eris");
const Embed = require("../classes/embed");
const { info } = require("../utils/collections");

Message.prototype.react = async function (type = "success", reactionToRemove = null) {
	var botPermissions = this.channel.permissionsOf(info.get("clientUserID"));
	var manageMessagesPerm = botPermissions.has("manageMessages");

	function getEmoji(name) {
		switch (name) {
			case "error":
				name = "❌";
				break;
			case "success":
				name = "👍";
				break;
			case "warning":
				name = "⚠️";
				break;
			case "loading":
				name = "🔄";
				break;
		}

		return name;
	}

	if (type) await this.addReaction(getEmoji(type));

	if (reactionToRemove && manageMessagesPerm) await this.removeReactionEmoji(getEmoji(reactionToRemove));

	return;
};

Message.prototype.success = function (text, options = {}) {
	return this.channel.success(text, options);
};

Message.prototype.error = function (text, options = {}) {
	return this.channel.error(text, options);
};

Message.prototype.embedReply = function (text, options = {}) {
	return this.channel.embedReply(text, options);
};

TextChannel.prototype.success = function (text, options = {}) {
	options.emoji = options.emoji || ":white_check_mark:";
	options.bold = "bold" in options ? options.bold : true;
	options.color = options.color || "checkmarkGreen";

	return this.embedReply(text, options);
};

TextChannel.prototype.error = function (text, options = {}) {
	options.emoji = options.emoji || ":x:";
	options.bold = "bold" in options ? options.bold : true;
	options.color = options.color || "red";

	return this.embedReply(text, options);
};

TextChannel.prototype.embedReply = function (text, options = {}) {
	options.emoji = options.emoji || "";
	options.bold = "bold" in options ? options.bold : true;
	options.color = options.color || "default";

	var replyEmbed = new Embed()
		.setDescription(`${options.bold ? "**" : ""}${options.emoji} ${text}${options.bold ? "**" : ""}`)
		.setColor(options.color);

	return this.createMessage({ embeds: [replyEmbed] });
};

Object.defineProperty(Eris.Message.prototype, "guild", {
	get: function () {
		return this.channel.guild;
	}
});

Object.defineProperty(Eris.Guild.prototype, "me", {
	get: function () {
		return this.members.get(this.shard.client.user.id);
	}
});
