import type { GameState } from './GameState.js';
import type { TalentSystem } from './TalentSystem.js';
import type { ItemSystem } from './ItemSystem.js';

export const SAVE_KEY = 'hvs_save';
export const SAVE_VERSION = 2;

export interface SaveData {
  readonly version: number;
  readonly difficulty: string;
  readonly level: number;
  readonly hp: number;
  readonly energy: number;
  readonly coins: number;
  readonly pendingTalentPoints: number;
  readonly talents: readonly { id: string; rank: number }[];
  readonly record: number;
  readonly inventory?: readonly string[];
}

export class SaveSystem {
  public save(state: GameState, talentSystem: TalentSystem, itemSystem?: ItemSystem): void {
    const data: SaveData = {
      version: SAVE_VERSION,
      difficulty: state.difficulty,
      level: state.level,
      hp: state.hp,
      energy: state.energy,
      coins: state.coins,
      pendingTalentPoints: state.pendingTalentPoints,
      talents: talentSystem.toSaveData(),
      record: state.record,
      inventory: itemSystem?.toSaveData() ?? [],
    };
    const json = JSON.stringify(data);
    localStorage.setItem(SAVE_KEY, json);
  }

  public load(): SaveData | null {
    const json = localStorage.getItem(SAVE_KEY);
    if (json === null) return null;

    let data: SaveData;
    try {
      data = JSON.parse(json) as SaveData;
    } catch {
      this.clear();
      return null;
    }

    if (data.version !== SAVE_VERSION && data.version !== 1) {
      this.clear();
      return null;
    }

    return data;
  }

  public hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  public clear(): void {
    localStorage.removeItem(SAVE_KEY);
  }

  public getRecord(): number {
    const save = this.load();
    if (save === null) return 0;
    return save.record ?? 0;
  }
}
