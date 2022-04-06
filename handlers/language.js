const { languages } = require("../utils/collections");

module.exports = () => {
	console.log("Loading languages...");

	const languagesList = require("../lang/languages.json");

	for (const lang of languagesList) {
		var langFile;

		try {
			langFile = require(`../lang/${lang.code}.json`);

			if (langFile) {
				languages.set(lang.code, langFile);
				console.log(` - ${lang.code}.json`);
			} else console.warn(`No ${lang.code} file was found.`);
		} catch (e) {
			console.warn(` - ${lang.code} could not be loaded.`);
			console.log(e);
		}
	}

	return;
};
