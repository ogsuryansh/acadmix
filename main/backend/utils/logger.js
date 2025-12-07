const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

const COLORS = {
    ERROR: '\x1b[31m', // Red
    WARN: '\x1b[33m',  // Yellow
    INFO: '\x1b[36m',  // Cyan
    DEBUG: '\x1b[35m', // Magenta
    RESET: '\x1b[0m'
};

class Logger {
    constructor() {
        // Set log level based on environment
        const envLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'INFO' : 'DEBUG');
        this.level = LOG_LEVELS[envLevel] !== undefined ? LOG_LEVELS[envLevel] : LOG_LEVELS.INFO;
    }

    formatMessage(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
        return `[${timestamp}] [${level}] ${message} ${metaStr}`;
    }

    log(level, message, meta = {}) {
        const levelValue = LOG_LEVELS[level];

        if (levelValue <= this.level) {
            const color = COLORS[level] || COLORS.RESET;
            const formattedMessage = this.formatMessage(level, message, meta);
            console.log(`${color}${formattedMessage}${COLORS.RESET}`);
        }
    }

    error(message, meta = {}) {
        this.log('ERROR', message, meta);
    }

    warn(message, meta = {}) {
        this.log('WARN', message, meta);
    }

    info(message, meta = {}) {
        this.log('INFO', message, meta);
    }

    debug(message, meta = {}) {
        this.log('DEBUG', message, meta);
    }
}

// Singleton instance
const logger = new Logger();

module.exports = logger;
