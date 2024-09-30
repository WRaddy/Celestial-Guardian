import { Message, PartialMessage } from 'discord.js';
import logger from '../scripts/logger';
import Event from '../types/interfaces/Event';
import db from '../firebase/firebase'; // Firestore initialization

// Firestore document path
const gameStateDoc = db.collection('countingGame').doc('gameState');

const countingChannelId = '1285389950543724605'; // Replace with your counting channel ID

const messageDelete: Event<'messageDelete'> = {
  name: 'messageDelete',
  once: false,
  execute: async (message: Message | PartialMessage) => {
    // Check if the message is in the correct counting channel
    if (message.channel.id !== countingChannelId) return;

    // Make sure the message is not from a bot
    if (message.author?.bot) return;

    // Ensure the message content is available
    if (!message.content) return;

    // Parse the message content to check if it's a valid number
    const parsedNumber = parseInt(message.content, 10);

    // Load the current game state from Firestore
    const doc = await gameStateDoc.get();
    if (!doc.exists) return; // Exit if the document doesn't exist

    const state = doc.data();
    const lastNumber = state?.lastNumber || 0;
    const lastUserId = state?.lastUserId || null;
    // Check if the deleted message was the last valid count
    if (parsedNumber === lastNumber && message.author?.id === lastUserId) {
      // Decrement the last number
      const newLastNumber = lastNumber - 1;

      // Update the Firestore document with the new last number
      await gameStateDoc.set({
        lastNumber: newLastNumber,
        lastUserId: null // Reset the last user ID since the last valid count is removed
      });
    }
  }
};

export default messageDelete;
