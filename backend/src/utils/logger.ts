import winston from 'winston';
import 'winston-mongodb';
import config from '../config';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Standard console format
const consoleFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
  })
);

export const logger = winston.createLogger({
  level: config.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp(),
    errors({ stack: true }),
    json()
  ),
  defaultMeta: { service: 'healthcare-chatbot-api' },
  transports: [
    new winston.transports.Console({
      format: consoleFormat
    })
  ]
});

// Optionally add MongoDB transport if a valid URI is provided
if (process.env.MONGO_URI) {
  logger.add(
    new winston.transports.MongoDB({
      db: process.env.MONGO_URI,
      options: { useUnifiedTopology: true },
      collection: 'server_logs',
      level: 'warn', // Only log warnings and errors to DB
      format: combine(timestamp(), json())
    })
  );
}

export function log(msg: string, ...params: any[]) {
    if (process.env.NODE_ENV !== "test") {
      logger.info(msg, ...params);
    }
}

export default logger;