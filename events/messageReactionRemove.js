const collections = require("../utils/collections");

module.exports = async (client, ipc, msg, emoji, reactor) => {
	var msgReaction = collections.msgReactions.get(msg.id);

	if (!msgReaction) return;

	if (msgReaction.action == "startMsgReaction") {
		if (reactor == client.user.id) return;

		var { startgameEvent } = require("../utils/eventEmitters.js");

		startgameEvent.emit("startMsgReaction", { guildID: msg.guildID, emoji, reactor, action: "remove" });
	}
};
