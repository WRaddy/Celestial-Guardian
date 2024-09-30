import { GuildMember } from 'discord.js';
import Event from '../types/interfaces/Event';
import db from '../firebase/firebase';
import ms from 'ms';
import logger from '../scripts/logger';
const guildMemberAdd: Event<'guildMemberAdd'> = {
  name: 'guildMemberAdd',
  once: false,
  execute: async (member: GuildMember) => {
    // Add the "Guest" role
    const role = member.guild.roles.cache.find((r) => r.name == 'Guest');
    if (role) {
      member.roles.add(role);
    } else {
      logger.warn('[guildMemberAdd] Guest Role Not Found');
    }

    // Check if the user is muted in Firestore
    const mutedRef = db.collection('mutes').doc(member.id);
    const mutedDoc = await mutedRef.get();

    if (mutedDoc.exists) {
      const muteData = mutedDoc.data();
      const unmuteAt = muteData?.unmuteAt;

      // If current time is before unMuteAt, the user should still be muted
      if (unmuteAt && unmuteAt > ms(Date.now())) {
        const mutedRole = member.guild.roles.cache.find(
          (r) => r.name === 'Muted'
        );
        if (mutedRole) {
          await member.roles.add(mutedRole);
          logger.info(`[guildMemberAdd] Reapplied mute for ${member.user.tag}`);
        } else {
          logger.warn('[guildMemberAdd] Muted role not found');
        }
      }
    }
  }
};

export default guildMemberAdd;
