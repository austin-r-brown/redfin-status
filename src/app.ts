import axios from 'axios';
import packageInfo from '../package.json';
import { AXIOS_CONFIG, INTERVAL, REDFIN_URL, SELECTORS } from './constants/constants';
import { DbService } from './services/db.service';
import { EmailService } from './services/email.service';
import { AxiosData, ListingInfo } from './constants/types';
import {
  getStatusNotificationHtml,
  getStatus,
  log,
  getOpenHouseNotificationHtml,
  getOpenHouseDate,
  getPriceNotificationHtml,
  getAbbreviatedPrice,
  getAddress,
  getPrice,
  getContentHash,
} from './constants/helpers';
import { ConsoleType, ListingStatus } from './constants/enums';
import * as cheerio from 'cheerio';

class App {
  private readonly db: DbService;
  private readonly email: EmailService;

  private cachedListingInfo: ListingInfo | null;

  constructor(private readonly url: URL) {
    this.db = new DbService(url.pathname);
    this.email = new EmailService();
    this.cachedListingInfo = this.db.load();
  }

  public async init() {
    await this.checkListingInfo();

    setInterval(() => {
      this.checkListingInfo();
      log(); // Heartbeat
    }, INTERVAL);

    if (this.cachedListingInfo?.address) {
      log(`Successfully initialized for address: ${this.cachedListingInfo.address}`);
    }
  }

  private async checkListingInfo(): Promise<void> {
    const listingInfo = await this.fetchListingInfo();
    if (!listingInfo) return;

    if (this.cachedListingInfo) {
      // Only notify when there's been a change to previously saved data
      if (listingInfo.status !== this.cachedListingInfo.status) {
        this.notifyStatusChange(listingInfo);
      }

      if (listingInfo.price !== this.cachedListingInfo.price) {
        this.notifyPriceChange(listingInfo, this.cachedListingInfo.price);
      }

      if (listingInfo.openHouseDate !== this.cachedListingInfo.openHouseDate) {
        this.notifyOpenHouseChange(listingInfo);
      }
    }

    this.saveListingInfo(listingInfo);
  }

  private saveListingInfo(listingInfo: ListingInfo): void {
    this.db.save(listingInfo);
    this.cachedListingInfo = listingInfo;
  }

  private notifyStatusChange(listingInfo: ListingInfo): void {
    const subject = `New Listing Status: ${listingInfo.status}`;
    const body = getStatusNotificationHtml(listingInfo);

    log(subject);
    this.email.send(subject, [body]);
  }

  private notifyPriceChange(listingInfo: ListingInfo, oldPrice: number): void {
    const subject = `New Listing Price: ${getAbbreviatedPrice(oldPrice)} → ${getAbbreviatedPrice(listingInfo.price)}`;
    const body = getPriceNotificationHtml(listingInfo, oldPrice);

    log(subject);
    this.email.send(subject, [body]);
  }

  private notifyOpenHouseChange(listingInfo: ListingInfo): void {
    const subject = listingInfo.openHouseDate
      ? `New Open House: ${listingInfo.openHouseDate.split('|')[0]}`
      : 'Open House Cancelled';
    const body = getOpenHouseNotificationHtml(listingInfo);

    log(subject);
    this.email.send(subject, [body]);
  }

  private async fetchListingInfo(): Promise<ListingInfo> {
    let status: ListingStatus | undefined;
    let price: number | undefined;
    let openHouseDate: string | undefined;
    let address: string | undefined = this.cachedListingInfo?.address;
    let hash: number | undefined;

    try {
      const { data: html, status: responseCode }: AxiosData = await axios.get(this.url.href, AXIOS_CONFIG);
      if (responseCode !== 200) throw new Error(`Redfin API responded with code ${responseCode}`);

      const $ = cheerio.load(html);
      const [mainSection, openHouseSection] = [SELECTORS.mainSection, SELECTORS.openHouseSection].map(
        (selector) => $(selector).first(),
      );
      hash = getContentHash([mainSection, openHouseSection]);

      if (hash === this.cachedListingInfo?.hash) {
        return this.cachedListingInfo;
      }

      if (mainSection) {
        status = getStatus(mainSection);
        // Ignore price changes if the listing is Off Market
        price = status !== ListingStatus.OffMarket ? getPrice(mainSection) : this.cachedListingInfo?.price;
        if (!address) address = getAddress(mainSection);
      }

      if (openHouseSection) {
        openHouseDate = getOpenHouseDate(openHouseSection);
      }
    } catch (e: any) {
      log(`Error fetching Redfin listing info from ${this.url.href}: ${e?.message}`, ConsoleType.Error);
    }

    if (!status) log('Unable to find Status', ConsoleType.Error);
    if (!price) log('Unable to find Price', ConsoleType.Error);
    if (!address) log('Unable to find Address', ConsoleType.Error);

    return {
      status: status || this.cachedListingInfo?.status,
      price: price || this.cachedListingInfo?.price,
      openHouseDate: openHouseDate || this.cachedListingInfo?.openHouseDate,
      address,
      hash,
      link: this.url.href,
    } as ListingInfo;
  }
}

export const init = (): void => {
  log(`Starting application v${packageInfo.version}`);

  let validUrl: URL | undefined;

  try {
    const url = new URL(REDFIN_URL);
    if (url.host.split('.').includes('redfin')) validUrl = url;
  } catch {}

  if (!validUrl)
    throw new Error(`Valid Redfin URL must be provided in .env file as REDFIN_URL. 
      Provided URL: ${REDFIN_URL}`);

  const app = new App(validUrl);

  app.init();
};
