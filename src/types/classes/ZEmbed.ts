import { EmbedBuilder, EmbedData } from 'discord.js';

type ZEmbedTheme = 'error' | 'success' | 'info';

class ZEmbed extends EmbedBuilder {
  constructor(theme: ZEmbedTheme, data?: EmbedData) {
    super(data);
    if (theme == 'error') {
      this.setColor('Blurple');
      this.setThumbnail('https://i.imgur.com/FDCL7MO.png');
      this.setFooter({
        text: 'Celestial Horizon',
        iconURL: 'https://i.imgur.com/axm5NWZ.png'
      });
      this.setTitle('Command Failed');
      this.setTimestamp();
    }
    if (theme == 'success') {
      this.setColor('Blurple');
      this.setThumbnail('https://i.imgur.com/FDCL7MO.png');
      this.setFooter({
        text: 'Celestial Horizon',
        iconURL: 'https://i.imgur.com/axm5NWZ.png'
      });
      this.setTimestamp();
      this.setTitle('Command Succeeded');
    }
    if (theme == 'info') {
      this.setColor('Blurple');
      this.setThumbnail('https://i.imgur.com/FDCL7MO.png');
      this.setFooter({
        text: 'Celestial Horizon',
        iconURL: 'https://i.imgur.com/axm5NWZ.png'
      });
      this.setTimestamp();
    }
  }
}

export default ZEmbed;
