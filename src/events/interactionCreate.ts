import {
  ChatInputCommandInteraction,
  Events,
  Interaction,
  ModalSubmitInteraction
} from 'discord.js';
import { handleCommand } from '../handlers/commandHandler';
import Event from '../types/interfaces/Event';
import logger from '../scripts/logger';
import ZEmbed from '../types/classes/ZEmbed';
import db from '../firebase/firebase';
import Profile from '../types/interfaces/Profile';
import ZClient from '../types/classes/ZClient'; // Assuming you have a custom client class that includes modals

const interactionCreate: Event<'interactionCreate'> = {
  name: 'interactionCreate',
  once: false,
  execute: async (interaction: Interaction, client: ZClient) => {
    // Handle slash commands
    if (
      interaction.isCommand() &&
      interaction instanceof ChatInputCommandInteraction
    ) {
      try {
        await handleCommand(interaction);
      } catch (error) {
        logger.error('Error handling interaction:', error);
      }
    }

    // Handle modals
    if (interaction.isModalSubmit()) {
      const modalInteraction = interaction as ModalSubmitInteraction;
      const modal = client.modals.get(modalInteraction.customId); // Assuming modals are stored in client.modals

      if (!modal) {
        return modalInteraction.reply({
          content: 'This modal is not recognized!',
          ephemeral: true
        });
      }

      try {
        await modal.execute(modalInteraction, client);
      } catch (error) {
        logger.error('Error handling modal interaction:', error);
        await modalInteraction.reply({
          content: 'There was an error while processing the modal!',
          ephemeral: true
        });
      }
    }
  }
};

export default interactionCreate;
