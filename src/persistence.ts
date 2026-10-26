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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}
export const exportData = (data: Data) => JSON.stringify(data, null, 2);
