import Command from '../../types/interfaces/Command';
import { GuildMember, SlashCommandBuilder } from 'discord.js';
import {
  AudioPlayer,
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  getVoiceConnection,
  VoiceConnection
} from '@discordjs/voice';
import db from '../../firebase/firebase';
import ZEmbed from '../../types/classes/ZEmbed';
import ytdl from '@distube/ytdl-core';
import logger from '../../scripts/logger';

export const skip: Command = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the currently playing song'),

  execute: async (interaction) => {
    if (!interaction.guild) return;
    const guild = interaction.guild;
    const member = interaction.member as GuildMember;

    const connection = getVoiceConnection(guild.id);
    if (!connection) {
      return await interaction.reply({
        embeds: [
          new ZEmbed('error').setDescription('No song is currently playing!')
        ]
      });
    }

    const player: AudioPlayer = Reflect.get(connection, 'player');
    const queueDoc = db.collection('queues').doc(guild.id);
    const queueData = (await queueDoc.get()).data();

    if (!queueData || !queueData.currentlyPlaying) {
      return await interaction.reply({
        embeds: [
          new ZEmbed('error').setDescription('No song is currently playing!')
        ]
      });
    }

    // Check if the user is the one who requested the song
    if (queueData.requesterID !== interaction.user.id) {
      return await interaction.reply({
        embeds: [
          new ZEmbed('error').setDescription('You cannot skip this song!')
        ]
      });
    }

    // Fetch the next song before modifying the queue
    const nextSong = queueData.queue[0];
    const requesterID = queueData.addedBy[0];

    // Remove the currently playing song from the queue
    queueData.queue.shift();
    queueData.addedBy.shift();
    await queueDoc.set(queueData, { merge: true });

    // Update currentlyPlaying to avoid confusion
    await queueDoc.update({ currentlyPlaying: null });

    // Stop the current song
    player.stop();

    await interaction.reply({
      embeds: [
        new ZEmbed('info')
          .setDescription('Skipped the currently playing song!')
          .setTitle('Song skipped!')
      ]
    });

    // Check if there's a next song and play it
    if (nextSong) {
      await play(nextSong, connection, guild.id, requesterID);
    } else {
      player.stop(); // Stop the player if there's no next song
    }

    // Ensure the idle listener is set up to handle future skips
    player.on(AudioPlayerStatus.Idle, async () => {
      const updatedQueueData = (await queueDoc.get()).data();
      const nextSong = updatedQueueData?.queue[0];
      const requesterID = updatedQueueData?.addedBy[0];

      if (nextSong) {
        await play(nextSong, connection, guild.id, requesterID);
      }
    });
  }
};

async function play(
  url: string,
  connection: VoiceConnection,
  guildID: string,
  requesterID: string
) {
  const stream = ytdl(url, {
    filter: 'audioonly',
    quality: 'highestaudio',
    highWaterMark: 1 << 25
  });

  stream.on('error', (error) => {
    logger.error('Error occurred while creating audio stream:', error);
    return;
  });

  const resource = createAudioResource(stream);
  const player: AudioPlayer =
    Reflect.get(connection, 'player') || createAudioPlayer();

  player.on(AudioPlayerStatus.Playing, () => {
    db.collection('queues').doc(guildID).update({
      currentlyPlaying: url,
      requesterID: requesterID,
      lastModified: new Date()
    });
  });

  player.on(AudioPlayerStatus.Idle, async () => {
    const queueData = (await db.collection('queues').doc(guildID).get()).data();
    if (!queueData) return;

    const nextSongUrl = queueData.queue[0];
    if (nextSongUrl) {
      queueData.queue.shift(); // Remove the current song from the queue
      queueData.addedBy.shift(); // Remove the requester ID
      await db.collection('queues').doc(guildID).set(queueData); // Update the queue in Firestore
      await play(nextSongUrl, queueData.addedBy[0], requesterID, guildID);
    } else {
      await db.collection('queues').doc(guildID).set(
        {
          currentlyPlaying: null,
          requesterID: null,
          lastModified: new Date()
        },
        { merge: true }
      );
    }
  });

  player.play(resource);
  connection.subscribe(player);
}

export default skip;
