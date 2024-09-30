import { readdirSync } from 'fs';
import path from 'path';
import ZClient from '../types/classes/ZClient';
import Event from '../types/interfaces/Event';
import logger from '../scripts/logger';

const loadEvents = (client: ZClient) => {
  const eventsPath = path.join(__dirname, '../events');
  const eventFiles = readdirSync(eventsPath).filter((file) =>
    file.endsWith('.ts')
  );

  for (const file of eventFiles) {
    const event: Event<any> = require(path.join(eventsPath, file)).default;

    if (event.name) {
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client)); // Pass client
      } else {
        client.on(event.name, (...args) => event.execute(...args, client)); // Pass client
      }
      logger.log('event', `${event.name} successfully loaded!`);
    } else {
      logger.warn(`The event at ${file} is missing a "name" property.`);
    }
  }
};

export default loadEvents;
