const logger = require("../utils/logger");
const mongoose = require("mongoose");
const { mongoURI } = require("../utils/config");

module.exports = async () => {
	var connection = await mongoose
		.connect(mongoURI, {
			useNewUrlParser: true,
			useUnifiedTopology: true
		})
		.then(() => logger.log("info", "MongoDB connected!"))
		.catch((err) => logger.log("info", `DB Connection Error: ${err.message}`));

	return connection;
};
