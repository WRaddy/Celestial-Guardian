import Modal from '../../types/interfaces/Modal';
import ZEmbed from '../../types/classes/ZEmbed';
import db from '../../firebase/firebase';
import Profile from '../../types/interfaces/Profile';

const profileCreate: Modal = {
  customId: 'createModal',
  execute: async (interaction, client) => {
    try {
      // Retrieve the values from the modal
      const profileName =
        interaction.fields.getTextInputValue('profileNameInput');
      const profileBio =
        interaction.fields.getTextInputValue('profileBioInput');

      // Create the profile data object
      const profileData: Profile = {
        username: profileName,
        bio: profileBio,
        points: 0,
        rank: 'Cosmic Newborn', // Default rank
        level: 1, // Default level
        createdAt: new Date() // Timestamp of creation
      };

      // Reply to the user with the profile data
      await interaction.reply({
        embeds: [
          new ZEmbed('info')
            .setDescription(`Name: **${profileName}**\nBio: **${profileBio}**`)
            .setTitle('Profile Created!')
        ],
        ephemeral: true // Keep the reply private
      });

      // Save the profile to Firestore
      await db.collection('profiles').doc(interaction.user.id).set(profileData);
    } catch (error) {
      console.error('Error creating profile:', error);
      await interaction.reply({
        content: 'There was an error while creating your profile!',
        ephemeral: true
      });
    }
  }
};

export default profileCreate;
