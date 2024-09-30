import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import Command from '../../types/interfaces/Command';
import ZClient from '../../types/classes/ZClient';
import path from 'path';
import fs from 'fs';
import logger from '../../scripts/logger';
import ZEmbed from '../../types/classes/ZEmbed';

const reload: Command = {
  data: new SlashCommandBuilder()
    .setName('reload')
    .setDescription('Reloads a command or all commands.')
    .addStringOption((option) =>
      option
        .setName('command')
        .setDescription(
          'The command to reload, or type "all" to reload all commands.'
        )
        .setRequired(true)
    ),
  cooldown: 30 * 1000,
  developerOnly: true,

  async execute(interaction: ChatInputCommandInteraction) {
    const commandName = interaction.options
      .getString('command', true)
      .toLowerCase();
    const client = interaction.client as ZClient;

    if (commandName === 'all') {
      await interaction.reply({
        embeds: [new ZEmbed('info').setDescription('Reloading all commands...')]
      });

      const commandsPath = path.join(__dirname, '../../commands');
      const commandFiles = fs.readdirSync(commandsPath, {
        withFileTypes: true
      });

      try {
        for (const dirent of commandFiles) {
          if (dirent.isDirectory()) {
            const subDir = path.join(commandsPath, dirent.name);
            const subCommandFiles = fs
              .readdirSync(subDir)
              .filter((file) => file.endsWith('.ts'));
            for (const file of subCommandFiles) {
              const commandFilePath = path.join(subDir, file);
              delete require.cache[require.resolve(commandFilePath)];
              const newCommand: Command = require(commandFilePath).default;
              client.commands.set(newCommand.data.name, newCommand);
            }
          }
        }

        await interaction.editReply({
          embeds: [
            new ZEmbed('success').setDescription(
              'All commands have been reloaded!'
            )
          ]
        });
      } catch (error) {
        logger.error(error);
        await interaction.editReply({
          embeds: [
            new ZEmbed('error').setDescription(
              'There was an error while reloading all commands.'
            )
          ]
        });
      }
    } else {
      // Logic for reloading a specific command
      const commandsPath = path.join(__dirname, '../../commands');
      const commandFilePath = findCommandFile(commandsPath, commandName);

      if (!commandFilePath) {
        return await interaction.reply({
          embeds: [
            new ZEmbed('error').setDescription(
              `Command file \`${commandName}.ts\` does not exist!`
            )
          ],
          ephemeral: true
        });
      }

      await interaction.reply({
        embeds: [
          new ZEmbed('info')
            .setDescription('Reloading...')
            .setTitle(`Reloading Command: \`${commandName}\``)
        ]
      });

      try {
        // Clear the cache
        delete require.cache[require.resolve(commandFilePath)];

        // Require the command file again
        const newCommand: Command = require(commandFilePath).default;

        // Set the new command in the collection
        client.commands.set(newCommand.data.name, newCommand);

        await interaction.editReply({
          embeds: [
            new ZEmbed('success').setDescription(
              `Command \`${newCommand.data.name}\` was reloaded!`
            )
          ]
        });
      } catch (error) {
        logger.error(error);
        await interaction.editReply({
          embeds: [
            new ZEmbed('error').setDescription(
              'There was an error while reloading the command.'
            )
          ]
        });
      }
    }
  }
};

// Helper function to recursively find the command file
const findCommandFile = (dir: string, name: string): string | null => {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const filePath = path.join(dir, file.name);
    if (file.isDirectory()) {
      const found = findCommandFile(filePath, name);
      if (found) return found;
    } else if (file.name.toLowerCase() === `${name}.ts`) {
      return filePath;
    }
  }
  return null;
};

export default reload;
