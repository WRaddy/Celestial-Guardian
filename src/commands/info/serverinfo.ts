import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import Command from '../../types/interfaces/Command';
import logger from '../../scripts/logger';
import ZEmbed from '../../types/classes/ZEmbed';

const serverinfo: Command = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Displays information about the server.'),

  execute: async (interaction: ChatInputCommandInteraction) => {
    try {
      const guild = interaction.guild;

      if (!guild) {
        throw new Error('Guild not found.');
      }

      const embed = new ZEmbed('info')
        .setTitle(`Server Info for ${guild.name}`)
        .setDescription(`Here is the information for ${guild.name}:`)
        .addFields(
          { name: 'ID', value: guild.id, inline: true },
          { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
          {
            name: 'Member Count',
            value: guild.memberCount.toString(),
            inline: true
          },
          {
            name: 'Created At',
            value: guild.createdAt.toDateString(),
            inline: true
          },
          { name: 'Region', value: guild.preferredLocale, inline: true }
        );

      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
    } catch (error) {
      await interaction.reply({
        embeds: [
          new ZEmbed('error').setDescription(
            'An error occurred while executing this command, please contact the developer.'
          )
        ]
      });
      logger.error('Error executing serverinfo command:', error);
    }
  }
};

export default serverinfo;
