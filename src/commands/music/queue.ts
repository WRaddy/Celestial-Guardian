import { Guild, SlashCommandBuilder } from 'discord.js';
import Command from '../../types/interfaces/Command';
import db from '../../firebase/firebase';
import ZEmbed from '../../types/classes/ZEmbed';
import yts from 'yt-search';
import logger from '../../scripts/logger';

const queue: Command = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription("Gives info on the song currently playing and what's next"),
  execute: async (interaction) => {
    await interaction.reply({
      embeds: [
        new ZEmbed('info')
          .setDescription(`Fetching queue data...`)
          .setTitle('Loading...')
      ],
      ephemeral: true
    });

    const guild = interaction.guild as Guild;
    const queueData = (
      await db.collection('queues').doc(guild.id).get()
    ).data();

    if (!queueData || !queueData.currentlyPlaying) {
      return await interaction.followUp({
        embeds: [
          new ZEmbed('error').setDescription('No song is currently playing!')
        ]
      });
    }

    const nextSongsURLS = queueData.queue;
    const nextSongs: any[] = [];

    // Use for...of to iterate over values (URLs)
    for (let nextSongURL of nextSongsURLS) {
      const nextSong = (await yts.search(nextSongURL)).videos.find(
        (video) => video.url === nextSongURL
      );
      if (nextSong) {
        nextSongs.push(nextSong);
      } else {
        logger.error(`Song not found for URL: ${nextSongURL}`);
      }
    }

    const currentlyPlaying = (
      await yts.search(queueData.currentlyPlaying)
    ).videos.find((video) => video.url === queueData.currentlyPlaying);

    if (!currentlyPlaying) {
      return await interaction.followUp({
        embeds: [
          new ZEmbed('error').setDescription('No song is currently playing!')
        ]
      });
    }

    if (!nextSongs.length) {
      return await interaction.followUp({
        embeds: [
          new ZEmbed('info')
            .setDescription(
              `**${currentlyPlaying.title}** for **${currentlyPlaying.timestamp}**`
            )
            .setTitle('Currently Playing:')
        ]
      });
    }

    const embeds: ZEmbed[] = [
      new ZEmbed('info')
        .setDescription(
          `**${currentlyPlaying.title}** for **${currentlyPlaying.timestamp}**`
        )
        .setTitle('Currently Playing:')
    ];

    let i = 1;
    nextSongs.forEach((nextSong: any) => {
      if (!nextSong) return logger.error('Next song not found');

      const embed = new ZEmbed('info')
        .setTitle(`Song #${i} in queue`)
        .setDescription(
          `Upcoming song: **${nextSong.title}**\nDuration: ${nextSong.duration.timestamp}`
        )
        .setAuthor({
          name: nextSong.author.name,
          url: nextSong.author.url
        });

      if (nextSong.thumbnail) {
        embed.setThumbnail(nextSong.thumbnail);
      }

      embeds.push(embed);
      i++; // Increment song index
    });

    await interaction.followUp({ embeds });
  }
};

export default queue;
