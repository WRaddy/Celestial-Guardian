import db from '../firebase/firebase';
import ZClient from '../types/classes/ZClient';
import { Timestamp } from 'firebase-admin/firestore'; // Import Timestamp
import logger from './logger';

export const checkMutes = async (client: ZClient) => {
  const now = Date.now();
  const muteCollection = db.collection('mutes');

  const snapshot = await muteCollection.get(); // Fetch all muted users

  const guildId = '1202132332442554418';
  const mutedRoleId = '1286059470748909738';

  if (snapshot.empty) {
    return;
  }

  snapshot.forEach(async (doc) => {
    const userId = doc.id;
    const muteData = doc.data();
    const { unmuteAt } = muteData;

    // Convert Firestore Timestamp to milliseconds for comparison
    const unmuteAtMs =
      unmuteAt instanceof Timestamp ? unmuteAt.toMillis() : unmuteAt;

    if (unmuteAtMs <= now) {
      const guild = client.guilds.cache.get(guildId);
      if (!guild) {
        logger.warn(`Guild ${guildId} not found.`);
        return;
      }
      const member = await guild.members.fetch(userId);
      try {
        if (!member) {
          logger.info(`Member ${userId} not found in guild.`);
          return;
        }

        // Unmute the member by removing the muted role
        await member.roles.remove(mutedRoleId);
        logger.info(`Successfully removed Muted role from user ${userId}`);

        // Delete the mute entry from the Firestore database
        await muteCollection.doc(userId).delete();
      } catch (error) {
        logger.error(`Failed to remove Muted role from user ${userId}:`, error);
      }
    }
  });

  logger.info('Checked and unmuted users where applicable.');
};
