import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionsBitField
} from 'discord.js';
import Command from '../../types/interfaces/Command';
import logger from '../../scripts/logger';
import ZEmbed from '../../types/classes/ZEmbed';

const ban: Command = {
  permissions: [
    {
      type: 'Role',
      id: '1285666697063432252'
    },
    {
      type: 'Permission',
      id: PermissionsBitField.Flags.BanMembers.toString()
    }
  ],
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bans a user from the server.')
    .addUserOption((option) =>
      option.setName('user').setDescription('The user to ban').setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('The reason for the ban')
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
        content: 'Please specify a user to ban.',
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
            `The user **${user.tag}** is not a member of this server.`
          )
        ],
        ephemeral: true
      });
    }
    if (
      interaction.options.data[0].user?.id == interaction.guild?.members.me?.id
    ) {
      return await interaction.reply({
        embeds: [new ZEmbed('error').setDescription('I cannot ban myself!')],
        ephemeral: true
      });
    }
    if (interaction.options.data[0].user?.id == interaction.user.id) {
      return await interaction.reply({
        embeds: [
          new ZEmbed('error').setDescription('You cannot ban yourself!')
        ],
        ephemeral: true
      });
    }
    if (member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return await interaction.reply({
        embeds: [
          new ZEmbed('error').setDescription(
            'I cannot ban an admin. Sorry, no superpowers for me '
          )
        ],
        ephemeral: true
      });
    }

    try {
      await member.ban({ reason });
      await interaction.reply({
        embeds: [
          new ZEmbed('error').setDescription(
            `**${user.tag}** has been banned for: *${reason}* 🚫`
          )
        ],
        ephemeral: true
      });
    } catch (error) {
      logger.error('Error banning user:', error);
      await interaction.reply({
        embeds: [
          new ZEmbed('error').setDescription(`Failed to ban **${user.tag}** 😕`)
        ],
        ephemeral: true
      });
    }
  }
};

export default ban;
