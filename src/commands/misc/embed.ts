import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ColorResolvable
} from 'discord.js';
import Command from '../../types/interfaces/Command';

const embed: Command = {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Sends a message as an embed')
    .addStringOption((option) =>
      option
        .setName('title')
        .setDescription('The title of the embed')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('description')
        .setDescription('The description of the embed')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('color')
        .setDescription('The color of the embed in HEX (e.g., #FF5733)')
        .setRequired(false)
    ),
  developerOnly: true,
  execute: async (interaction: ChatInputCommandInteraction) => {
    // Fetch options from the command
    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description');
    const color = interaction.options.getString('color') || 'Blurple'; // Default color if none is provided

    // Create an embed
    const embed = new EmbedBuilder()
      .setTitle(title!)
      .setDescription(description!)
      .setColor(color as ColorResolvable);

    // Respond by sending the embed
    await interaction.reply({ embeds: [embed] });
  }
};

export default embed;
