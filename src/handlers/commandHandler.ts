import { readdirSync } from 'fs';
import path from 'path';
import ZClient from '../types/classes/ZClient';
import Command from '../types/interfaces/Command';
import {
  ChatInputCommandInteraction,
  Collection,
  GuildMember
} from 'discord.js';
import logger from '../scripts/logger';
import ZEmbed from '../types/classes/ZEmbed';

const DEVELOPER_ID = '1199768927811686410'; // Add your specific developer ID here

export async function handleCommand(interaction: ChatInputCommandInteraction) {
  const client = interaction.client as ZClient;
  const commandName = interaction.commandName;

  const command = client.commands.get(commandName);
  if (!command) {
    return interaction.reply({
      content: 'Command not found!',
      ephemeral: true
    });
  }

  // Developer-only check
  if (command.developerOnly && interaction.user.id !== DEVELOPER_ID) {
    return interaction.reply({
      embeds: [
        new ZEmbed('error')
          .setDescription('This command is restricted to the developer only.')
          .setTitle('Access Denied')
      ],
      ephemeral: true
    });
  }

  // Cooldown logic
  const now = Date.now();
  const cooldown = command.cooldown || 0;
  const timestamps = client.cooldowns.get(commandName) || new Collection();

  // Check if the user is the developer, if so, bypass cooldown
  if (interaction.user.id !== DEVELOPER_ID) {
    if (timestamps.has(interaction.user.id)) {
      const expirationTime = timestamps.get(interaction.user.id)! + cooldown;

      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        return interaction.reply({
          embeds: [
            new ZEmbed('info')
              .setDescription(
                `Please wait ${timeLeft.toFixed(
                  1
                )} more seconds before using the \`${commandName}\` command again.`
              )
              .setTitle('Command Failed')
          ],
          ephemeral: true
        });
      }
    }

    timestamps.set(interaction.user.id, now);
    client.cooldowns.set(commandName, timestamps);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldown);
  }

  // Permissions check
  if (command.permissions) {
    const member = interaction.member as GuildMember | null;

    if (!member) {
      return interaction.reply({
        content: 'This command cannot be used outside of a server.',
        ephemeral: true
      });
    }

    for (const perm of command.permissions) {
      if (perm.type === 'Role') {
        if (!member.roles.cache.has(perm.id)) {
          return interaction.reply({
            embeds: [
              new ZEmbed('error')
                .setDescription(
                  `You need the <@&${perm.id}> role to use this command.`
                )
                .setTitle('Permission Denied')
            ],
            ephemeral: true
          });
        }
      } else if (perm.type === 'Permission') {
        const memberPermissions = member.permissions;
        if (!memberPermissions.has(perm.id as any)) {
          return interaction.reply({
            embeds: [
              new ZEmbed('error')
                .setDescription(
                  `You do not have the required permissions to use this command.`
                )
                .setTitle('Permission Denied')
            ],
            ephemeral: true
          });
        }
      }
    }
  }

  // Execute command
  try {
    await command.execute(interaction);
  } catch (error) {
    logger.error('Error executing command:', error);
    interaction.reply({
      content: 'There was an error while executing this command.',
      ephemeral: true
    });
  }
}

const loadCommands = (client: ZClient) => {
  const foldersPath = path.join(__dirname, '../commands');
  const commandFolders = readdirSync(foldersPath);

  for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = readdirSync(commandsPath).filter((file) =>
      file.endsWith('.ts')
    );
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command: Command = require(filePath).default as Command;

      if (command && 'data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        logger.log('command', `${command.data.name} successfully loaded!`);
      } else {
        logger.warn(`Skipping invalid command file: ${file}`);
      }
    }
  }
};

export default loadCommands;
