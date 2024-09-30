import {
  ActionRowBuilder,
  ChatInputCommandInteraction,
  ModalActionRowComponentBuilder,
  ModalBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js';
import Command from '../../types/interfaces/Command';
import logger from '../../scripts/logger';
import ZEmbed from '../../types/classes/ZEmbed';
import db from '../../firebase/firebase';
import formatCustomDate from '../../scripts/formatdate';

const profile: Command = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('The command to create, view, and delete profiles!')
    .addSubcommand((command) =>
      command.setName('create').setDescription('Create your profile!')
    )
    .addSubcommand((command) =>
      command.setName('delete').setDescription('Delete your profile!')
    )
    .addSubcommand((command) =>
      command.setName('view').setDescription('View your profile!')
    ),

  execute: async (interaction: ChatInputCommandInteraction) => {
    const subCommand = interaction.options.getSubcommand(false); // Get subcommand, allow no subcommand

    if (!subCommand || subCommand === 'view') {
      // View profile logic if no subcommand or if the 'view' subcommand is used
      const profileDoc = await db
        .collection('profiles')
        .doc(interaction.user.id)
        .get();
      if (!profileDoc.exists) {
        return await interaction.reply({
          embeds: [
            new ZEmbed('error').setDescription(
              "You don't have a profile yet! Use `/profile create` to create one."
            )
          ],
          ephemeral: true
        });
      }

      const profileData = profileDoc.data();
      const createdAt = formatCustomDate((profileData?.createdAt).toDate());
      const embed = new ZEmbed('info')
        .setTitle(`${interaction.user.username}'s Profile`)
        .setDescription(
          `Name: **${profileData?.username}**\nBio: **${profileData?.bio}**\nRank: **${profileData?.rank}**\n Level: **${profileData?.level}**\n Points: **${profileData?.points}**\n Date of creation: **${createdAt}**`
        );

      return await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
    }

    if (subCommand === 'create') {
      // Create profile logic (modal)
      const createModal = new ModalBuilder()
        .setCustomId('createModal')
        .setTitle('Create Profile');
      const profileNameInput = new TextInputBuilder()
        .setCustomId('profileNameInput')
        .setLabel('Choose Profile Name!')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
      const profileBioInput = new TextInputBuilder()
        .setCustomId('profileBioInput')
        .setLabel('Choose Profile Bio')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      const firstActionRow =
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
          profileNameInput
        );
      const secondActionRow =
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
          profileBioInput
        );

      createModal.addComponents(firstActionRow, secondActionRow);
      await interaction.showModal(createModal);
    }

    if (subCommand === 'delete') {
      // Delete profile logic
      const profileDoc = await db
        .collection('profiles')
        .doc(interaction.user.id)
        .get();

      if (!profileDoc.exists) {
        return await interaction.reply({
          embeds: [
            new ZEmbed('error').setDescription("You don't have a profile!")
          ],
          ephemeral: true
        });
      }

      await db.collection('profiles').doc(interaction.user.id).delete();

      return await interaction.reply({
        embeds: [
          new ZEmbed('success').setDescription('Profile deleted successfully!')
        ],
        ephemeral: true
      });
    }
  }
};

export default profile;
