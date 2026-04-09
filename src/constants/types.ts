import { ListingStatus } from './enums';

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

export type ListingInfo = {
  status: ListingStatus;
  address: string;
};
