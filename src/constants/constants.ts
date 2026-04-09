require('dotenv').config();

export const MS_IN_DAY: number = 86400000;
export const MS_IN_MINUTE: number = 60000;

export const LOCALE: string = 'en';

/** Longest amount of time expected for API calls */
export const NETWORK_TIMEOUT: number = 10000;

/** Interval at which the app runs */
export const INTERVAL: number = Math.min(
  // Default of 5 minutes, minimum of 30 seconds, maximum of 12 hours
  Math.max((Number(process.env.INTERVAL_MINS) || 5) * MS_IN_MINUTE, NETWORK_TIMEOUT * 3),
  720 * MS_IN_MINUTE,
);

/** Amount of time app is considered timed out after no activity */
export const REDFIN_URL: string = process.env.REDFIN_URL?.trim() || '';

export const AXIOS_CONFIG = {
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    Connection: 'keep-alive',
  },
};
