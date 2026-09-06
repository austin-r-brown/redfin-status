require('dotenv').config();

export const MS_IN_MINUTE: number = 60000;

/** Longest amount of time expected for API calls */
export const NETWORK_TIMEOUT: number = 10000;

/** Interval at which the app runs */
export const INTERVAL: number = Math.min(
  // Minimum and default of 5 minutes, maximum of 12 hours
  Math.max(Number(process.env.INTERVAL_MINS) || 5, 5) * MS_IN_MINUTE,
  720 * MS_IN_MINUTE,
);

export const REDFIN_URL: string = process.env.REDFIN_URL?.trim() || '';

export const SELECTORS = {
  mainSection: '.bp-Section--content div',
  openHouseSection: '.open-house-section',
  statusMain: '.ListingStatusBannerSection',
  statusRental: '.status-banner',
  address: '.street-address',
  price: '.statsValue.price',
  openHouseDate: '.oh-date',
  openHouseTime: '.oh-time',
} as const;

export const AXIOS_CONFIG = {
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    Connection: 'keep-alive',
  },
} as const;
