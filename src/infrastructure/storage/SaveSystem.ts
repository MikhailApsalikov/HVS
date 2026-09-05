import type { GameSession } from '../../domain/GameSession.js';
import { parseSave, snapshot, type SaveData } from '../../domain/save.js';

export const SAVE_KEY = 'hvs_save';
const RECORD_KEY = 'hvs_record';
export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class SaveSystem {
  lastError: string | null = null;
  constructor(private readonly storage: StoragePort) {}
  save(session: GameSession): boolean {
    try {
      if (session.state.phase === 'gameOver') {
        this.clear();
        return true;
      }
      this.storage.setItem(SAVE_KEY, JSON.stringify(snapshot(session)));
      this.saveRecord(session.state.record);
      this.lastError = null;
      return true;
    } catch {
      this.lastError = 'Не удалось сохранить игру в этом браузере.';
      return false;
    }
  }
  load(): SaveData | null {
    try {
      const json = this.storage.getItem(SAVE_KEY);
      return json === null ? null : parseSave(JSON.parse(json));
    } catch {
      return null;
    }
  }
  hasSave(): boolean {
    return this.load() !== null;
  }
  clear(): void {
    try {
      this.storage.removeItem(SAVE_KEY);
    } catch {
      this.lastError = 'Хранилище недоступно.';
    }
  }
  getRecord(): number {
    try {
      const value = Number(this.storage.getItem(RECORD_KEY));
      return Math.max(
        Number.isSafeInteger(value) && value >= 0 ? value : 0,
        this.load()?.state.record ?? 0,
      );
    } catch {
      return 0;
    }
  }
  saveRecord(record: number): void {
    this.storage.setItem(RECORD_KEY, String(Math.max(record, this.getRecord())));
  }
}
