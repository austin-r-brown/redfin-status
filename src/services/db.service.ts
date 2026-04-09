import * as fs from 'fs';
import * as path from 'path';
import { ListingInfo } from '../constants/types';

const DB_ROOT_DIR = 'db';
const BACKUPS_ROOT_DIR = 'backups';

/** Service for saving and restoring persisted data */
export class DbService {
  private readonly filepath: string;
  private readonly filename: string;
  private readonly backupsDir: string;

  constructor(private readonly listingInfo: ListingInfo) {
    this.filename = this.getSafeFileName(listingInfo.address);
    this.filepath = path.join(DB_ROOT_DIR, `${this.filename}.json`);
    this.backupsDir = path.join(DB_ROOT_DIR, BACKUPS_ROOT_DIR, this.filename);
    this.createFolders();
  }

  public async save(listingInfo: ListingInfo): Promise<void> {
    const jsonString = JSON.stringify(listingInfo, null, 2);

    fs.writeFile(this.filepath, jsonString, 'utf8', (err: any) => {
      if (err) {
        console.error(`Error writing to DB file: "${err}"`);
      } else {
        console.info('Data saved to DB successfully');
      }
    });
  }

  public load(): ListingInfo | null {
    let result: ListingInfo | null = null;
    try {
      if (fs.existsSync(this.filepath)) {
        const data = fs.readFileSync(this.filepath, 'utf8');
        const jsonData = JSON.parse(data);

        if (typeof jsonData === 'object') {
          result = jsonData;
        }
      }
    } catch (e: any) {
      console.error(`Error reading DB file: "${e}"`);
    }

    if (result) {
      console.info(`Loaded listing info from DB for ${this.listingInfo.address}`);
    }

    return result;
  }

  private createFolders(): void {
    const parts = this.backupsDir.split(path.sep);
    try {
      for (let i = 1; i <= parts.length; i++) {
        const dir = path.join(...parts.slice(0, i));

        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir);
        }
      }
    } catch (e: any) {
      console.error(`Error creating folder: "${e.message}"`);
    }
  }

  private getSafeFileName = (url: string): string => {
    try {
      const parsed = new URL(url);

      const safe = (parsed.hostname + parsed.pathname + parsed.search)
        // replace unsafe characters
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
        // collapse multiple underscores
        .replace(/_+/g, '_')
        // trim underscores
        .replace(/^_+|_+$/g, '');

      return safe || 'file';
    } catch {
      // fallback if invalid URL
      return (
        url
          .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_+|_+$/g, '') || 'file'
      );
    }
  };
}
