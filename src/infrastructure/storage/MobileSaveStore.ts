import { parseSave, snapshot, SAVE_VERSION, type SaveData } from '../../domain/save.js';
import type { GameSession } from '../../domain/GameSession.js';

export interface AsyncStoragePort {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}
interface RecordData {
  format: 1;
  sequence: number;
  record: number;
  save: SaveData | null;
}
export const MOBILE_SAVE_KEYS = ['hvs.android.save.a', 'hvs.android.save.b'] as const;

/** Alternating complete records: interrupted writes keep the previous checkpoint intact. */
export class MobileSaveStore {
  lastError: string | null = null;
  readOnly = false;
  record = 0;
  private sequence = 0;
  private queue: Promise<boolean> = Promise.resolve(true);
  constructor(private readonly storage: AsyncStoragePort) {}
  async load(): Promise<SaveData | null> {
    const records: RecordData[] = [];
    for (const key of MOBILE_SAVE_KEYS) {
      try {
        const text = await this.storage.getItem(key);
        if (text === null) continue;
        const value = JSON.parse(text);
        if (value && (value.format > 1 || value.save?.version > SAVE_VERSION)) {
          this.readOnly = true;
          this.lastError = 'Сохранение создано более новой версией игры. Обновите приложение.';
          continue;
        }
        if (
          !value ||
          value.format !== 1 ||
          !Number.isSafeInteger(value.sequence) ||
          value.sequence < 1 ||
          !Number.isSafeInteger(value.record) ||
          value.record < 0
        )
          throw new Error('Invalid save envelope');
        const save = value.save === null ? null : parseSave(value.save);
        if (value.save !== null && !save) throw new Error('Invalid saved game');
        records.push({ ...value, save });
      } catch {
        this.lastError ??=
          'Не удалось прочитать сохранение. Использована доступная резервная копия.';
      }
    }
    records.sort((a, b) => b.sequence - a.sequence);
    this.sequence = records[0]?.sequence ?? 0;
    this.record = Math.max(0, ...records.map((entry) => entry.record));
    return this.readOnly ? null : (records[0]?.save ?? null);
  }
  save(session: GameSession): Promise<boolean> {
    if (this.readOnly) return Promise.resolve(false);
    // Serialize immediately: subsequent frames must not mutate an enqueued snapshot.
    const record = Math.max(this.record, session.state.record);
    this.record = record;
    const save = session.state.phase === 'gameOver' ? null : snapshot(session);
    const payload = JSON.stringify({ record, save });
    this.queue = this.queue.then(async () => {
      const sequence = this.sequence + 1;
      try {
        await this.storage.setItem(
          MOBILE_SAVE_KEYS[sequence % 2],
          JSON.stringify({ format: 1, sequence, ...JSON.parse(payload) }),
        );
        this.sequence = sequence;
        this.record = Math.max(this.record, record);
        this.lastError = null;
        return true;
      } catch {
        this.lastError = 'Не удалось сохранить игру на телефоне. Предыдущая запись сохранена.';
        return false;
      }
    });
    return this.queue;
  }
  flush(): Promise<boolean> {
    return this.queue;
  }
}
