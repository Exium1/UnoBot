const logger = require("../utils/logger");
const { languages } = require("../utils/collections");

module.exports = () => {
	logger.log("info", "Loading languages...");

	const languagesList = require("../lang/languages.json");

	for (const lang of languagesList) {
		var langFile;

		try {
			langFile = require(`../lang/${lang.code}.json`);

			if (langFile) {
				languages.set(lang.code, langFile);
				logger.log("info", ` - ${lang.code}.json`);
			} else logger.log("warn", `No ${lang.code} file was found.`);
		} catch (e) {
			logger.log("warn", ` - ${lang.code} could not be loaded.`);
			console.log(e);
		}
	}

	return;
};
