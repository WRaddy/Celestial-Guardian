import { REST, RESTPostAPIApplicationCommandsResult, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import Command from '../types/interfaces/Command';
import * as dotenv from 'dotenv';
import logger from './logger';
dotenv.config();

const clientId = process.env.BOT_ID;
const guildId = process.env.GUILD_ID;
const token = process.env.BOT_TOKEN;

if (!clientId || !guildId || !token) {
  logger.error(
    'Please define BOT_ID, GUILD_ID, and BOT_TOKEN in your.env file.'
  );
  process.exit(1);
}

const commands: Array<object> = [];

const foldersPath = path.join(__dirname, '../commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith('.ts') || file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath).default as Command;

    if (command && 'data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
    } else {
      logger.warn(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    logger.info(
      `Started refreshing ${commands.length} application (/) commands.`
    );

    const data = (await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    )) as RESTPostAPIApplicationCommandsResult[];

    logger.data(
      `Successfully reloaded ${data.length} application (/) commands.`
    );
  } catch (error) {
    logger.error(error);
  }
})();
