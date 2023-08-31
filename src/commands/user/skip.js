const { SlashCommandBuilder } = require('discord.js');
const mysql = require('mysql2/promise');
const bluebird = require('bluebird');
const play = require('play-dl');
const { DB_USER, DB_PASSWORD, DB_NAME } = require('../../config.json');
const { getVoiceConnection, createAudioResource } = require('@discordjs/voice');

module.exports = {
	cooldown: 3,
	data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription("Skip current song")
		.setDMPermission(false),
	async execute(interaction) {

		const connection = getVoiceConnection(interaction.guild.id);
		if (!connection) {
			return await interaction.reply("**I'm not in a voice channel.**")
		}
		let player = connection._state.subscription;
		if (!player) {
			return await interaction.reply('**No songs playing now.**');
		}
		player = player.player;

		const dbConnection = await mysql.createConnection({
			host     : 'localhost',
			user     : DB_USER,
			password : DB_PASSWORD,
			database : DB_NAME,
			Promise: bluebird
		});
		await dbConnection.connect();

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

		let rows;
		let fields;
		[rows, fields] = await dbConnection.execute(
			"SELECT queue_id FROM playing WHERE guild_id = ?",
			[interaction.guild.id]
		);
		if (rows[0]) {
			let prevSongId = rows[0].queue_id;
			[rows, fields] = await dbConnection.execute(
				"SELECT song FROM queue WHERE guild_id = ? AND queue_id = ?",
				[interaction.guild.id, prevSongId + 1]
			);
			if (!rows[0]) {
				prevSongId = -1;
				[rows, fields] = await dbConnection.execute(
					"SELECT song FROM queue WHERE guild_id = ? AND queue_id = ?",
					[interaction.guild.id, 0]
				);
			}
			if (rows[0]) {
				await dbConnection.execute(
					"DELETE FROM playing WHERE guild_id = ?",
					[interaction.guild.id]
				);
				await dbConnection.execute(
					"INSERT INTO playing (guild_id, queue_id, song) VALUES (?, ?, ?)",
					[interaction.guild.id, prevSongId + 1, rows[0].song]
				);
				player.play(await createResource(rows[0].song));
				return await interaction.reply('**Skipping...**');
			} else {
				return await interaction.reply("**Queue is empty.**")
			}
		}
		await interaction.reply('**No songs playing now.**')
	},
};
