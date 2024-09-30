import bot from '../bot';
import { TextChannel } from 'discord.js';
import logger from './logger';
import ZEmbed from '../types/classes/ZEmbed';

const sendMessage = async () => {
  try {
    const rolesChannel = bot.channels.cache.find(
      (channel) => channel.id == '1285387668095500308'
    );
    if (
      !rolesChannel ||
      !rolesChannel.isTextBased() ||
      !rolesChannel.isSendable()
    ) {
      logger.warn('Roles channel not found!');
      return;
    }
    const selfRolesEmbed = new ZEmbed('info').setDescription(
      `**React to the according emoji to obtain a self role!** \n 
       🌸: <@&1287889083334656041>\n
       ✨: <@&1287889350339592302>\n
       ☄️: <@&1287889465356062751>\n
       🌌: <@&1287889468249866282>\n
       ☀️: <@&1287889471311839264>\n
       🌈: <@&1287889474004582431>\n
       🌑: <@&1287889477246652466>\n
       🌊: <@&1287889480551891018>\n
       💥: <@&1287889483491971072>\n
       🖤: <@&1287889486717521960>\n
       `
    );
    const message = await rolesChannel.send({ embeds: [selfRolesEmbed] });
    logger.info('Sent self roles message');
    await message.react('🌸');
    await message.react('✨');
    await message.react('☄️');
    await message.react('🌌');
    await message.react('☀️');
    await message.react('🌈');
    await message.react('🌑');
    await message.react('🌊');
    await message.react('💥');
    await message.react('🖤');
    logger.info('Reacted to self roles messages');
  } catch (error) {
    logger.error(`Failed to send self roles message: ${error}`);
  }
};

// Wait for the bot to initialize
(async () => {
  const isReady = await import('../bot').then(({ ready }) => ready);
  if (isReady) {
    await sendMessage();
  }
})();
