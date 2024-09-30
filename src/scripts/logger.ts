import { createLogger, format, transports, addColors } from 'winston';

// Define custom log levels
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    data: 3,
    modal: 4,
    command: 5,
    event: 6,
    bot: 7 // Ensure bot level is the highest
  },
  colors: {
    error: 'red',
    warn: 'orange',
    info: 'gold',
    data: 'cyan',
    modal: 'purple',
    command: 'blue',
    event: 'green',
    bot: 'white' // Color for bot level
  }
};

// Custom color codes
const customColors: Record<string, string> = {
  error: '\x1b[38;2;255;51;53m',
  warn: '\x1b[38;2;255;140;0m',
  info: '\x1b[38;2;255;215;0m',
  data: '\x1b[38;2;0;220;255m',
  modal: '\x1b[38;2;128;0;128m',
  command: '\x1b[38;2;70;130;180m',
  event: '\x1b[38;2;60;179;113m',
  bot: '\x1b[38;2;255;255;255m' // Color for bot level
};

// Reset color
const resetColor = '\x1b[0m';

// Custom format for logging
const customFormat = format.combine(
  format.timestamp({ format: 'HH:mm:ss' }),
  format.printf(({ timestamp, level, message }) => {
    const color = customColors[level] || resetColor;
    return `${color}[${timestamp}] [${level.toUpperCase()}]: ${message}${resetColor}`;
  })
);

const logger = createLogger({
  levels: customLevels.levels,
  level: 'bot', // Set this to 'bot' to log all levels
  format: customFormat,
  transports: [
    new transports.Console({
      level: 'bot' // Log everything from 'bot' level and above
    }),
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log', level: 'info' })
  ]
});

// Set colors for log levels
addColors(customLevels.colors);

export default logger;
