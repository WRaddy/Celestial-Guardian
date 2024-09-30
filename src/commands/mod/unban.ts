import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  GuildMember,
  PermissionsBitField
} from 'discord.js';
import Command from '../../types/interfaces/Command';
import ZEmbed from '../../types/classes/ZEmbed';

const unbanCommand: Command = {
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
    .setName('unban')
    .setDescription('Unban a member from the server')
    .addStringOption((option) =>
      option
        .setName('user')
        .setDescription('The username or user ID to unban')
        .setRequired(true)
    ),

  cooldown: 5, // 5-second cooldown to avoid spam

  async execute(interaction: ChatInputCommandInteraction) {
    const userInput = interaction.options.getString('user')!; // Username or ID entered by the user
    const guild = interaction.guild;

    if (!guild) {
      return interaction.reply({
        embeds: [
          new ZEmbed('error')
            .setDescription('This command can only be used in a server.')
            .setTitle('Command Failed')
        ],
        ephemeral: true
      });
    }

    // Check if user has the correct permissions
    const member = interaction.member as GuildMember;
    if (!member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return interaction.reply({
        embeds: [
          new ZEmbed('error')
            .setDescription('You do not have permission to unban members.')
            .setTitle('Permission Denied')
        ],
        ephemeral: true
      });
    }

    try {
      // Try to fetch the ban list and find the user by ID or username
      const bans = await guild.bans.fetch();
      const bannedUser = bans.find(
        (ban) => ban.user.id === userInput || ban.user.username === userInput
      );

      if (!bannedUser) {
        return interaction.reply({
          embeds: [
            new ZEmbed('error')
              .setDescription(
                `No banned user found with ID or username: \`${userInput}\`.`
              )
              .setTitle('Unban Failed')
          ],
          ephemeral: true
        });
      }

      // Unban the user
      await guild.bans.remove(bannedUser.user.id);

      return interaction.reply({
        embeds: [
          new ZEmbed('success')
            .setDescription(`Successfully unbanned \`${bannedUser.user.tag}\`!`)
            .setTitle('Unban Successful')
        ]
      });
    } catch (error) {
      console.error('Error unbanning user:', error);
      return interaction.reply({
        embeds: [
          new ZEmbed('error')
            .setDescription('An error occurred while trying to unban the user.')
            .setTitle('Unban Failed')
        ],
        ephemeral: true
      });
    }
  }
};

export default unbanCommand;
