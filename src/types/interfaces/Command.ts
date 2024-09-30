import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder
} from 'discord.js';

type Permissions = {
  type: 'Role' | 'Permission';
  id: string;
};

interface Command {
  permissions?: Permissions[];
  cooldown?: number;
  developerOnly?: boolean; // Add developerOnly option
  data:
    | SlashCommandBuilder
    | SlashCommandOptionsOnlyBuilder
    | SlashCommandSubcommandsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<any>;
}

export default Command;
