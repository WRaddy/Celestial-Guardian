import Command from '../../types/interfaces/Command';
import { SlashCommandBuilder } from 'discord.js';
import { getVoiceConnection, AudioPlayerStatus } from '@discordjs/voice';
import ZEmbed from '../../types/classes/ZEmbed';
import logger from '../../scripts/logger';

export const pause: Command = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause the currently playing song'),

  execute: async (interaction) => {
    if (!interaction.guild) return;

    const connection = getVoiceConnection(interaction.guild.id);
    if (!connection) {
      return await interaction.reply({
        embeds: [
          new ZEmbed('error').setDescription(
            'No active voice connection found!'
          )
        ]
      });
    }

    // Access the player from the connection
    const player = Reflect.get(connection, 'player');
    if (!player || player.state.status !== AudioPlayerStatus.Playing) {
      return await interaction.reply({
        embeds: [
          new ZEmbed('error').setDescription('No song is currently playing!')
        ]
      });
    }

    player.pause();
    logger.info('Audio paused by ' + interaction.user.tag);

    await interaction.reply({
      embeds: [
        new ZEmbed('success').setDescription('The song has been paused!')
      ]
    });
  }
};

export default pause;
