import { GatewayIntentBits, Partials } from 'discord.js';
import * as dotenv from 'dotenv';
import ZClient from './types/classes/ZClient';
import logger from './scripts/logger';

dotenv.config();

const bot = new ZClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

const init = async () => {
  if (!process.env.BOT_TOKEN) {
    logger.error('BOT_TOKEN is not defined in environment variables.');
    process.exit(1);
  }
  await bot.Init(process.env.BOT_TOKEN);
  return true;
};

export const ready = init();
export default bot;
