const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    cooldown: 3,
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription("Unpauses playback")
        .setDMPermission(false),
    async execute(interaction) {
        const connection = getVoiceConnection(interaction.guild.id);
        if (!connection) {
            return await interaction.reply("**I'm not in a voice channel.**")
        }
        
        const player = connection._state.subscription.player;
        if (!player) {
            return await interaction.reply('**No songs playing now.**');
        }
        player.unpause();
        await interaction.reply("**Unpaused.**");
    },
};
