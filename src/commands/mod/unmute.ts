import {
  GuildMember,
  PermissionsBitField,
  SlashCommandBuilder
} from 'discord.js';
import Command from '../../types/interfaces/Command';
import ZEmbed from '../../types/classes/ZEmbed';
import db from '../../firebase/firebase';

const unmute: Command = {
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
    .setName('unmute')
    .setDescription('Unmutes a specific player')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user to unmute')
        .setRequired(true)
    ),
  execute: async (interaction) => {
    const user = interaction.options.getUser('user', true);
    const member = await interaction.guild?.members.fetch(user.id);
    const role = interaction.guild?.roles.cache.find(
      (role) => role.name == 'Muted'
    );
    const roleCheck = member?.roles.cache.some((Role) => Role === role);
    const muteDoc = db.collection('mutes').doc(user.id);
    const isMuted = (await muteDoc.get()).exists;
    if (!member) {
      return await interaction.reply({
        embeds: [
          new ZEmbed('error').setDescription('Member is not in the server.')
        ],
        ephemeral: true
      });
    }
    if (!role) {
      return await interaction.reply({
        embeds: [
          new ZEmbed('error').setDescription(
            'The server does not have a muted role.'
          )
        ],
        ephemeral: true
      });
    }
    if (!roleCheck) {
      return await interaction.reply({
        embeds: [
          new ZEmbed('error').setDescription('The member is not muted.')
        ],
        ephemeral: true
      });
    }
    if (!isMuted) {
      return await interaction.reply({
        embeds: [
          new ZEmbed('error').setDescription(
            'The member is not currently muted.'
          )
        ],
        ephemeral: true
      });
    }
    await member.roles.remove(role);
    await muteDoc.delete();
    await interaction.reply({
      embeds: [new ZEmbed('success').setDescription(`Unmuted ${user.tag}.`)],
      ephemeral: true
    });
  }
};

export default unmute;
