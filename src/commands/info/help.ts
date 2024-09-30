import { SlashCommandBuilder } from 'discord.js';
import Command from '../../types/interfaces/Command';
import ZClient from '../../types/classes/ZClient';
import logger from '../../scripts/logger';
import ZEmbed from '../../types/classes/ZEmbed';

const help: Command = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Displays a list of commands with brief descriptions'),
  execute: async (interaction) => {
    const bot = interaction.client as ZClient;

    const commandNames = Array.from(bot.commands.keys());
    const commandsData = Array.from(bot.commands.values());
    let embedDescription = `Here is the info for all commands!\n`;
    for (const commandData of commandsData) {
      const description = commandData.data.description;
      embedDescription += `* **${commandData.data.name}**: ${description}\n`;
    }
    await interaction.reply({
      embeds: [
        new ZEmbed('info')
          .setDescription(embedDescription)
          .setTitle('Help Command')
      ]
    });
  }
};

export default help;
