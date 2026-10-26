import { type Data, parseImport } from "./domain";
export interface Repository {
  load(): Data | null;
  save(data: Data): void;
}
export const STORAGE_KEY = "coffee-lover.v1";
export class LocalRepository implements Repository {
  load() {
    const value = localStorage.getItem(STORAGE_KEY);
    return value ? parseImport(value) : null;
  }
  save(data: Data) {
    const serialized = JSON.stringify(data);
    parseImport(serialized); // The write and import boundaries share one schema.
    localStorage.setItem(STORAGE_KEY, serialized);
  }
}
export const exportData = (data: Data) => JSON.stringify(data, null, 2);
