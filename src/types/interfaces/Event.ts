import { ClientEvents } from 'discord.js';
import ZClient from '../classes/ZClient';

interface Event<K extends keyof ClientEvents> {
  name: K;
  once: boolean;
  // Adjust the return type to allow different Promise responses
  execute: (...args: [...ClientEvents[K], ZClient]) => void | Promise<any>;
}

export default Event;
