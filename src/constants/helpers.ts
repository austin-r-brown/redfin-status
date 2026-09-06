import { Cheerio } from 'cheerio';
import { ConsoleType, ListingStatus } from './enums';
import { ListingInfo } from './types';
import { SELECTORS, STATUS_TO_CSS_CLASS, STATUS_VALUE_MAP } from './constants';

export function log(message: string = '', type: ConsoleType = ConsoleType.Info) {
  const timestamp = `[${new Date().toLocaleString()}]`;
  console[type](`${timestamp} ${message}`);
}

export function getContentHash(sections: Cheerio<any>[]): number {
  const content = sections
    .map((s) => s?.text()?.trim())
    .filter(Boolean)
    .join('');

  let hash = 0x811c9dc5;

  for (let i = 0; i < content.length; i++) {
    hash ^= content.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}

export function getStatus(section: Cheerio<any>): ListingStatus | undefined {
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

export function getAddress(section: Cheerio<any>): string | undefined {
  const address = section.find(SELECTORS.address)?.text()?.trim();

  if (address) return address;
}

export function getPrice(section: Cheerio<any>): number | undefined {
  const priceText = section.find(SELECTORS.price)?.text()?.trim();
  const numbers = priceText?.match(/\d+/g)?.join('');

  if (numbers) return Number(numbers);
}

export function getOpenHouseDate(section: Cheerio<any>): string | undefined {
  const openHouseDate = ['.oh-date', '.oh-time']
    .map((selector) => section.find(selector)?.text()?.trim())
    .filter(Boolean)
    .join('|');

  if (openHouseDate) return openHouseDate;
}

export function getFormattedPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getAbbreviatedPrice(amount: number): string {
  if (amount >= 1_000_000) return `$${Number((amount / 1_000_000).toFixed(2))}m`;
  if (amount >= 1_000) return `$${Number((amount / 1_000).toFixed(1))}k`;
  return getFormattedPrice(amount);
}

export function getStatusNotificationHtml({ status, address, link }: ListingInfo): string {
  const statusClass = STATUS_TO_CSS_CLASS[status] || 'status-default';

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
            ${
              oldPrice
                ? `<div class="label" style="margin-top:15px;"><strong>Previous Price:</strong></div>
                <div>
                  <span class="badge price-change-old">
                    <s>${getFormattedPrice(oldPrice)}</s>
                  </span>
                </div>`
                : ''
            }
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
          <p>The open house date of the following real estate listing has been ${openHouseDate ? 'updated' : 'cancelled'}:</p>

          <div class="listing-box">
            <div class="label"><strong>Address:</strong></div>
            <div>${address}</div>
          ${
            openHouseDate
              ? `
            <div class="label" style="margin-top:15px;"><strong>Open House Date:</strong></div>
            <div>${openHouseDate.replace('|', '<br>')}</div>`
              : ''
          }
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
