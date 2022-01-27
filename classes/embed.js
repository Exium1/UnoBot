const config = require("../utils/config");
const embedColors = config.embeds.colors;

class Embed {
	constructor(data = {}) {
		this.setup(data);
	}

	setup(data) {
		this.type = data.type || "rich";
		this.title = data.title || null;
		this.description = data.description || null;
		this.color = data.color || embedColors.default;
		this.timestamp = data.timestamp ? new Date(data.timestamp).getTime() : null;
		this.fields = [];
		this.author = data.author
			? {
					name: data.author.name,
					url: data.author.url,
					icon_url: data.author.iconURL || null,
					proxy_icon_url: data.author.proxyIconURL || null
			  }
			: null;
		this.thumbnail = data.thumbnail
			? {
					url: data.thumbnail.url,
					proxyURL: data.thumbnail.proxyURL || null,
					height: data.thumbnail.height || null,
					width: data.thumbnail.width || null
			  }
			: null;
		this.image = data.image
			? {
					url: data.image.url,
					proxyURL: data.image.proxyURL || null,
					height: data.image.height || null,
					width: data.image.width || null
			  }
			: null;
		this.video = data.video
			? {
					url: data.video.url,
					proxyURL: data.video.proxyURL || null,
					height: data.video.height || null,
					width: data.video.width || null
			  }
			: null;
		this.provider = data.provider
			? {
					name: data.provider.name,
					url: data.provider.name
			  }
			: null;
		this.footer = data.footer
			? {
					text: data.footer.text,
					iconURL: data.footer.iconURL || null,
					proxyIconURL: data.footer.proxyIconURL || null
			  }
			: null;
		this.files = data.files || [];
	}

	addField(name, value, inline) {
		return this.addFields({ name, value, inline });
	}

	addFields(...fields) {
		this.fields.push(...fields);
		return this;
	}

	spliceFields(index, deleteCount, ...fields) {
		this.fields.splice(index, deleteCount, ...fields);
		return this;
	}

	attachFiles(files) {
		this.files = this.files.concat(files);
		return this;
	}

	setAuthor(name, iconURL, url) {
		this.author = { name: name, icon_url: iconURL, url: url };
		return this;
	}

	setColor(color) {
		if (embedColors[color]) this.color = embedColors[color];
		else this.color = color;
		return this;
	}

	setDescription(description) {
		this.description = description;
		return this;
	}

	setFooter(text, iconURL) {
		this.footer = { text: text, icon_url: iconURL };
		return this;
	}

	setImage(url) {
		this.image = { url };
		return this;
	}

	setThumbnail(url) {
		if (url == "logo") this.thumbnail = { url: config.botAvatarURL };
		else this.thumbnail = { url };
		return this;
	}

	setTimestamp(timestamp = Date.now()) {
		if (timestamp instanceof Date) timestamp = timestamp.getTime();
		this.timestamp = timestamp;
		return this;
	}

	setTitle(title) {
		this.title = title;
		return this;
	}

	setURL(url) {
		this.url = url;
		return this;
	}
}

module.exports = Embed;
