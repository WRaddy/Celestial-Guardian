import { SlashCommandBuilder } from 'discord.js';
import Command from '../../types/interfaces/Command';
import { exec } from 'child_process';
import path from 'path';
import { constants } from 'fs';
import { access } from 'fs/promises';
import ZEmbed from '../../types/classes/ZEmbed';

const run: Command = {
  data: new SlashCommandBuilder()
    .setName('run')
    .setDescription('Runs a specific script')
    .addStringOption((option) =>
      option
        .setName('script')
        .setDescription('The script to run')
        .setRequired(true)
    ),
  developerOnly: true,
  execute: async (interaction) => {
    const directory = path.join(__dirname, '../../scripts');
    const scriptName = interaction.options.getString('script', true);
    const filePath = path.join(directory, scriptName + '.ts');

    try {
      await access(filePath, constants.F_OK);

      await interaction.reply({
        embeds: [
          new ZEmbed('info')
            .setDescription('Please wait, Running the script...')
            .setTitle(`Executing Command: \`${scriptName}\``)
        ],
        ephemeral: true
      });

      exec(`npx ts-node "${filePath}"`, async (error, stdout, stderr) => {
        const formattedStdout = stdout.replace(/\x1B\[[0-9;]*m/g, ''); // Remove color codes
        const formattedStderr = stderr.replace(/\x1B\[[0-9;]*m/g, ''); // Remove color codes
        if (error) {
          return await interaction.editReply({
            embeds: [
              new ZEmbed('error')
                .setDescription(
                  `**Error**: ${error.message}\n**Stderr**: ${formattedStderr}`
                )
                .setTitle(`Executing Command: \`${scriptName}\``)
            ]
          });
        } else {
          return await interaction.editReply({
            embeds: [
              new ZEmbed('info')
                .setDescription(`**Stdout**: ${formattedStdout.trim()}`)
                .setTitle(`Executing Command: \`${scriptName}\``)
            ]
          });
        }
      });
    } catch {
      return await interaction.editReply({
        embeds: [
          new ZEmbed('error')
            .setDescription('Command not found')
            .setTitle(`Executing Command: \`${scriptName}\``)
        ]
      });
    }
  }
};
export default run;
