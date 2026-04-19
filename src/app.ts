import axios from 'axios';
import packageInfo from '../package.json';
import { AXIOS_CONFIG, INTERVAL, REDFIN_URL } from './constants/constants';
import { DbService } from './services/db.service';
import { EmailService } from './services/email.service';
import { AxiosData, ListingInfo, RedfinData } from './constants/types';
import {
  extractRedfinData as extractRedfinDataString,
  getStatusNotificationHtml,
  getStatusEnum,
  log,
  parseRedfinData,
  getOpenHouseNotificationHtml,
  getOpenHouseDate,
} from './constants/helpers';
import { ConsoleType, ListingStatus } from './constants/enums';

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

    log(`Successfully initialized for address: ${this.cachedListingInfo?.address}`);
  }

  private async checkListingInfo(): Promise<void> {
    const listingInfo = await this.fetchListingInfo();
    if (!listingInfo) return;
    let saveListingInfo = false;

    if (listingInfo.status !== this.cachedListingInfo?.status) {
      saveListingInfo = true;
      this.notifyStatusChange(listingInfo);
    }

    if (listingInfo.openHouseDate && listingInfo.openHouseDate !== this.cachedListingInfo?.openHouseDate) {
      saveListingInfo = true;
      this.notifyOpenHouseChange(listingInfo);
    }

    if (saveListingInfo) this.saveListingInfo(listingInfo);
  }

  private saveListingInfo(listingInfo: ListingInfo): void {
    this.db.save(listingInfo);
    this.cachedListingInfo = listingInfo;
  }

  private notifyStatusChange(listingInfo: ListingInfo): void {
    const subject = `New Listing Status: ${listingInfo.status}`;
    const body = getStatusNotificationHtml(listingInfo, this.url);

    log(subject);
    this.email.send(subject, [body]);
  }

  private notifyOpenHouseChange(listingInfo: ListingInfo): void {
    const subject = `New Open House: ${listingInfo.openHouseDate?.split('|')[0]}`;
    const body = getOpenHouseNotificationHtml(listingInfo, this.url);

    log(subject);
    this.email.send(subject, [body]);
  }

  private async fetchListingInfo(): Promise<ListingInfo> {
    let status: ListingStatus | undefined;
    let openHouseDate: string | undefined;
    let address: string | undefined = this.cachedListingInfo?.address;

    try {
      const { data: html }: AxiosData = await axios.get(this.url.href, AXIOS_CONFIG);
      const rawApiData: string = extractRedfinDataString(html);
      const { addressSectionInfo }: RedfinData = parseRedfinData(rawApiData);

      status = getStatusEnum(addressSectionInfo.status.displayValue);
      openHouseDate = getOpenHouseDate(html);

      if (!address) {
        const { streetAddress, city, state, zip } = addressSectionInfo;
        if (streetAddress.assembledAddress)
          address = `${streetAddress.assembledAddress}, ${city}, ${state} ${zip}`;
      }
    } catch (e: any) {
      log(`Error fetching Redfin listing info from ${this.url.href}: ${e?.message}`, ConsoleType.Error);
    }

    if (!status) log('Unable to find Status', ConsoleType.Error);
    if (!address) log('Unable to find Address', ConsoleType.Error);

    return {
      status: status || this.cachedListingInfo?.status,
      openHouseDate: openHouseDate || this.cachedListingInfo?.openHouseDate,
      address,
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
