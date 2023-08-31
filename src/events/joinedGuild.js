const { Events } = require('discord.js');
const mysql = require('mysql2/promise');
const bluebird = require('bluebird');
const {
	HOST,
	DB_USER,
	DB_PASSWORD,
	DB_NAME
} = require('../config.json');

module.exports = {
	name: Events.GuildCreate,
	async execute(guild) {
		console.log(`Joined new guild: ${guild.name}!`);
		const dbConnection = await mysql.createConnection({
			host     : HOST,
			user     : DB_USER,
			password : DB_PASSWORD,
			database : DB_NAME,
			Promise: bluebird
		});
		const [rows, fields] = await dbConnection.execute(
			"SELECT * FROM settings WHERE guild_id = ?",
			[guild.id]
		);
		if (!rows[0]) {
			await dbConnection.execute(
				"INSERT INTO settings (guild_id, loop_queue, repeat_track) VALUES (?, ?, ?)",
				[guild.id, 0, 0]
			);
		}
		await dbConnection.close();
	},
};