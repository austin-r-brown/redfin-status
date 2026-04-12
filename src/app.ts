import axios from 'axios';
import packageInfo from '../package.json';
import { AXIOS_CONFIG, INTERVAL, REDFIN_URL } from './constants/constants';
import { DbService } from './services/db.service';
import { EmailService } from './services/email.service';
import { AxiosData, ListingInfo, RedfinData } from './constants/types';
import { extractInitialContext, getBodyHtml, getStatusEnum, log, parseRedfinData } from './constants/helpers';
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

  public async init() {
    await this.checkListingInfo();
    setInterval(() => this.checkListingInfo(), INTERVAL);
    log(`Successfully initialized for address: ${this.cachedListingInfo?.address}`);
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
      const { data: html }: AxiosData = await axios.get(this.url.href, AXIOS_CONFIG);
      const initialContext: string = extractInitialContext(html);
      const { addressSectionInfo }: RedfinData = parseRedfinData(initialContext);

      const status = addressSectionInfo.status.displayValue;

      if (status) listingInfo.status = getStatusEnum(status);
      else throwErrors.push('Status');

      if (!listingInfo.address) {
        const address = addressSectionInfo.streetAddress.assembledAddress;

        if (address) listingInfo.address = address;
        else throwErrors.push('Address');
      }

      if (throwErrors.length) throw new Error(`Unable to find the following: ${throwErrors.join(', ')}`);
    } catch (e: any) {
      log(`Error fetching Redfin listing info from ${this.url.href}: ${e?.message}`, ConsoleType.Error);
    }

    if (listingInfo.status) {
      log(); // General success indicator
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
  log(`Starting application v${packageInfo.version}`);
  const url = validateUrl();
  const app = new App(url);
  app.init();
};
