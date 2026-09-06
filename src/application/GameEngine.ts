import type {
  AbilityId,
  AbilityResult,
  Difficulty,
  GamePhase,
  ShootResult,
  TalentId,
} from '../domain/types.js';
import type { GameState } from '../domain/model/GameState.js';
import { GameSession } from '../domain/GameSession.js';
import { restore } from '../domain/save.js';
import { FrameLoop } from '../infrastructure/browser/FrameLoop.js';
import { SaveSystem } from '../infrastructure/storage/SaveSystem.js';

/** Coordinates a session, persistence and rendering; contains no game formulas. */
export class GameEngine {
  private session: GameSession | null = null;
  private previousPhase: GamePhase = 'menu';
  private phaseChanged: ((phase: GamePhase, state: GameState) => void) | null = null;
  private coinDrop: ((id: string, coins: number, jackpot: boolean) => void) | null = null;
  private damage:
    ((id: string, hp: number, energy: number, blockedDamage?: number) => void) | null = null;
  private absorb: (() => void) | null = null;
  constructor(
    private readonly render: (state: GameState) => void,
    private readonly saves: SaveSystem,
    private readonly loop = new FrameLoop(),
  ) {}

  setPhaseChangeCallback(callback: NonNullable<GameEngine['phaseChanged']>): void {
    this.phaseChanged = callback;
  }
  setCoinDropCallback(callback: NonNullable<GameEngine['coinDrop']>): void {
    this.coinDrop = callback;
  }
  setDamagePopCallback(callback: NonNullable<GameEngine['damage']>): void {
    this.damage = callback;
  }
  setAbsorbCallback(callback: () => void): void {
    this.absorb = callback;
  }
  getState(): GameState | null {
    return this.session?.state ?? null;
  }
  getTalentSystem() {
    return this.session?.talents ?? null;
  }
  getItemSystem() {
    return this.session?.items ?? null;
  }
  getSaveSystem(): SaveSystem {
    return this.saves;
  }
  get isInitialTalentPick(): boolean {
    return this.session?.state.initialTalentPick ?? false;
  }
  startNewGame(difficulty: Difficulty): void {
    this.stopLoop();
    const record = this.saves.getRecord();
    this.saves.clear();
    this.session = new GameSession(difficulty);
    this.session.state.record = Math.max(record, this.session.state.level);
    this.persist();
    this.startLoop();
  }
  loadGame(): boolean {
    const save = this.saves.load();
    if (!save) return false;
    this.stopLoop();
    this.session = restore(save);
    this.startLoop();
    return true;
  }
  shootLane(lane: number): ShootResult {
    return this.session?.shootLane(lane) ?? 'blocked';
  }
  activateAbility(id: AbilityId): AbilityResult {
    return this.session?.activateAbility(id) ?? 'level_locked';
  }
  upgradeTalent(id: TalentId): boolean {
    return this.afterCommand(this.session?.upgradeTalent(id) ?? false);
  }
  buyItem(id: string): boolean {
    return this.afterCommand(this.session?.buyItem(id) ?? false);
  }
  sellItem(index: number): boolean {
    return this.afterCommand(this.session?.sellItem(index) ?? false);
  }
  confirmLevelUp(): boolean {
    return this.afterCommand(this.session?.confirmLevelUp() ?? false);
  }
  private afterCommand(success: boolean): boolean {
    if (success) this.persist();
    return success;
  }
  persist(): void {
    if (this.session) this.saves.save(this.session);
  }
  stopLoop(): void {
    this.loop.stop();
  }
  private startLoop(): void {
    this.previousPhase = 'menu';
    this.loop.start(
      (dt) => this.session?.tick(dt),
      () => {
        const session = this.session;
        if (!session) return false;
        const state = session.state;
        // Event locations still exist in the last rendered frame.
        for (const event of session.drainEvents()) {
          if (event.type === 'coinDrop')
            this.coinDrop?.(event.spiderId, event.coins, event.jackpot);
          else if (event.type === 'damage')
            this.damage?.(event.spiderId, event.hp, event.energy, event.blockedDamage);
          else this.absorb?.();
        }
        this.render(state);
        if (state.phase !== this.previousPhase) {
          this.previousPhase = state.phase;
          this.persist();
          this.phaseChanged?.(state.phase, state);
        }
        return state.phase !== 'gameOver';
      },
    );
  }
}
