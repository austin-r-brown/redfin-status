import { ListingStatus } from './enums';

export type EmailConfig = {
  sender: { email: string };
  to: { email: string }[];
  subject?: string;
  htmlContent?: string;
  apiKey: string;
};

export type ListingInfo = {
  status: ListingStatus;
  price: number;
  address: string;
  openHouseDate?: string;
  hash: number;
};
