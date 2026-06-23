import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const customLogFormat = printf(({ level, message, timestamp, stack, context }) => {
  const contextString = context ? ` [${context}]` : '';
  const logMessage = stack ? `${message}\nStack: ${stack}` : message;
  return `${timestamp} [${level}]${contextString}: ${logMessage}`;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    customLogFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        customLogFormat
      )
    })
  ]
});

export function createScopedLogger(moduleName) {
  return {
    info: (msg, meta) => logger.info(msg, { context: moduleName, ...meta }),
    warn: (msg, meta) => logger.warn(msg, { context: moduleName, ...meta }),
    error: (msg, err) => logger.error(msg, { context: moduleName, stack: err?.stack, ...err })
  };
}