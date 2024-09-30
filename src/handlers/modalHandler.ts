import { readdirSync } from 'fs';
import path from 'path';
import Modal from '../types/interfaces/Modal';
import ZClient from '../types/classes/ZClient';
import logger from '../scripts/logger';

const loadModals = (client: ZClient, modalsPath: string) => {
  const files = readdirSync(modalsPath, { withFileTypes: true });

  for (const file of files) {
    const filePath = path.join(modalsPath, file.name);

    if (file.isDirectory()) {
      // Recursively load modals from the subdirectory
      loadModals(client, filePath);
    } else if (file.name.endsWith('.ts')) {
      // Load the modal file
      const modal: Modal = require(filePath).default;
      if (modal.customId) {
        client.modals.set(modal.customId, modal);
        logger.log('modal', `${modal.customId} successfully loaded!`);
      } else {
        logger.warn(
          `The modal at ${filePath} is missing a "customId" property.`
        );
      }
    }
  }
};

// Initial call with the base path for modals
const loadAllModals = (client: ZClient) => {
  const modalsPath = path.join(__dirname, '../modals'); // Base path for modals
  loadModals(client, modalsPath);
};

export { loadModals, loadAllModals };
