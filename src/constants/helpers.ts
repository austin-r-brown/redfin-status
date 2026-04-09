import { ConsoleType, ListingStatus } from './enums';
import { ListingInfo } from './types';

const STATUS_CLASS_MAP: Record<ListingStatus, string> = {
  [ListingStatus.ForSale]: 'status-for-sale',
  [ListingStatus.Pending]: 'status-pending',
  [ListingStatus.Sold]: 'status-sold',
  [ListingStatus.OffMarket]: 'status-off-market',
  [ListingStatus.PriceDrop]: 'status-price-drop',
  [ListingStatus.BackOnMarket]: 'status-back-on-market',
  [ListingStatus.Contingent]: 'status-contingent',
};

export function log(message: string = '', type: ConsoleType = ConsoleType.Info) {
  const timestamp = `[${new Date().toLocaleString()}]`;
  console[type](`${timestamp} ${message}`);
}

export function getStatusEnum(input: string): ListingStatus {
  const status = input
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') as ListingStatus;

  const isValid = Object.values(ListingStatus).includes(status);
  if (!isValid) {
    log(`Invalid Status Found: ${status}`, ConsoleType.Error);
  }
  return status;
}

export function getBodyHtml({ status, address }: ListingInfo, url: URL): string {
  const statusClass = STATUS_CLASS_MAP[status] || 'status-default';

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
            <a href="${url.href}" class="button ${statusClass}">
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
