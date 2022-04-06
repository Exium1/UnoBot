const mongoose = require("mongoose");
const { mongoURI } = require("../utils/config");

module.exports = async () => {
	var connection = await mongoose
		.connect(mongoURI, {
			useNewUrlParser: true,
			useUnifiedTopology: true
		})
		.then(() => console.log("MongoDB connected!"))
		.catch((err) => console.log(`DB Connection Error: ${err.message}`));

	return connection;
};
