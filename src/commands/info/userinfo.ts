import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  User
} from 'discord.js';
import Command from '../../types/interfaces/Command';
import logger from '../../scripts/logger';
import ZEmbed from '../../types/classes/ZEmbed';
import formatCustomDate from '../../scripts/formatdate';

const userinfo: Command = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Displays information about a user.')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription(
          'The user to get information about (defaults to yourself).'
        )
        .setRequired(false)
    ),

  execute: async (interaction: ChatInputCommandInteraction) => {
    try {
      if (!interaction.guild) return;

      const user: User =
        interaction.options.getUser('user') || interaction.user;
      const member = await interaction.guild?.members.fetch(user);
      const embed = new ZEmbed('info')
        .setTitle(`User Info for ${user.username}`)
        .setDescription(`Here is the information for ${member.displayName}:`)
        .addFields(
          { name: 'ID', value: user.id, inline: true },
          { name: 'Tag', value: user.tag, inline: true },
          {
            name: 'Created At',
            value: formatCustomDate(user.createdAt),
            inline: true
          },
          {
            name: 'Joined at',
            value: formatCustomDate(member.joinedAt as Date) || 'Unknown'
          }
        )
        .setThumbnail(user.avatarURL());

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
      logger.error('Error executing userinfo command:', error);
    }
  }
};

export default userinfo;
