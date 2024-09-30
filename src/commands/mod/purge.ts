import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  TextChannel,
  PermissionsBitField
} from 'discord.js';
import Command from '../../types/interfaces/Command';
import ZEmbed from '../../types/classes/ZEmbed';
const purge: Command = {
  permissions: [
    {
      type: 'Role',
      id: '1285666697063432252'
    },
    {
      type: 'Permission',
      id: PermissionsBitField.Flags.ManageMessages.toString()
    }
  ],
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Deletes messages in a channel')
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription(
          'The channel to purge messages from (defaults to current channel)'
        )
        .setRequired(false)
    )
    .addIntegerOption((option) =>
      option
        .setName('depth')
        .setDescription(
          'The number of messages to delete (1-100). If not provided, all messages will be deleted.'
        )
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(100)
    ),

  execute: async (interaction: ChatInputCommandInteraction) => {
    const channel = (interaction.options.getChannel('channel') ||
      interaction.channel) as TextChannel;
    const depth = interaction.options.getInteger('depth');

    if (!channel) {
      return interaction.reply({
        embeds: [
          new ZEmbed('error')
            .setDescription('Please provide a valid text channel.')
            .setTitle('Error')
        ]
      });
    }

    await interaction.reply({
      embeds: [
        new ZEmbed('info')
          .setDescription(`Preparing to delete messages from ${channel}.`)
          .setTitle('Info')
      ],
      ephemeral: true
    });

    let deletedMessagesCount = 0;

    try {
      if (depth) {
        const fetchedMessages = await channel.messages.fetch({ limit: depth });
        const deleted = await channel.bulkDelete(fetchedMessages, true);
        deletedMessagesCount += deleted.size;
      } else {
        while (true) {
          const fetchedMessages = await channel.messages.fetch({ limit: 100 });
          if (fetchedMessages.size === 0) break;

          const deleted = await channel.bulkDelete(fetchedMessages, true);
          deletedMessagesCount += deleted.size;
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      await interaction.editReply({
        embeds: [
          new ZEmbed('success')
            .setDescription(
              `Deleted a total of ${deletedMessagesCount} messages from ${channel}.`
            )
            .setTitle('Success')
        ]
      });
    } catch (error) {
      console.error('Error deleting messages:', error);
      await interaction.editReply({
        embeds: [
          new ZEmbed('error')
            .setDescription('There was an error trying to purge messages.')
            .setTitle('Error')
        ]
      });
    }
  }
};

export default purge;
