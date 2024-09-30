import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import Command from '../../types/interfaces/Command';
import axios from 'axios';
import ZEmbed from '../../types/classes/ZEmbed';

// Load environment variables
import dotenv from 'dotenv';
import db from '../../firebase/firebase';
dotenv.config();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY!;
const SEARCH_ENGINE_ID = process.env.SEARCH_ENGINE_ID!;
const MAX_USES_PER_DAY = 100; // Limit to 100 uses per day

const google: Command = {
  cooldown: 24 * 60 * 60 * 1000,
  data: new SlashCommandBuilder()
    .setName('google')
    .setDescription('Searches Google for your query.')
    .addStringOption((option) =>
      option
        .setName('query')
        .setDescription("The query you'd like to search for.")
        .setRequired(true)
    ),
  execute: async (interaction: ChatInputCommandInteraction) => {
    // First, check the usage limit
    const usageDocRef = db.collection('commandUsage').doc('googleCommand');

    const usageDoc = await usageDocRef.get();
    const currentDate = new Date().toLocaleDateString('en-US'); // Get today's date as a string

    let usageData: { count: number; date: string } = {
      count: 0,
      date: currentDate
    };

    if (usageDoc.exists) {
      usageData = usageDoc.data() as { count: number; date: string };

      // Reset count if it's a new day
      if (usageData.date !== currentDate) {
        usageData.count = 0;
        usageData.date = currentDate;
      }
    }

    // Check if usage has exceeded the limit
    if (usageData.count >= MAX_USES_PER_DAY) {
      return await interaction.reply({
        embeds: [
          new ZEmbed('error').setDescription(
            `The /google command has reached its limit of ${MAX_USES_PER_DAY} uses for today. Please try again tomorrow.`
          )
        ]
      });
    }

    // Increment usage count and update Firestore
    usageData.count += 1;
    await usageDocRef.set(usageData);

    // Reply with a "searching" embed
    await interaction.reply({
      embeds: [
        new ZEmbed('info')
          .setDescription("Hold on, I'm searching Google...")
          .setTitle('Searching...')
      ]
    });

    async function fetchGoogleResults(query: string) {
      const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(
        query
      )}&key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}`;

      const response = await axios.get(url);
      const items = response.data.items;

      if (!items || items.length === 0) {
        return null; // No results found
      }

      return items.map((item: any) => ({
        title: item.title,
        snippet: item.snippet,
        link: item.link
      }));
    }

    const query = interaction.options.getString('query', true);

    try {
      const results = await fetchGoogleResults(query);

      if (results && results.length > 0) {
        const embeds = results.slice(0, 3).map((result: any) => {
          return new ZEmbed('info')
            .setTitle(result.title)
            .setDescription(result.snippet)
            .setURL(result.link); // Adds the Google result link
        });

        // Edit the reply with the search results (limit to 3 results)
        await interaction.editReply({ embeds });
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

export default google;
