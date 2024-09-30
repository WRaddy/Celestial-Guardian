import { PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import Command from '../../types/interfaces/Command';
import db from '../../firebase/firebase';
import ZEmbed from '../../types/classes/ZEmbed';
import logger from '../../scripts/logger';

const selfRoles: Command = {
  permissions: [
    {
      type: 'Permission',
      id: PermissionsBitField.Flags.ManageGuild.toString()
    }
  ],
  data: new SlashCommandBuilder()
    .setName('self-roles')
    .setDescription('The command to setup, delete and edit self roles !')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('setup')
        .setDescription('Setup self roles.')
        .addChannelOption((option) =>
          option
            .setName('channel')
            .setDescription('The channel to setup roles in.')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('name')
            .setDescription('The name for your self-roles!')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('edit').setDescription('Edit self roles.')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('delete')
        .setDescription('Delete self roles.')
        .addChannelOption((option) =>
          option
            .setDescription("The channel's self roles you wish to be delete.")
            .setRequired(true)
            .setName('channel')
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('add')
        .setDescription('Add self roles.')
        .addRoleOption((option) =>
          option
            .setName('role')
            .setDescription("The role you'd like to use.")
            .setRequired(true)
        )
        .addChannelOption((option) =>
          option
            .setName('channel')
            .setDescription("The channel you'd like to add self roles in.")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('emoji')
            .setDescription("The emoji you'd like to use.")
            .setRequired(true)
        )
    ),
  execute: async (interaction) => {
    const subCommand = interaction.options.getSubcommand(false); // Get subcommand, allow no subcommand
    if (!subCommand || subCommand === 'setup') {
      const channel = interaction.options.getChannel('channel', true);
      const name = interaction.options.getString('name', true);
      const channelId = channel.id;
      const selfRolesDoc = await db
        .collection('selfRoles')
        .doc(channelId)
        .get();
      if (selfRolesDoc.exists) {
        await interaction.reply({
          embeds: [
            new ZEmbed('error').setDescription(
              'Self roles for this channel already exist, use `/self-roles delete` to delete them.'
            )
          ]
        });
        return;
      }

      await db.collection('selfRoles').doc(channelId).set({
        rolesName: name,
        roleIds: [],
        roleEmojis: []
      });
      await interaction.reply({
        embeds: [
          new ZEmbed('success').setDescription(
            `SelfRoles successfully set up in <#${channelId}>`
          )
        ]
      });
    } else if (subCommand === 'delete') {
      const channelId = interaction.options.getChannel('channel')?.id;
      if (!channelId) return;
      const selfRolesDoc = await db
        .collection('selfRoles')
        .doc(channelId)
        .get();
      if (!selfRolesDoc.exists) {
        await interaction.reply({
          embeds: [
            new ZEmbed('error').setDescription(
              'You do not have self roles set up in that channel, please use `/self-roles create` to do so'
            )
          ]
        });
        return;
      } else {
        await db.collection('selfRoles').doc(channelId).delete();
        await interaction.reply({
          embeds: [
            new ZEmbed('success').setDescription(
              'Successfully deleted self roles in that channel.'
            )
          ]
        });
        return;
      }
    } else if (subCommand == 'add') {
      await interaction.reply({
        embeds: [
          new ZEmbed('info')
            .setDescription("Hold on I'm cooking")
            .setTitle('Hold on...')
        ],
        ephemeral: true
      });
      const roleId = interaction.options.getRole('role', true).id;
      const channelId = interaction.options.getChannel('channel', true).id;
      const emoji = interaction.options.getString('emoji', true);
      const selfRolesDoc = db.collection('selfRoles').doc(channelId);
      if (!(await selfRolesDoc.get()).exists) {
        await interaction.editReply({
          embeds: [
            new ZEmbed('error').setDescription(
              'You do not have self roles set up in that channel, please use `/self-roles create` to do so'
            )
          ]
        });
        return;
      }
      const selfRolesData = (await selfRolesDoc.get()).data();
      if (!selfRolesData) return logger.info('here');
      const emojisArray = selfRolesData.roleEmojis;
      const rolesArray = selfRolesData.roleIds;
      emojisArray.push(emoji);
      rolesArray.push(roleId);
      logger.info(`Emojis Array: ${emojisArray}\n Roles Array: ${rolesArray}`);
      await selfRolesDoc.update({
        roleIds: rolesArray,
        roleEmojis: emojisArray
      });
      await interaction.editReply({
        embeds: [
          new ZEmbed('success').setDescription(
            `Successfully added ${
              interaction.guild?.roles.cache.get(roleId)?.name
            } as a self role in <#${channelId}>`
          )
        ]
      });
    }
  }
};

export default selfRoles;
