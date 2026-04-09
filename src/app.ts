import axios from 'axios';
import * as cheerio from 'cheerio';
import { INTERVAL, REDFIN_URL } from './constants/constants';
import { DbService } from './services/db.service';
import { EmailService } from './services/email.service';
import { ListingInfo, ListingStatus } from './constants/types';

class App {
  private savedListingInfo: ListingInfo | null;

  constructor(
    private readonly db: DbService,
    private readonly email: EmailService,
  ) {
    this.savedListingInfo = this.db.load();
  }

  public run = async (listingInfo: ListingInfo) => {
    if (JSON.stringify(listingInfo) !== JSON.stringify(this.savedListingInfo)) {
      this.db.save(listingInfo);
      const subject = `New Redfin Status: ${listingInfo.status}`;
      const body = getBodyHtml(listingInfo);
      this.email.send(subject, [body]);
    }
    this.savedListingInfo = listingInfo;
    this.scheduleNextRun();
  };

  private scheduleNextRun() {
    setTimeout(async () => {
      const listingInfo = await getListingInfo(REDFIN_URL);
      if (listingInfo) {
        this.run(listingInfo);
      }
    }, INTERVAL);
  }
}

function getStatusEnum(input: string): ListingStatus {
  const status = input
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') as ListingStatus;

  const isValid = Object.values(ListingStatus).includes(status);
  if (!isValid) {
    console.error(`Invalid Status Found: ${status}`);
  }
  return status;
}

function getBodyHtml({ status, address }: ListingInfo): string {
  const statusClassMap: Record<ListingStatus, string> = {
    [ListingStatus.ForSale]: 'status-for-sale',
    [ListingStatus.Pending]: 'status-pending',
    [ListingStatus.Sold]: 'status-sold',
    [ListingStatus.OffMarket]: 'status-off-market',
    [ListingStatus.PriceDrop]: 'status-price-drop',
    [ListingStatus.BackOnMarket]: 'status-back-on-market',
    [ListingStatus.Contingent]: 'status-contingent',
  };

  const statusClass = statusClassMap[status] || 'status-default';

  return `<div class="container">
        <div class="card">
          <div class="header ${statusClass}">
            Listing Status Update
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>The status of the following real estate listing has been updated:</p>

            <div class="listing-box">
              <div class="label"><strong>Address:</strong></div>
              <div>${address}</div>

              <div class="label" style="margin-top:15px;"><strong>Status:</strong></div>
              <div>
                <span class="badge ${statusClass}">
                  ${status}
                </span>
              </div>
            </div>

            <div class="cta">
              <a href="${REDFIN_URL}" class="button ${statusClass}">
                View Listing
              </a>
            </div>
          </div>

          <div class="footer">
            © ${new Date().getFullYear()}<br/>
            This is an automated notification.
          </div>

        </div>
      </div>`;
}

async function getListingInfo(url: string): Promise<ListingInfo | null> {
  try {
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        Connection: 'keep-alive',
      },
    });

    const $ = cheerio.load(html);

    const status = $('.ListingStatusBannerSection').text().trim();
    const address = $('.full-address').text().trim();

    if (!status.length || !address.length) {
      console.error('Listing Info Missing:', { status, address });
    } else {
      console.info(`[${new Date().toLocaleString()}]`);
    }

    return { status: getStatusEnum(status), address };
  } catch (err) {
    console.error('Error fetching or parsing:', err);
  }
  return null;
}

export const init = async () => {
  const listingInfo = await getListingInfo(REDFIN_URL);
  if (listingInfo) {
    const dbService = new DbService(listingInfo);
    const emailService = new EmailService();
    const app = new App(dbService, emailService);
    app.run(listingInfo);
  } else {
    console.log('Failed to init. Retrying in 30 seconds...');
    setTimeout(() => init(), 30000);
  }
};
