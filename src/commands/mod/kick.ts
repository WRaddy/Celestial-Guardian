import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionsBitField
} from 'discord.js';
import Command from '../../types/interfaces/Command';
import logger from '../../scripts/logger';
import ZEmbed from '../../types/classes/ZEmbed';
const kick: Command = {
  permissions: [
    {
      type: 'Role',
      id: '1285666697063432252'
    },
    {
      type: 'Permission',
      id: PermissionsBitField.Flags.KickMembers.toString()
    }
  ],
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('kicks a user from the server.')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user to kick')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('The reason for the kick')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    // Log entire interaction data for debugging

    const user = interaction.options.data[0].user;
    const reason =
      interaction.options.getString('reason') || 'No reason provided';

    // Enhanced debugging

    if (!user) {
      return interaction.reply({
        embeds: [
          new ZEmbed('error').setDescription('Please specify a user to kick.')
        ],
        ephemeral: true
      });
    }

    // Fetch the guild member from the provided user
    const member = await interaction.guild?.members
      .fetch(user.id)
      .catch(() => null);

    if (!member) {
      return await interaction.reply({
        embeds: [
          new ZEmbed('error').setDescription(
            'That user is not a member of this server!'
          )
        ],
        ephemeral: true
      });
    }
    if (
      interaction.options.data[0].user?.id == interaction.guild?.members.me?.id
    ) {
      return await interaction.reply({
        embeds: [new ZEmbed('error').setDescription('I can’t kick myself!')],
        ephemeral: true
      });
    }
    if (interaction.options.data[0].user?.id == interaction.user.id) {
      return await interaction.reply({
        embeds: [
          new ZEmbed('error').setDescription('You can’t kick yourself!')
        ],
        ephemeral: true
      });
    }
    if (member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return await interaction.reply({
        embeds: [
          new ZEmbed('error').setDescription(
            'I can’t kick an admin. Sorry, no superpowers for me 😅'
          )
        ],
        ephemeral: true
      });
    }

    try {
      await member.kick();
      await interaction.reply({
        embeds: [
          new ZEmbed('error').setDescription(
            `**${user.tag}** has been kicked for: *${reason}* 🚫`
          )
        ],
        ephemeral: true
      });
    } catch (error) {
      logger.error('Error kicking user:', error);
      await interaction.reply({
        embeds: [
          new ZEmbed('error').setDescription(
            `Failed to kick **${user.tag}** 😕`
          )
        ],
        ephemeral: true
      });
    }
  }
};

export default kick;
