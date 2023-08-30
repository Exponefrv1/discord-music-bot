const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');

module.exports = {
	cooldown: 3,
	data: new SlashCommandBuilder()
		.setName('join')
		.setDescription("Joins user's voice channel")
		.setDMPermission(false),
	async execute(interaction) {
		const connection = joinVoiceChannel({
			channelId: interaction.member.voice.channel.id,
			guildId: interaction.guild.id,
			adapterCreator: interaction.guild.voiceAdapterCreator
		});
		await interaction.reply('Joined your voice channel.');
	},
};
