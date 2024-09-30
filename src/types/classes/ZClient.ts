import { Client, ClientOptions, Collection } from 'discord.js';
import Command from '../interfaces/Command';
import loadCommands from '../../handlers/commandHandler';
import loadEvents from '../../handlers/eventHandler';
import { checkMutes } from '../../scripts/unmute';
import logger from '../../scripts/logger';
import Modal from '../interfaces/Modal';
import { loadAllModals } from '../../handlers/modalHandler';

export default class ZClient extends Client {
  public commands: Collection<string, Command>;
  public cooldowns: Collection<string, Collection<string, number>>;
  public modals: Collection<string, Modal>;
  constructor(options: ClientOptions) {
    super(options);
    this.commands = new Collection();
    this.cooldowns = new Collection();
    this.modals = new Collection();
  }

  public async Init(token: string) {
    await this.login(token).catch((error) => {
      logger.error('Client Login failed, error:', error);
      process.exit(1);
    });
    logger.log('bot', `Logged in as ${this.user?.tag}!`);

    loadCommands(this);
    loadEvents(this);
    loadAllModals(this);
    checkMutes(this);
  }
}
