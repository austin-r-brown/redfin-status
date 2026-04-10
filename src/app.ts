import axios from 'axios';
import * as cheerio from 'cheerio';
import { AXIOS_CONFIG, INTERVAL, REDFIN_URL } from './constants/constants';
import { DbService } from './services/db.service';
import { EmailService } from './services/email.service';
import { ListingInfo } from './constants/types';
import { getBodyHtml, getStatusEnum, log } from './constants/helpers';
import { ConsoleType } from './constants/enums';

class App {
  private readonly db: DbService;
  private readonly email: EmailService;

  private cachedListingInfo: ListingInfo | null;

  constructor(private readonly url: URL) {
    this.db = new DbService(url.pathname);
    this.email = new EmailService();
    this.cachedListingInfo = this.db.load();
  }

  public init() {
    this.checkListingInfo();
    setInterval(() => this.checkListingInfo(), INTERVAL);
  }

  private async checkListingInfo(): Promise<void> {
    const listingInfo = await this.fetchListingInfo();
    if (!listingInfo) return;

    if (listingInfo.status !== this.cachedListingInfo?.status) {
      this.saveListingInfo(listingInfo);
      this.notifyListingChange(listingInfo);
    }
  }

  private saveListingInfo(listingInfo: ListingInfo): void {
    this.db.save(listingInfo);
    this.cachedListingInfo = listingInfo;
  }

  private notifyListingChange(listingInfo: ListingInfo): void {
    const subject = `New Redfin Status: ${listingInfo.status}`;
    const body = getBodyHtml(listingInfo, this.url);
    log(subject);
    this.email.send(subject, [body]);
  }

  private async fetchListingInfo(): Promise<ListingInfo> {
    const listingInfo = { ...this.cachedListingInfo } as ListingInfo;
    const throwErrors: string[] = [];

    try {
      const { data: html } = await axios.get(this.url.href, AXIOS_CONFIG);
      const $ = cheerio.load(html);

      const status = $('.ListingStatusBannerSection').text().trim();

      if (status) listingInfo.status = getStatusEnum(status);
      else throwErrors.push('Status');

      if (!listingInfo.address) {
        const address = $('.full-address').text().trim();

        if (address) listingInfo.address = address;
        else throwErrors.push('Address');
      }

      if (throwErrors.length) throw new Error(`Unable to find the following: ${throwErrors.join(', ')}`);
    } catch (e: any) {
      log(`Error fetching Redfin listing info from ${this.url.href}: ${e?.message}`, ConsoleType.Error);
    }

    if (listingInfo.status) {
      if (listingInfo.address && !this.cachedListingInfo?.address)
        log(`Successfully fetched address: ${listingInfo.address}`);
      else log(); // General success indicator
    }

    return listingInfo;
  }
}

const validateUrl = (): URL => {
  let validUrl: URL | undefined;
  try {
    const url = new URL(REDFIN_URL);
    if (url.host.split('.').includes('redfin')) {
      validUrl = url;
    }
  } catch {}

  if (!validUrl)
    throw new Error(`Valid Redfin URL must be provided in .env file as REDFIN_URL. 
      Provided URL: ${REDFIN_URL}`);

  return validUrl;
};

export const init = (): void => {
  const url = validateUrl();
  const app = new App(url);
  app.init();
};
