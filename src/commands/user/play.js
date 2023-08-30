const { SlashCommandBuilder } = require('discord.js');
const {
	joinVoiceChannel,
	createAudioPlayer,
	createAudioResource,
	NoSubscriberBehavior
} = require('@discordjs/voice');
const play = require('play-dl');

module.exports = {
	cooldown: 3,
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription("Joins user's voice channel and starts playing music.")
		.addStringOption(option =>
			option
				.setName(`query`)
				.setDescription(`Song link or title.`))
		.setDMPermission(false),
	async execute(interaction) {
		try {
			const query = interaction.options.getString(`query`);

			if (!query) {
				return await interaction.reply({content: 'Provide a query!', ephemeral: True});
			}

			const connection = joinVoiceChannel({
				channelId: interaction.member.voice.channel.id,
				guildId: interaction.guild.id,
				adapterCreator: interaction.guild.voiceAdapterCreator
			});

			let stream;
			let title;

			if (!query.includes("https://")) {
				let yt_info = await play.search(query, {
	            	limit: 1
	        	});
	        	if (yt_info.length === 0) {
					return await interaction.reply(`Nothing was found for **"${query}"**`);
				}
	        	stream = await play.stream(yt_info[0].url);
	        	title = yt_info[0].title;
	        	await interaction.reply(`Started playing - **"${title}"**`);

			} else {
				let yt_info = await play.video_basic_info(query);
				stream = await play.stream(yt_info.video_details.url);
				title = yt_info.video_details.title;
				await interaction.reply(`Started playing - **"${title}"**\n**Link** - ${query}`);
			}

			let player = createAudioPlayer({
				behaviors: {
	                noSubscriber: NoSubscriberBehavior.Play
	        	}
	        });

			let resource = createAudioResource(stream.stream, {
	        	inputType: stream.type
	    	});

	    	player.play(resource);
	    	connection.subscribe(player);

	    	player.on('error', error => {
				console.error('Error:', error.message, 'with track', error.resource.metadata.title);
			});
			
			connection.on('error', error => {
				console.error('Error');
			});
		
		} catch (error) {
			console.error('Error');
		}
	},
};
