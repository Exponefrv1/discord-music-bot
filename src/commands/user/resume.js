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
		const player = connection._state.subscription.player;
		player.unpause();
		await interaction.reply("Unpaused!")
	},
};
