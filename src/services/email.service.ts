import { EmailConfig, ListingInfo } from '../constants/types';
import { NETWORK_TIMEOUT, STATUS_TO_CSS_CLASS } from '../constants/constants';
import { getAbbreviatedPrice, getFormattedPrice, log } from '../constants/helpers';
import { ConsoleType } from '../constants/enums';
import * as fs from 'fs';
import * as path from 'path';
import * as SibApiV3Sdk from '@sendinblue/client';

/** Service for generating and sending email notifications */
export class EmailService {
  private readonly api = new SibApiV3Sdk.TransactionalEmailsApi();
  private readonly css = fs.readFileSync(path.join('src', 'styles.css'), 'utf8');

  private readonly smtpConfig: EmailConfig | null;

  constructor(private readonly link: string) {
    const userConfig = this.validateUserInput();

    if (userConfig) {
      this.api.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, userConfig.apiKey);
    } else {
      log(
        'Valid Email Addresses and API Key must be provided in .env file for emails to be sent. See README.md for more info.',
        ConsoleType.Warn,
      );
    }

    this.smtpConfig = userConfig;
  }

  public async send(subject: string, notification: string, footer?: string): Promise<void> {
    log(subject);
    if (!this.smtpConfig) return;

    const htmlContent = `<!DOCTYPE html>
      <html lang="en">
        <head>
          <style>
            ${this.css}
          </style>
        </head>
        <body>
          <div class="notification main">${notification}</div>
          ${footer ? `<div class="notification" id="footer">${footer}</div>` : ''}
        </body>
      </html>`;

    const email = { ...this.smtpConfig, subject, htmlContent };

    this.api.sendTransacEmail(email).then(
      (data) => log(`Email sent successfully. ${data.body.messageId}`),
      (err) => this.handleSendError(err, [subject, notification, footer]),
    );
  }

  private async handleSendError(err: any, args: Parameters<EmailService['send']>): Promise<void> {
    const { message } = err?.response?.body ?? {};
    log(`Unable to send email: ${message ? `"${message}"` : JSON.stringify(err)}`, ConsoleType.Error);

    if (err?.response?.statusCode !== 401) {
      log(`Retrying in ${NETWORK_TIMEOUT / 1000} seconds...`, ConsoleType.Error);
      setTimeout(() => this.send(...args), NETWORK_TIMEOUT);
    }
  }

  private validateUserInput(): EmailConfig | null {
    const apiKey: string = process.env.SIB_API_KEY?.trim() ?? '';
    const sendFromEmail: string = process.env.SEND_FROM_EMAIL?.trim() ?? '';
    const sendToEmails: string[] = (process.env.SEND_TO_EMAILS ?? '')
      .trim()
      .split(',')
      .map((e) => e.trim());
    const allEmails: string[] = [sendFromEmail, ...sendToEmails];

    const apiKeyValid = apiKey.length >= 32 && /^[a-zA-Z0-9-]+$/.test(apiKey);
    const emailsValid =
      allEmails.length > 1 &&
      allEmails.every((e) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(e.trim()));

    if (apiKeyValid && emailsValid) {
      return {
        sender: { email: sendFromEmail },
        to: sendToEmails.map((email) => ({ email })),
        apiKey,
      };
    }

    return null;
  }

  public notifyStatusChange({ status, address }: ListingInfo): void {
    const subject = `New Listing Status: ${status}`;
    const header = 'Listing Status Update';
    const cssClass = STATUS_TO_CSS_CLASS[status];

    const notification = `
      <p>The status of the following real estate listing has been updated:</p>

      <div class="listing-box">
        <div class="label"><strong>Address:</strong></div>
        <div>${address}</div>

        <div class="label" style="margin-top:15px;"><strong>Status:</strong></div>
        <div>
          <span class="badge ${cssClass}">
            ${status}
          </span>
        </div>
      </div>`;

    const body = this.buildEmailBody(header, notification, cssClass);

    this.send(subject, body);
  }

  public notifyPriceChange({ price, address }: ListingInfo, oldPrice: number): void {
    const priceChange = oldPrice && [oldPrice, price].map((p) => getAbbreviatedPrice(p)).join(' → ');

    const subject = `New Listing Price: ${priceChange || getAbbreviatedPrice(price)}`;
    const header = 'Listing Price Update';
    const cssClass = 'price-change-new';

    const notification = `
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
          <span class="badge ${cssClass}">
            ${getFormattedPrice(price)}
          </span>
        </div>
      </div>`;

    const body = this.buildEmailBody(header, notification, cssClass);

    this.send(subject, body);
  }

  public notifyOpenHouseChange({ openHouseDate, address }: ListingInfo): void {
    const subject = openHouseDate
      ? `New Open House: ${openHouseDate.split('<br>')[0]}`
      : 'Open House Cancelled';
    const header = 'Open House Update';
    const cssClass = 'open-house-new';

    const notification = `
      <p>The open house date of the following real estate listing has been ${openHouseDate ? 'updated' : 'cancelled'}:</p>

      <div class="listing-box">
        <div class="label"><strong>Address:</strong></div>
        <div>${address}</div>
      ${
        openHouseDate
          ? `<div class="label" style="margin-top:15px;"><strong>Open House Date:</strong></div>
          <div>${openHouseDate}</div>`
          : ''
      }
      </div>`;

    const body = this.buildEmailBody(header, notification, cssClass);

    this.send(subject, body);
  }

  private buildEmailBody(header: string, content: string, cssClass: string): string {
    return `
    <div class="container">
      <div class="card">
        <div class="header ${cssClass || 'status-default'}">
          ${header}
        </div>
        <div class="content">
          ${content}

          <div class="cta">
            <a href="${this.link}" class="button ${cssClass}">
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
}
