import db from '../firebase/firebase';
import logger from '../scripts/logger';
import Event from '../types/interfaces/Event';

const messageReactionRemove: Event<'messageReactionRemove'> = {
  name: 'messageReactionRemove',
  once: false,
  execute: async (reaction, user) => {
    if (!reaction.message.guild) return;
    if (user.bot) return;
    const rolesDoc = db.collection('selfRoles').doc(reaction.message.channelId);
    if (!rolesDoc) return;

    const data = (await rolesDoc.get()).data();

    if (!data) return;
    const emojis = data.roleEmojis;
    const rolesIds = data.roleIds;

    // Function to remove variation selectors
    const removeVariationSelector = (emoji: string) =>
      emoji.replace(/\uFE0F/g, '');

    const emoji = removeVariationSelector(reaction.emoji.toString());
    if (emojis.includes(emoji)) {
      const role = reaction.message.guild.roles.cache.find(
        (r) => r.id === rolesIds[emojis.indexOf(emoji)]
      );
      if (!role) return;
      await reaction.message.guild.members.cache
        .get(user.id)
        ?.roles.remove(role);
      logger.info(
        `Removed role "${role.name}" from ${user.username} (${user.id})`
      );
    }
  }
};

export default messageReactionRemove;
