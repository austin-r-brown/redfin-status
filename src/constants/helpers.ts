import { ConsoleType, ListingStatus } from './enums';
import { ListingInfo, RedfinAddressInfo, RedfinMediaInfo } from './types';
import * as cheerio from 'cheerio';

const STATUS_CLASS_MAP: Record<ListingStatus, string> = {
  [ListingStatus.Active]: 'status-for-sale',
  [ListingStatus.PendingSale]: 'status-pending',
  [ListingStatus.ClosedSale]: 'status-sold',
  [ListingStatus.Sold]: 'status-for-rent',
  [ListingStatus.ComingSoon]: 'status-coming-soon',
  [ListingStatus.ActiveUnderContract]: 'status-contingent',
};

export function log(message: string = '', type: ConsoleType = ConsoleType.Info) {
  const timestamp = `[${new Date().toLocaleString()}]`;
  console[type](`${timestamp} ${message}`);
}

export function getStatusEnum(str: string): ListingStatus {
  const enumKey = str.replace(/ /g, '') as keyof typeof ListingStatus;
  const status = ListingStatus[enumKey];

  if (!status) {
    log(`Invalid Status Found: ${str}`, ConsoleType.Error);
    return str as ListingStatus;
  }
  return status;
}

export function getOpenHouseDate(html: string): string | undefined {
  const $ = cheerio.load(html);

  const openHouseDate = ['.oh-date', '.oh-time']
    .map((selector) => $(selector).text().trim())
    .filter(Boolean)
    .join('|');

  if (openHouseDate) return openHouseDate;
}

export function getFormattedPrice(amount: number, abbreviated = false): string {
  if (abbreviated) {
    if (amount >= 1_000_000) return `$${Number((amount / 1_000_000).toFixed(2))}m`;
    if (amount >= 1_000) return `$${Number((amount / 1_000).toFixed(1))}k`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getStatusNotificationHtml({ status, address, link }: ListingInfo): string {
  const statusClass = STATUS_CLASS_MAP[status] || 'status-default';

  return `
    <div class="container">
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
            <a href="${link}" class="button ${statusClass}">
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

export function getPriceNotificationHtml({ price, address, link }: ListingInfo, oldPrice: number): string {
  return `
    <div class="container">
      <div class="card">
        <div class="header price-change-new">
          Listing Price Update
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>The price of the following real estate listing has been updated:</p>

          <div class="listing-box">
            <div class="label"><strong>Address:</strong></div>
            <div>${address}</div>

            <div class="label" style="margin-top:15px;"><strong>Previous Price:</strong></div>
            <div>
              <span class="badge price-change-old">
                <s>${getFormattedPrice(oldPrice)}</s>
              </span>
            </div>

            <div class="label" style="margin-top:15px;"><strong>New Price:</strong></div>
            <div>
              <span class="badge price-change-new">
                ${getFormattedPrice(price)}
              </span>
            </div>
          </div>

          <div class="cta">
            <a href="${link}" class="button price-change-new">
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

export function getOpenHouseNotificationHtml({ openHouseDate, address, link }: ListingInfo): string {
  return `
    <div class="container">
      <div class="card">
        <div class="header open-house-new">
          Open House Update
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>The open house date of the following real estate listing has been updated:</p>

          <div class="listing-box">
            <div class="label"><strong>Address:</strong></div>
            <div>${address}</div>

            <div class="label" style="margin-top:15px;"><strong>Open House Date:</strong></div>
            <div>${openHouseDate?.replace('|', '<br>')}</div>
          </div>

          <div class="cta">
            <a href="${link}" class="button open-house-new">
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

export function extractRedfinData(input: string): string {
  const marker = '"text":"{}&&';
  const startAfterMarker = '"\\u002Fstingray\\u002Fapi\\u002Fhome\\u002Fdetails\\u002FaboveTheFold":';

  let foundSearchStart = false;
  let foundMarker = false;

  let depth = 0;
  let startIdx;
  let endIdx = -1;

  const isAtIndexOf = (str: string, idx: number) => str === input.slice(idx, idx + str.length);

  for (let i = 0; i < input.length; i++) {
    if (!foundSearchStart) {
      foundSearchStart = isAtIndexOf(startAfterMarker, i);
      if (foundSearchStart) i = i + startAfterMarker.length;
      else continue;
    }
    if (!foundMarker) {
      foundMarker = isAtIndexOf(marker, i);
      if (foundMarker) i = i + marker.length;
      else continue;
    }

    const char = input[i];

    if (char === '{') {
      depth++;
      if (!startIdx) startIdx = i;
    } else if (char === '}') depth--;

    if (depth === 0) {
      endIdx = i;
      break;
    }
  }

  return input.slice(startIdx, endIdx + 1);
}

export function parseRedfinData(data: string): RedfinAddressInfo {
  const unescaped = JSON.parse(`"${data}"`);
  const redfinData: {
    addressSectionInfo: RedfinAddressInfo;
    mediaBrowserInfo: RedfinMediaInfo; // Currently unused
  } = JSON.parse(unescaped).payload;

  return redfinData.addressSectionInfo;
}
