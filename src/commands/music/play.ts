import Command from '../../types/interfaces/Command';
import {
  ChatInputCommandInteraction,
  Guild,
  GuildMember,
  MessageReaction,
  SlashCommandBuilder,
  User
} from 'discord.js';
import {
  joinVoiceChannel,
  getVoiceConnection,
  createAudioPlayer,
  createAudioResource,
  DiscordGatewayAdapterCreator,
  AudioPlayerStatus,
  AudioPlayer,
  VoiceConnection
} from '@discordjs/voice';
import ytdl from '@distube/ytdl-core';
import yts, { VideoSearchResult } from 'yt-search';
import ZEmbed from '../../types/classes/ZEmbed';
import logger from '../../scripts/logger';
import { millify } from 'millify';
import db from '../../firebase/firebase';

export const play: Command = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song from YouTube')
    .addStringOption((option) =>
      option
        .setName('query')
        .setDescription('The song to play')
        .setRequired(true)
    ),

  execute: async (interaction) => {
    if (!interaction.guild) return;
    if (!interaction.member) return;
    const guild = interaction.guild;
    const member = interaction.member as GuildMember;

    const voiceChannel = member.voice.channel;
    if (!voiceChannel || voiceChannel.id !== '1290395394508849162') {
      return await interaction.reply({
        embeds: [
          new ZEmbed('error').setDescription(
            'You are not connected to the music channel!'
          )
        ]
      });
    }

    let connection = getVoiceConnection(interaction.guild.id);
    if (!connection) {
      connection = await joinVoiceChannel({
        selfDeaf: false,
        channelId: voiceChannel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild
          .voiceAdapterCreator as DiscordGatewayAdapterCreator
      });
    }

    const query = interaction.options.getString('query');
    if (!query) {
      return await interaction.reply({
        embeds: [
          new ZEmbed('error').setDescription(
            'Please provide a correct query to search for'
          )
        ]
      });
    }

    await interaction.reply({
      embeds: [
        new ZEmbed('info')
          .setDescription(`Searching for ${query}, Please be patient..`)
          .setTitle('Searching...')
      ],
      ephemeral: true
    });

    const results = await yts.search(query);
    const videos = results.videos.slice(0, 3);
    const embeds: ZEmbed[] = [];
    for (const video of videos) {
      const embed = new ZEmbed('info')
        .setTitle(video.title)
        .setURL(video.url)
        .setDescription(`${video.description.substring(0, 200)}...`)
        .setAuthor(video.author)
        .setFooter({
          text: `Suggested by ${interaction.user.username} | Views: ${millify(
            video.views
          )}`
        });
      if (video.thumbnail) {
        embed.setThumbnail(video.thumbnail);
      }
      embeds.push(embed);
    }

    const message = await interaction.followUp({ embeds: embeds });

    const emojis = {
      purple_1: '1289704857120538757',
      purple_2: '1289705015941926923',
      purple_3: '1289704859863617580'
    };

    for (const [emojiName, emojiId] of Object.entries(emojis)) {
      const emoji = `<:${emojiName}:${emojiId}>`;
      try {
        await message.react(emoji);
      } catch (error) {
        logger.error(`Failed to react with ${emojiName}:`, error);
      }
    }

    const emojiIds = Object.values(emojis);
    const filter = (reaction: MessageReaction, user: User) => {
      if (!reaction.emoji.id) return false;
      return emojiIds.includes(reaction.emoji.id) && !user.bot;
    };

    const collector = message.createReactionCollector({
      filter,
      time: 30 * 1000
    });

    let isReacted = false;
    collector.on('collect', async (reaction, user) => {
      const selectedVideoIndex = Object.values(emojis).indexOf(
        reaction.emoji.id as string
      );
      const video = videos[selectedVideoIndex];
      if (video.duration.seconds > 300) {
        await message.edit({
          embeds: [
            new ZEmbed('error').setDescription(
              'The selected video exceeds the maximum allowed duration of 5 minutes, please try again with a different one'
            )
          ]
        });
        await message.reactions.removeAll();
        return;
      }
      if (selectedVideoIndex !== -1) {
        const player: AudioPlayer = Reflect.get(connection, 'player');
        if (
          player &&
          (player.state.status == AudioPlayerStatus.Playing ||
            player.state.status == AudioPlayerStatus.Paused)
        ) {
          const queuesDoc = db.collection('queues').doc(guild.id);
          const queuesData = (await queuesDoc.get()).data();
          if (!queuesData) return;
          let { queue, addedBy } = queuesData;
          if (queue.length >= 5) {
            await message.edit({
              embeds: [
                new ZEmbed('error').setDescription(
                  'The queue is already full, please try again later'
                )
              ]
            });
            return;
          }
          queue.push(video.url);
          addedBy.push(user.id);
          await queuesDoc.set(
            {
              queue,
              addedBy
            },
            {
              merge: true
            }
          );
          await message.edit({
            embeds: [
              new ZEmbed('info')
                .setDescription(
                  `Added **${video.title}** to the queue, requested by ${user.username}`
                )
                .setTitle('Added to Queue...')
                .setAuthor({
                  name: video.author.name,
                  url: video.author.url
                })
                .setFooter({
                  text: `Views: ${millify(video.views)}`
                })
            ]
          });
          await message.reactions.removeAll();
          isReacted = true;
          return;
        }

        isReacted = true;
        collector.stop();

        await playSong(video.url, user.id, connection, guild, interaction);
        await message.edit({
          embeds: [
            new ZEmbed('info')
              .setDescription(
                `Playing **${video.title}..** for **${video.duration.timestamp}**`
              )
              .setTitle('Now Playing...')
              .setAuthor({
                name: video.author.name,
                url: video.author.url
              })
              .setFooter({
                text: `Requested by ${user.displayName} | Views: ${millify(
                  video.views
                )}`
              })
          ]
        });
      }
    });

    collector.on('end', async (collected) => {
      if (isReacted) {
        await message.reactions.removeAll(); // Remove all reactions
        return;
      }
      await message.edit({
        embeds: [
          new ZEmbed('error').setDescription(
            'You have failed to react within the time period, please try again'
          )
        ]
      });
      await message.reactions.removeAll(); // Remove all reactions on timeout
    });
  }
};
export const playSong = async function (
  url: string,
  requesterID: string,
  connection: VoiceConnection,
  guild: Guild,
  interaction: ChatInputCommandInteraction
) {
  if (!connection) {
    logger.error('No voice connection found');
    return;
  }

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
  const player = Reflect.get(connection, 'player') || createAudioPlayer();

  player.on(AudioPlayerStatus.Playing, () => {
    db.collection('queues').doc(guild.id).set(
      {
        currentlyPlaying: url,
        requesterID: requesterID,
        lastModified: new Date(),
        queue: [],
        addedBy: []
      },
      {
        merge: true
      }
    );
  });

  player.on(AudioPlayerStatus.Idle, async () => {
    const queueData = (
      await db.collection('queues').doc(guild.id).get()
    ).data();
    if (!queueData) return;

    const nextSongUrl = queueData.queue[0];
    if (nextSongUrl) {
      queueData.queue.shift(); // Remove the current song from the queue
      queueData.addedBy.shift(); // Remove the requester ID
      await db.collection('queues').doc(guild.id).set(queueData); // Update the queue in Firestore

      await playSong(
        nextSongUrl,
        queueData.addedBy[0],
        connection,
        guild,
        interaction
      );
    } else {
      await db.collection('queues').doc(guild.id).set(
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

  // Store the player in the connection object for future use (like pause/resume)
  Reflect.set(connection, 'player', player);
};
export default play;
