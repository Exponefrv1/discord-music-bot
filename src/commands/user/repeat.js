const { SlashCommandBuilder } = require('discord.js');
const mysql = require('mysql2/promise');
const bluebird = require('bluebird');
const { HOST, DB_USER, DB_PASSWORD, DB_NAME } = require('../../config.json');

module.exports = {
	cooldown: 3,
	data: new SlashCommandBuilder()
		.setName('repeat')
		.setDescription("Repeat track")
		.setDMPermission(false),
	async execute(interaction) {
		const dbConnection = await mysql.createConnection({
			host     : HOST,
			user     : DB_USER,
			password : DB_PASSWORD,
			database : DB_NAME,
			Promise: bluebird
		});
		await dbConnection.connect();
		const [rows, fields] = await dbConnection.execute(
			"SELECT repeat_track FROM settings WHERE guild_id = ?",
			[interaction.guild.id]
		);
		let repeatData = rows[0]
		if (!repeatData) {
			await dbConnection.execute(
				"INSERT INTO settings (guild_id, loop_queue, repeat_track) VALUES (?, ?, ?)",
				[interaction.guild.id, 0, 1]
			);
		} else {
			let newValue;
			if (repeatData.repeat_track == 1) {
				newValue = 0;
				await interaction.reply("**Repeat disabled.**");
			}
			if (repeatData.repeat_track == 0) {
				newValue = 1;
				await interaction.reply("**Repeat enabled.**");
			}
			await dbConnection.execute(
				"UPDATE settings SET repeat_track = ? WHERE guild_id = ?",
				[newValue, interaction.guild.id]
			);
		}
		await dbConnection.close();
	},
};