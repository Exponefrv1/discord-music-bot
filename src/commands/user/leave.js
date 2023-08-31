const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    cooldown: 3,
    data: new SlashCommandBuilder()
        .setName('leave')
        .setDescription('Leave current voice channel')
        .setDMPermission(false),
    async execute(interaction) {
        getVoiceConnection(interaction.guild.id).destroy();
        await interaction.reply('Left voice channel.');
    },
};
