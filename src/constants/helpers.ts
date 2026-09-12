import { ConsoleType } from './enums';

export function log(message: string = '', type: ConsoleType = ConsoleType.Info) {
  const timestamp = `[${new Date().toLocaleString()}]`;
  console[type](`${timestamp} ${message}`);
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
