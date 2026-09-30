import { GameSession, type NewGameOptions } from '../domain/GameSession.js';
import { restore } from '../domain/save.js';
import type {
  AbilityId,
  AbilityResult,
  Difficulty,
  ShootResult,
  TalentId,
} from '../domain/types.js';
import type { GameEvent } from '../domain/events.js';
import type { RandomSource } from '../domain/rules/random.js';
import { WORLD } from '../domain/rules/world.js';
import type { MobileSaveStore } from '../infrastructure/storage/MobileSaveStore.js';

export type MobileFeedback =
  | GameEvent
  | { type: 'shoot'; result: ShootResult }
  | { type: 'ability'; id: AbilityId; result: AbilityResult }
  | { type: 'phase'; phase: string };

/** Platform-neutral mobile input/lifecycle adapter; all gameplay goes through GameSession. */
export class MobileGameController {
  private session: GameSession | null = null;
  private readonly held = new Set<number>();
  private readonly pressed = new Set<number>();
  private readonly listeners = new Set<() => void>();
  private readonly frames = new Set<() => void>();
  private accumulator = 0;
  private saveElapsed = 0;
  private hudElapsed = 0;
  private previousTime: number | null = null;
  suspended = true;
  ready = false;
  constructor(
    readonly saves: MobileSaveStore,
    private readonly feedback: (event: MobileFeedback) => void = () => {},
    private readonly random: RandomSource = Math.random,
  ) {}
  get game(): GameSession | null {
    return this.session;
  }
  get state() {
    return this.session?.state ?? null;
  }
  get heldLanes(): ReadonlySet<number> {
    return this.held;
  }
  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }
  subscribeFrame(callback: () => void): () => void {
    this.frames.add(callback);
    return () => {
      this.frames.delete(callback);
    };
  }
  private notify(): void {
    for (const callback of this.listeners) callback();
  }
  async initialize(): Promise<void> {
    const saved = await this.saves.load();
    if (saved) this.session = restore(saved, this.random);
    this.ready = true;
    this.notify();
  }
  start(difficulty: Difficulty, options: NewGameOptions = {}): void {
    if (!this.ready || this.saves.readOnly) return;
    this.resetInput();
    this.session = new GameSession(difficulty, this.random, options);
    this.session.state.record = Math.max(this.saves.record, this.session.state.level);
    this.suspended = false;
    this.saveElapsed = 0;
    this.persist();
    this.changed();
  }
  private changed(): void {
    this.feedback({ type: 'phase', phase: this.state?.phase ?? 'menu' });
    for (const callback of this.frames) callback();
    this.notify();
  }
  resume(): void {
    if (!this.session || this.state?.phase === 'gameOver') return;
    this.resetInput();
    this.suspended = false;
    this.changed();
  }
  suspend(): void {
    this.suspended = true;
    this.resetInput();
    this.persist();
    this.notify();
  }
  private resetInput(): void {
    this.held.clear();
    this.pressed.clear();
    this.previousTime = null;
    this.accumulator = 0;
  }
  pressLane(lane: number): ShootResult {
    if (
      this.suspended ||
      !Number.isInteger(lane) ||
      lane < 0 ||
      lane >= WORLD.lanes ||
      this.held.has(lane) ||
      this.state?.phase !== 'playing'
    )
      return 'blocked';
    this.held.add(lane);
    this.pressed.add(lane);
    return this.shoot(lane);
  }
  releaseLane(lane: number): void {
    this.held.delete(lane);
    this.pressed.delete(lane);
  }
  private shoot(lane: number): ShootResult {
    const result = this.session!.shootLane(lane);
    if (result !== 'blocked') this.feedback({ type: 'shoot', result });
    return result;
  }
  ability(id: AbilityId): AbilityResult {
    if (this.suspended || !this.session) return 'level_locked';
    const phase = this.state!.phase;
    const result = this.session.activateAbility(id);
    this.feedback({ type: 'ability', id, result });
    if (phase !== this.state!.phase) this.resetInput();
    this.persist();
    this.changed();
    return result;
  }
  private command(action: (session: GameSession) => boolean): boolean {
    if (this.suspended || !this.session || !action(this.session)) return false;
    this.resetInput();
    this.persist();
    this.changed();
    return true;
  }
  upgrade(id: TalentId): boolean {
    return this.command((game) => game.upgradeTalent(id));
  }
  buy(id: string): boolean {
    return this.command((game) => game.buyItem(id));
  }
  sell(index: number): boolean {
    return this.command((game) => game.sellItem(index));
  }
  confirm(): boolean {
    return this.command((game) => game.confirmLevelUp());
  }
  persist(): void {
    if (this.session) void this.saves.save(this.session).then(() => this.notify());
  }
  /** Timestamp is supplied by the platform; fixed steps are identical on 60/90/120 Hz displays. */
  frame(timestamp: number): void {
    if (!Number.isFinite(timestamp)) return;
    if (this.suspended || !this.session || this.state?.phase !== 'playing') {
      this.previousTime = null;
      return;
    }
    const elapsed =
      this.previousTime === null
        ? 0
        : Math.min(WORLD.maxFrameTime, Math.max(0, (timestamp - this.previousTime) / 1000));
    this.accumulator += elapsed;
    this.previousTime = timestamp;
    const phase = this.state!.phase;
    // Subtracting long-running platform timestamps loses more than Number.EPSILON.
    while (this.accumulator + 1e-9 >= WORLD.fixedStep) {
      if (this.state!.phase === 'playing') {
        for (const lane of this.held) {
          if (!this.pressed.has(lane)) this.shoot(lane);
        }
        this.pressed.clear();
        this.session.tick(WORLD.fixedStep);
        this.saveElapsed += WORLD.fixedStep;
      }
      this.accumulator = Math.max(0, this.accumulator - WORLD.fixedStep);
    }
    for (const event of this.session.drainEvents()) this.feedback(event);
    for (const callback of this.frames) callback();
    if (phase !== this.state!.phase) {
      this.resetInput();
      this.persist();
      this.changed();
    } else {
      this.hudElapsed += elapsed;
      if (this.hudElapsed >= 0.1) {
        this.hudElapsed = 0;
        this.notify();
      }
    }
    if (this.saveElapsed >= 5) {
      this.saveElapsed = 0;
      this.persist();
    }
  }
}
