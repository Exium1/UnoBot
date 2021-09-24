const mongoose = require("mongoose");
const { cardsArray } = require("../../utils/config");

const gameSchema = new mongoose.Schema(
	{
		guildID: {
			type: String,
			default: ""
		},
		status: {
			type: String,
			default: ""
		},
		gameCreatorID: {
			type: String,
			default: ""
		},
		startChannelID: {
			type: String,
			default: ""
		},
		startMessageID: {
			type: String,
			default: ""
		},
		startTime: {
			type: Date,
			default: new Date()
		},
		currentCard: {
			type: String,
			default: ""
		},
		currentPosition: {
			type: Number,
			default: 0
		},
		stackedCards: {
			type: Number,
			default: 0
		},
		unoCallout: {
			type: String,
			default: ""
		},
		channelIDs: Array,
		playerOrder: Array,
		kickedPlayers: Array,
		customGameSettings: {
			type: Object,
			default: {}
		},
		gameSettings: {
			type: Object,
			default: {}
		},
		players: {
			type: Object,
			default: {}
		},
		deck: {
			type: Array,
			default: cardsArray
		}
	},
	{ minimize: false }
);

module.exports = mongoose.model("Game", gameSchema);
