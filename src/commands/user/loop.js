const { SlashCommandBuilder } = require('discord.js');
const mysql = require('mysql2/promise');
const bluebird = require('bluebird');
const { HOST, DB_USER, DB_PASSWORD, DB_NAME } = require('../../config.json');

module.exports = {
	cooldown: 3,
	data: new SlashCommandBuilder()
		.setName('loop')
		.setDescription("Loop queue")
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
			"SELECT loop_queue FROM settings WHERE guild_id = ?",
			[interaction.guild.id]
		);
		let loopData = rows[0]
		if (!loopData) {
			await dbConnection.execute(
				"INSERT INTO settings (guild_id, loop_queue, repeat_track) VALUES (?, ?, ?)",
				[interaction.guild.id, 1, 0]
			);
		} else {
			let newValue;
			if (loopData.loop_queue == 1) {
				newValue = 0;
				await interaction.reply("**Loop disabled.**");
			}
			if (loopData.loop_queue == 0) {
				newValue = 1;
				await interaction.reply("**Loop enabled.**");
			}
			await dbConnection.execute(
				"UPDATE settings SET loop_queue = ? WHERE guild_id = ?",
				[newValue, interaction.guild.id]
			);
		}
		await dbConnection.close();
	},
};
