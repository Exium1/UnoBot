const config = require("../utils/config");
const embedColors = config.embeds.colors;

class Embed {
	constructor(data = {}) {
		this.setup(data);
	}

	setup(data) {
		this.embed = {
			type: data.type || "rich",
			title: data.title || null,
			description: data.description || null,
			color: data.color || embedColors.default,
			timestamp: data.timestamp ? new Date(data.timestamp).getTime() : null,
			fields: [],
			author: data.author
				? {
						name: data.author.name,
						url: data.author.url,
						icon_url: data.author.iconURL || null,
						proxy_icon_url: data.author.proxyIconURL || null
				  }
				: null,
			thumbnail: data.thumbnail
				? {
						url: data.thumbnail.url,
						proxyURL: data.thumbnail.proxyURL || null,
						height: data.thumbnail.height || null,
						width: data.thumbnail.width || null
				  }
				: null,
			image: data.image
				? {
						url: data.image.url,
						proxyURL: data.image.proxyURL || null,
						height: data.image.height || null,
						width: data.image.width || null
				  }
				: null,

			video: data.video
				? {
						url: data.video.url,
						proxyURL: data.video.proxyURL || null,
						height: data.video.height || null,
						width: data.video.width || null
				  }
				: null,
			provider: data.provider
				? {
						name: data.provider.name,
						url: data.provider.name
				  }
				: null,
			footer: data.footer
				? {
						text: data.footer.text,
						iconURL: data.footer.iconURL || null,
						proxyIconURL: data.footer.proxyIconURL || null
				  }
				: null,
			files: data.files || []
		};
	}

	addField(name, value, inline) {
		return this.addFields({ name, value, inline });
	}

	addFields(...fields) {
		this.embed.fields.push(...fields);
		return this;
	}

	spliceFields(index, deleteCount, ...fields) {
		this.embed.fields.splice(index, deleteCount, ...fields);
		return this;
	}

	attachFiles(files) {
		this.embed.files = this.embed.files.concat(files);
		return this;
	}

	setAuthor(name, iconURL, url) {
		this.embed.author = { name: name, icon_url: iconURL, url: url };
		return this;
	}

	setColor(color) {
		if (embedColors[color]) this.embed.color = embedColors[color];
		else this.embed.color = color;
		return this;
	}

	setDescription(description) {
		this.embed.description = description;
		return this;
	}

	setFooter(text, iconURL) {
		this.embed.footer = { text: text, icon_url: iconURL };
		return this;
	}

	setImage(url) {
		this.embed.image = { url };
		return this;
	}

	setThumbnail(url) {
		if (url == "logo") this.embed.thumbnail = { url: config.botAvatarURL };
		else this.embed.thumbnail = { url };
		return this;
	}

	setTimestamp(timestamp = Date.now()) {
		if (timestamp instanceof Date) timestamp = timestamp.getTime();
		this.embed.timestamp = timestamp;
		return this;
	}

	setTitle(title) {
		this.embed.title = title;
		return this;
	}

	setURL(url) {
		this.embed.url = url;
		return this;
	}
}

module.exports = Embed;
