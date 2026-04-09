import * as fs from 'fs';
import * as path from 'path';
import { ListingInfo } from '../constants/types';
import { log } from '../constants/helpers';
import { ConsoleType } from '../constants/enums';

const DB_ROOT_DIR = 'db';

/** Service for saving and restoring persisted data */
export class DbService {
  private readonly filepath: string;
  private readonly filename: string;

  constructor(private readonly id: string) {
    this.filename = this.getSafeFilename(this.id);
    this.filepath = path.join(DB_ROOT_DIR, `${this.filename}.json`);
    this.createFolders();
  }

  public async save(listingInfo: ListingInfo): Promise<void> {
    const jsonString = JSON.stringify(listingInfo, null, 2);

    fs.writeFile(this.filepath, jsonString, 'utf8', (err: any) => {
      if (err) {
        log(`Error writing to DB file: "${err}"`, ConsoleType.Error);
      } else {
        log(`Saved DB file: ${this.filename}`);
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
      log(`Error reading DB file: "${e}"`, ConsoleType.Error);
    }

    if (result) {
      log(`Loaded DB file: ${this.filename}`);
    }

    return result;
  }

  private createFolders(): void {
    try {
      if (!fs.existsSync(DB_ROOT_DIR)) {
        fs.mkdirSync(DB_ROOT_DIR);
      }
    } catch (e: any) {
      log(`Error creating folder: "${e.message}"`, ConsoleType.Error);
    }
  }

  private getSafeFilename = (str: string): string => {
    return str
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');
  };
}
