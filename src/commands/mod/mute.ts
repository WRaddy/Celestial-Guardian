import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionsBitField
} from 'discord.js';
import Command from '../../types/interfaces/Command';
import db from '../../firebase/firebase';
import ms from 'ms';
import logger from '../../scripts/logger';
import ZEmbed from '../../types/classes/ZEmbed';

const mute: Command = {
  permissions: [
    {
      type: 'Role',
      id: '1285666697063432252'
    },
    {
      type: 'Permission',
      id: PermissionsBitField.Flags.MuteMembers.toString()
    }
  ],
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mutes a user from the server.')
    .addStringOption((option) =>
      option
        .setName('duration')
        .setDescription('The duration for the mute (e.g., "5d 2h")')
        .setRequired(true)
    )
    .addUserOption((option) =>
      option
        .setName('target')
        .setDescription('The user to mute')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('The reason for the mute')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const rawDuration = interaction.options.getString('duration');
    const duration = ms(rawDuration as string);

    const reason =
      interaction.options.getString('reason') || 'No reason provided';
    const moderatorID = interaction.user.id;

    // Fetch the target user
    const target = interaction.options.getUser('target');
    if (!target) {
      return await interaction.reply({
        embeds: [
          new ZEmbed('error').setDescription('Please specify a user to mute.')
        ],
        ephemeral: true
      });
    }

    const muteData = {
      mutedAt: new Date(),
      duration, // In seconds
      reason,
      moderatorID,
      unmuteAt: duration ? new Date(Date.now() + duration) : null // Calculate unmute timestamp
    };

    // Fetch the guild member
    const member = await interaction.guild?.members
      .fetch(target.id)
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

    // Prevent muting bot, yourself, or admins
    if (target.id === interaction.guild?.members.me?.id) {
      return await interaction.reply({
        embeds: [new ZEmbed('error').setDescription('I can’t mute myself!')],
        ephemeral: true
      });
    }

    if (target.id === interaction.user.id) {
      return await interaction.reply({
        embeds: [
          new ZEmbed('error').setDescription('You can’t mute yourself!')
        ],
        ephemeral: true
      });
    }

    if (member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return await interaction.reply({
        embeds: [
          new ZEmbed('error').setDescription(
            'I can’t mute an admin. Sorry, no superpowers for me 😅'
          )
        ],
        ephemeral: true
      });
    }

    try {
      // Find the 'Muted' role
      const role = interaction.guild?.roles.cache.find(
        (role) => role.name === 'Muted'
      );
      if (!role) {
        return await interaction.reply({
          embeds: [
            new ZEmbed('error').setDescription(
              'No muted role found. Please create one and try again.'
            )
          ],
          ephemeral: true
        });
      }

      if (member.roles.cache.some((r) => r == role)) {
        // Overwrite mute duration if the user is already muted
        await interaction.reply({
          embeds: [
            new ZEmbed('error').setDescription(
              'The user is already muted, proceeding to overwrite mute duration.  '
            )
          ],
          ephemeral: true
        });

        if (muteData.duration) {
          await db.collection('mutes').doc(target.id).update(muteData);
        } else {
          await db.collection('mutes').doc(target.id).delete();
          return await interaction.reply({
            content:
              'The user is already muted, please provide a duration in order to overwrite.'
          });
        }

        return interaction.editReply({
          embeds: [
            new ZEmbed('error').setDescription(
              "The user's mute duration has been overwritten.  "
            )
          ]
        });
      }
      // Add the 'Muted' role to the member
      await member.roles.add(role);

      setTimeout(async () => {
        // Remove the 'Muted' role from the member
        await member.roles.remove(role);
        await db.collection('mutes').doc(member.user.id).delete();

        logger.info(
          `Member ${
            member.displayName
          } successfully unmuted after their duration (${
            duration / 1000
          }s) has been due.`
        );
      }, duration);
      // Write mute data to Firestore
      await db.collection('mutes').doc(target.id).set(muteData);

      await interaction.reply({
        embeds: [
          new ZEmbed('success').setDescription(
            `**${target.tag}** has been muted for: *${reason}* 🚫`
          )
        ],
        ephemeral: true
      });
    } catch (error) {
      logger.error('Error muting user:', error);
      await interaction.reply({
        embeds: [
          new ZEmbed('error').setDescription(
            `Failed to mute **${target.tag}** 😕`
          )
        ],
        ephemeral: true
      });
    }
  }
};

export default mute;
