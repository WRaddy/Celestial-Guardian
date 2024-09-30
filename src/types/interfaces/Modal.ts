import { ModalSubmitInteraction } from 'discord.js';
import ZClient from '../classes/ZClient';

export default interface Modal {
  customId: string;
  execute(interaction: ModalSubmitInteraction, client: ZClient): Promise<void>;
}
