const { SlashCommandBuilder } = require('discord.js');
const {
	getVoiceConnection,
	joinVoiceChannel,
	createAudioPlayer,
	createAudioResource,
	NoSubscriberBehavior
} = require('@discordjs/voice');
const play = require('play-dl');
const mysql = require('mysql2/promise');
const bluebird = require('bluebird');
const { DB_USER, DB_PASSWORD, DB_NAME } = require('../../config.json');

module.exports = {
	cooldown: 5,
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

			if (!interaction.member.voice.channel.id) {
				return await interaction.reply("Join voice channel first.");
			}

			const dbConnection = await mysql.createConnection({
				host     : 'localhost',
				user     : DB_USER,
				password : DB_PASSWORD,
				database : DB_NAME,
				Promise: bluebird
			});
			await dbConnection.connect();

			const songData = interaction.options.getString(`query`);

			let voiceConnection = getVoiceConnection(interaction.guild.id);

			if (!voiceConnection) {
				voiceConnection = joinVoiceChannel({
					channelId: interaction.member.voice.channel.id,
					guildId: interaction.guild.id,
					adapterCreator: interaction.guild.voiceAdapterCreator
				});
			}

			const createResource = async (songData) => {
				let stream;
				let title;
				let yt_info;
				if (!songData.includes("https://")) {
					yt_info = await play.search(songData, {limit: 1});
					stream = await play.stream(yt_info[0].url);
					title = yt_info[0].title;
				} else {
					yt_info = await play.video_basic_info(songData);
					stream = await play.stream(yt_info.video_details.url);
					title = yt_info.video_details.title;
				}
				if (yt_info.length == 0) {
					return await interaction.reply(`Nothing was found for \`\`\`**"${songData}"**\`\`\``);
				}
				await interaction.channel.send(`Started playing - **"${title}"**`);
				let resource = createAudioResource(stream.stream, {
					inputType: stream.type
				});
				return resource;
			};

			let player = voiceConnection._state.subscription;

			if (!player) {
				player = createAudioPlayer({
					behaviors: {
						noSubscriber: NoSubscriberBehavior.Idle
					}
				});
				await dbConnection.execute(
					"INSERT INTO queue (guild_id, queue_id, song) VALUES (?, ?, ?)",
					[interaction.guild.id, 0, songData]
				);
				await dbConnection.execute(
					"INSERT INTO playing (guild_id, queue_id, song) VALUES (?, ?, ?)",
					[interaction.guild.id, 0, songData]
				);
				await interaction.reply(`Looking for song...\n**Query**: \`\`\`${songData}\`\`\``);
			} else {
				let [rows, fields] = await dbConnection.execute(
					"SELECT MAX(queue_id) FROM queue WHERE guild_id = ?",
					[interaction.guild.id]
				);
				let lastSongId = rows[0]['MAX(queue_id)'];
				await dbConnection.execute(
					"INSERT INTO queue (guild_id, queue_id, song) VALUES (?, ?, ?)",
					[interaction.guild.id, lastSongId + 1, songData]
				);
				if (player.player._state.status != 'idle') {
					return await interaction.reply(`Added request to playback queue.\n**Query**: \`\`\`${songData}\`\`\``);
				} else {
					await dbConnection.execute(
						"INSERT INTO playing (guild_id, queue_id, song) VALUES (?, ?, ?)",
						[interaction.guild.id, lastSongId + 1, songData]
					);
					player.player.play(await createResource(songData));
					return await interaction.reply(`Looking for song...\n**Query**: \`\`\`${songData}\`\`\``);
				}
			}

			player.play(await createResource(songData));
			voiceConnection.subscribe(player);

			player.on("stateChange", async (oldOne, newOne) => {
				if (newOne.status == "idle") {

					if (!player.subscribers[0]) {
						return;
					}

					let rows;
					let fields;

					// Get current playing track
					[rows, fields] = await dbConnection.execute(
						"SELECT queue_id FROM playing WHERE guild_id = ?",
						[interaction.guild.id]
					);

					// Get repeat setting for guild
					[repeatData, repeatFields] = await dbConnection.execute(
						"SELECT repeat_track FROM settings WHERE guild_id = ?",
						[interaction.guild.id]
					);

					// Remove it from current playing track table
					await dbConnection.execute(
						"DELETE FROM playing WHERE guild_id = ?",
						[interaction.guild.id]
					);

					// Get id of the next song in queue
					let nextSongId = rows[0].queue_id;
					if (repeatData[0].repeat_track == 0) {
						nextSongId += 1;
					}

					// Get song with this id
					[rows, fields] = await dbConnection.execute(
						"SELECT song FROM queue WHERE guild_id = ? AND queue_id = ?",
						[interaction.guild.id, nextSongId]
					);

					// If song in queue exists - set new playing track and start playback
					if (rows[0]) {
						await dbConnection.execute(
							"INSERT INTO playing (guild_id, queue_id, song) VALUES (?, ?, ?)",
							[interaction.guild.id, nextSongId, rows[0].song]
						);
						player.play(await createResource(rows[0].song));
					} else {
						[rows, fields] = await dbConnection.execute(
							"SELECT loop_queue FROM settings WHERE guild_id = ?",
							[interaction.guild.id]
						);
						if (rows[0].loop_queue == 1) {
							[rows, fields] = await dbConnection.execute(
								"SELECT song FROM queue WHERE guild_id = ? AND queue_id = ?",
								[interaction.guild.id, 0]
							);
							if (rows[0]) {
								await dbConnection.execute(
									"INSERT INTO playing (guild_id, queue_id, song) VALUES (?, ?, ?)",
									[interaction.guild.id, 0, rows[0].song]
								);
								if (rows[0]) {
									player.play(await createResource(rows[0].song));
								}
							}
						}
					}
				}
			});
			voiceConnection.on('stateChange', async (oldOne, newOne) => {
				console.log(newOne.status)
				if (newOne.status == 'destroyed' || newOne.status == 'disconnected') {
					await dbConnection.execute(
						"DELETE FROM playing WHERE guild_id = ?",
						[interaction.guild.id]
					);
					await dbConnection.close();
				}
			});
			player.on('error', error => {
				console.error('Player error:', error.message, 'with track', error.resource.metadata.title);
			});
			voiceConnection.on('error', error => {
				console.error('Voice connection error', error);
			});
		} catch (error) {
			console.error('Play command', error);
		}
	},
};
