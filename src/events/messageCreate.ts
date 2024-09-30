import { TextChannel, Message } from 'discord.js';
import logger from '../scripts/logger';
import Event from '../types/interfaces/Event';
import db from '../firebase/firebase'; // Firestore initialization
import ZClient from '../types/classes/ZClient';
import { cp } from 'fs';

// Firestore document path
const gameStateDoc = db.collection('countingGame').doc('gameState');

let lastNumber = 0;
let lastUserId: string | null = null;

const countingChannelId = '1285389950543724605'; // Replace with your counting channel ID

// Function to load the game state from Firestore
async function loadGameState() {
  const doc = await gameStateDoc.get();
  if (doc.exists) {
    const state = doc.data();
    lastNumber = state?.lastNumber || 0;
    lastUserId = state?.lastUserId || null;
  } else {
    // Set initial state if the document doesn't exist
    await saveGameState();
  }
}

// Function to save the game state to Firestore
async function saveGameState() {
  await gameStateDoc.set({
    lastNumber,
    lastUserId
  });
}

// Load the game state when the bot starts
loadGameState();

const messageCreate: Event<'messageCreate'> = {
  name: 'messageCreate',
  once: false,
  execute: async (message, client: ZClient) => {
    const rolesDoc = await db
      .collection('selfRoles')
      .doc(message.channelId)
      .get();
    if (rolesDoc.exists && !message.author.bot) {
      const content = message.content;
      await message.delete().catch((err) => logger.error(err));
      const channel = message.channel;
      const newMessage = await channel.send(content);
      const emojis = rolesDoc.data()?.roleEmojis;
      for (let emoji of emojis) {
        await newMessage.react(emoji);
      }
    }
    if (message.channel.id === countingChannelId) {
      await loadGameState();
      if (message.author.bot) return;
      const parsedNumber = parseInt(message.content, 10);

      if (isNaN(parsedNumber) || parsedNumber !== lastNumber + 1) {
        return message.delete();
      }

      if (message.author.id === lastUserId) {
        return message.delete();
      }
      await loadGameState();
      lastNumber = parsedNumber;
      lastUserId = message.author.id;
      await saveGameState();
    }
  }
};

export default messageCreate;
