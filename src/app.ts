import packageInfo from '../package.json';
import { INTERVAL, REDFIN_URL } from './constants/constants';
import { DbService } from './services/db.service';
import { EmailService } from './services/email.service';
import { log } from './constants/helpers';
import { RedfinService } from './services/redfin.service';

class App {
  private readonly db: DbService;
  private readonly email: EmailService;
  private readonly redfin: RedfinService;

  constructor(private readonly url: URL) {
    this.db = new DbService(this.url.pathname);
    this.email = new EmailService(this.url.href);
    this.redfin = new RedfinService(this.url.href, this.db);
  }

  public async init() {
    await this.checkListingInfo();

    setInterval(() => {
      this.checkListingInfo();
      log(); // Heartbeat
    }, INTERVAL);

    if (this.db.listingInfo?.address) {
      log(`Successfully initialized for address: ${this.db.listingInfo.address}`);
    }
  }

  private async checkListingInfo(): Promise<void> {
    const listingInfo = await this.redfin.fetchListingInfo();
    if (!listingInfo) return;

    if (this.db.listingInfo) {
      // Only notify when there's been a change to previously saved data
      if (listingInfo.status !== this.db.listingInfo.status) {
        this.email.notifyStatusChange(listingInfo);
      }

      if (listingInfo.price !== this.db.listingInfo.price) {
        this.email.notifyPriceChange(listingInfo, this.db.listingInfo.price);
      }

      if (listingInfo.openHouseDate !== this.db.listingInfo.openHouseDate) {
        this.email.notifyOpenHouseChange(listingInfo);
      }
    }

    this.db.save(listingInfo);
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
