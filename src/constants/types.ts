export type Time = [number, number?, number?];

export type EmailConfig = {
  sender: { email: string };
  to: { email: string }[];
  subject?: string;
  htmlContent?: string;
  apiKey: string;
};

export type BackupFile = {
  path: string;
  createdAt: Date;
};

export enum ListingStatus {
  ForSale = 'For Sale',
  Pending = 'Pending',
  Sold = 'Sold',
  OffMarket = 'Off Market',
  PriceDrop = 'Price Drop',
  BackOnMarket = 'Back On Market',
  Contingent = 'Contingent',
}

export type ListingInfo = {
  status: ListingStatus;
  address: string;
};
