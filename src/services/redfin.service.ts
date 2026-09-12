import { Cheerio, load } from 'cheerio';
import axios from 'axios';
import { log } from 'console';
import { STATUS_VALUE_MAP, SELECTORS, AXIOS_CONFIG } from '../constants/constants';
import { ListingStatus, ConsoleType } from '../constants/enums';
import { ListingInfo } from '../constants/types';
import { DbService } from './db.service';

/** Service for fetching and parsing real estate listing data from Redfin */
export class RedfinService {
  private address: string | undefined = this.db.listingInfo?.address;
  /** Used for initial comparison between API responses */
  private hash: number | undefined = this.db.listingInfo?.hash;

  constructor(
    private readonly link: string,
    private readonly db: DbService,
  ) {}

  public async fetchListingInfo(): Promise<ListingInfo | null> {
    let status: ListingStatus | undefined;
    let price: number | undefined;
    let openHouseDate: string | undefined;

    try {
      const { data: html, status: responseCode } = await axios.get(this.link, AXIOS_CONFIG);
      if (responseCode !== 200) throw new Error(`Redfin API responded with code ${responseCode}`);

      const $ = load(html);
      const [mainSection, openHouseSection] = [SELECTORS.mainSection, SELECTORS.openHouseSection].map(
        (selector) => $(selector).first(),
      );

      if (this.isContentUnchanged([mainSection, openHouseSection])) {
        return null;
      }

      if (mainSection) {
        status = this.getStatus(mainSection);
        // Price shown for Off Market listings is Redfin Estimate - not a sale price
        price = status !== ListingStatus.OffMarket ? this.getPrice(mainSection) : this.db.listingInfo?.price;
        if (!this.address) this.address = this.getAddress(mainSection);
      }

      if (openHouseSection) {
        openHouseDate = this.getOpenHouseDate(openHouseSection);
      }
    } catch (e: any) {
      log(`Error fetching Redfin listing info from ${this.link}: ${e?.message}`, ConsoleType.Error);
      return null;
    }

    if (!status) log('Unable to find Status', ConsoleType.Error);
    if (!price) log('Unable to find Price', ConsoleType.Error);
    if (!this.address) log('Unable to find Address', ConsoleType.Error);

    return {
      status: status || this.db.listingInfo?.status,
      price: price || this.db.listingInfo?.price,
      openHouseDate,
      address: this.address,
      hash: this.hash,
    } as ListingInfo;
  }

  private isContentUnchanged(sections: Cheerio<any>[]): boolean {
    const content = sections
      .map((s) => s?.text()?.trim())
      .filter(Boolean)
      .join('');

    let hash = 0x811c9dc5;

    for (let i = 0; i < content.length; i++) {
      hash ^= content.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }

    const newHash = hash >>> 0;

    if (newHash === this.hash) {
      return true;
    } else {
      this.hash = newHash;
      return false;
    }
  }

  private getStatus(section: Cheerio<any>): ListingStatus | undefined {
    const text = section.text();
    const statusEnd = text.indexOf('$');
    const input = statusEnd !== -1 ? text.slice(0, statusEnd) : text;

    let candidate = '';

    for (const word of input.trim().split(/\s+/)) {
      candidate += candidate ? ` ${word.toLowerCase()}` : word.toLowerCase();
      const match = STATUS_VALUE_MAP[candidate];

      if (match) {
        return match;
      }
    }

    log(`Invalid Status Found: ${candidate}`, ConsoleType.Error);
    return candidate as ListingStatus;
  }

  private getAddress(section: Cheerio<any>): string | undefined {
    const address = section.find(SELECTORS.address)?.text()?.trim();

    if (address) return address;
  }

  private getPrice(section: Cheerio<any>): number | undefined {
    const priceText = section.find(SELECTORS.price)?.text()?.trim();
    const numbers = priceText?.match(/\d+/g)?.join('');

    if (numbers) return Number(numbers);
  }

  private getOpenHouseDate(section: Cheerio<any>): string | undefined {
    const openHouseDate = ['.oh-date', '.oh-time']
      .map((selector) => section.find(selector)?.text()?.trim())
      .filter(Boolean)
      .join('<br>');

    if (openHouseDate) return openHouseDate;
  }
}
