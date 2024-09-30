import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import Command from '../../types/interfaces/Command';
import axios from 'axios';
import ZEmbed from '../../types/classes/ZEmbed';

const wikipedia: Command = {
  data: new SlashCommandBuilder()
    .setName('wikipedia')
    .setDescription('Searches Wikipedia.')
    .addStringOption((option) =>
      option
        .setName('query')
        .setDescription("The query you'd like to search for.")
        .setRequired(true)
    ),
  execute: async (interaction: ChatInputCommandInteraction) => {
    await interaction.reply({
      embeds: [
        new ZEmbed('info')
          .setDescription("Hold on, I'm searching...")
          .setTitle('Hold on...')
      ]
    });

    async function fetchWikipediaSummary(query: string) {
      // Use 'generator=search' to find the closest match instead of exact title
      const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=&explaintext=&generator=search&gsrsearch=${encodeURIComponent(
        query
      )}&gsrlimit=1`; // Get the most relevant result

      const response = await axios.get(url);
      const pages = response.data.query?.pages;

      if (!pages) {
        return null; // No results found
      }

      const pageId = Object.keys(pages)[0];
      const page = pages[pageId];

      return {
        title: page.title,
        extract: page.extract,
        pageUrl: `https://en.wikipedia.org/?curid=${page.pageid}`
      };
    }

    const query = interaction.options.getString('query', true);

    try {
      const result = await fetchWikipediaSummary(query);

      if (result) {
        // Edit the reply with the summary and provide a link to the Wikipedia page
        await interaction.editReply({
          embeds: [
            new ZEmbed('info')
              .setTitle(result.title)
              .setDescription(result.extract)
              .setURL(result.pageUrl) // Adds the Wikipedia page link to the title
          ]
        });
      } else {
        // No results found
        await interaction.editReply({
          embeds: [
            new ZEmbed('error').setDescription(
              `No results found for "${query}". Please try a different query.`
            )
          ]
        });
      }
    } catch (error: any) {
      await interaction.editReply({
        embeds: [new ZEmbed('error').setDescription(`Error: ${error.message}`)]
      });
    }
  }
};

export default wikipedia;
