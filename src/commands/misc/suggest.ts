import { SlashCommandBuilder, TextChannel } from 'discord.js';
import Command from '../../types/interfaces/Command';
import logger from '../../scripts/logger';
import ZEmbed from '../../types/classes/ZEmbed';

const suggest: Command = {
  data: new SlashCommandBuilder()
    .setName('suggest')
    .setDescription('Suggest a new feature or improvement.')
    .addStringOption((option) =>
      option
        .setName('suggestion')
        .setDescription('Your suggestion.')
        .setRequired(true)
        .setMaxLength(200)
        .setMinLength(10)
    ),
  execute: async (interaction) => {
    const suggestion = interaction.options.getString('suggestion');
    const suggestionChannel = (await interaction.guild?.channels.fetch(
      '1289328975872786547'
    )) as TextChannel;
    if (!suggestionChannel) {
      logger.error('Suggestion channel not found');
      return await interaction.reply({
        embeds: [
          new ZEmbed('error').setDescription(
            "Suggestion channel not found! Please contact the bot's developer"
          )
        ]
      });
    }
    const message = await suggestionChannel.send({
      embeds: [
        new ZEmbed('info')
          .setTitle(`${interaction.user.displayName}'s Suggestion`)
          .setDescription(suggestion)
      ]
    });
    logger.info(`Suggestion sent by ${interaction.user.tag}: ${suggestion}`);
    await interaction.reply({
      embeds: [
        new ZEmbed('success').setDescription(
          'Your suggestion has been sent to the development team!'
        )
      ]
    });
    await message.react('✅');
    await message.react('❌');

    return;
  }
};

export default suggest;
