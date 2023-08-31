const { SlashCommandBuilder } = require('discord.js');
const mysql = require('mysql2/promise');
const bluebird = require('bluebird');
const { HOST, DB_USER, DB_PASSWORD, DB_NAME } = require('../../config.json');

module.exports = {
    cooldown: 3,
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription("Clears queue")
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
        await dbConnection.execute(
            "DELETE FROM queue WHERE guild_id = ?",
            [interaction.guild.id]
        );
        await dbConnection.close();
        await interaction.reply("**Queue cleared.**");
    },
};
