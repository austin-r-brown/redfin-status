import { ListingStatus } from './enums';

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

export const STATUS_TO_CSS_CLASS: Record<ListingStatus, string> = {
  [ListingStatus.ForSale]: 'status-for-sale',
  [ListingStatus.Pending]: 'status-pending',
  [ListingStatus.Sold]: 'status-sold',
  [ListingStatus.ForRent]: 'status-for-rent',
  [ListingStatus.ComingSoon]: 'status-coming-soon',
  [ListingStatus.Contingent]: 'status-contingent',
  [ListingStatus.OffMarket]: 'status-off-market',
};

export const STATUS_VALUE_MAP: Record<string, ListingStatus> = Object.fromEntries(
  Object.values(ListingStatus).map((value) => [value.toLowerCase(), value]),
);

export const SELECTORS = {
  mainSection: '.bp-Section--content div',
  openHouseSection: '.open-house-section',
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
    Cookie: 'aws-waf-token=a015dda6-cab5-47d3-9dcd-472951a25bcb:EwoA6BZtP2OCAwAA:48nPb6djlHQkMM8XB+ApcPSpKlLY8gQvNIr4RfuHIvnDl6gBREvT1yJfUhBNOPorBcY29250xdzW1GgXXZpMHk1kynnT4DXcCwGbGbx2VoXHxdPa5h1IDo/C7I7yq0R8QiMh6PllwidzlQlESX9L9kuEShuPoR6+q3WPGtZIUDFIVjA8u+sqbct7ATq/p9AmCBPJLAKUDKAZLd5QQfTZVcuQo3+Tw0nn7fqJ/I1plQ0vGyOZreOxHQxMIaBHDrACmMbFod/9h9AURV3WLClnZnChA6SC/sHT'
  },
} as const;
