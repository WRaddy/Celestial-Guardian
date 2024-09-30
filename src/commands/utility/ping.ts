import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import Command from '../../types/interfaces/Command';
import logger from '../../scripts/logger';
import ZEmbed from '../../types/classes/ZEmbed';

const ping: Command = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with pong!'),
  execute: async (interaction: ChatInputCommandInteraction) => {
    try {
      await interaction.reply({
        embeds: [new ZEmbed('info').setDescription('Pong !')],
        ephemeral: true
      });
    } catch (error) {
      await interaction.reply({
        embeds: [
          new ZEmbed('error').setDescription(
            'An error occurred while executing this command, please contact the developer'
          )
        ]
      });
      logger.error('Error executing ping command:', error);
    }
  }
};

export default ping;
