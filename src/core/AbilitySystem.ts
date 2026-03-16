import type { AbilityId, DifficultyConfig } from '../config/types.js';
import type { GameState } from './GameState.js';
import type { FormulaCalculator } from './FormulaCalculator.js';
import type { TalentSystem } from './TalentSystem.js';
import { Arrow } from '../entities/Arrow.js';

const FREEZE_COST = 50;
const BLIZZARD_BASE_SLOW = 0.4;
const BLIZZARD_BASE_DURATION = 4;
const PREP_ENERGY_RESTORE = 300;
const HEAL_BASE_AMOUNT = 150;
const VOLLEY_BASE_LANES = 4;
const STAND_BASE_DURATION = 7;
const ARMAGEDDON_CHARGE_DURATION = 1.7;
export class AbilitySystem {
  private readonly _config: DifficultyConfig;
  private readonly _formulaCalculator: FormulaCalculator;
  private readonly _talentSystem: TalentSystem;
  private _armageddonPendingIds: Set<string> = new Set();

  public constructor(
    config: DifficultyConfig,
    formulaCalculator: FormulaCalculator,
    talentSystem: TalentSystem
  ) {
    this._config = config;
    this._formulaCalculator = formulaCalculator;
    this._talentSystem = talentSystem;
  }

  public tick(dt: number, state: GameState): void {
    const abilityIds: AbilityId[] = [
      'freeze',
      'blizzard',
      'prep',
      'heal',
      'volley',
      'stand',
      'armageddon',
    ];
    for (const id of abilityIds) {
      state.getAbility(id).tick(dt);
    }

    state.tickInvulnerable(dt);
    state.tickBlizzard(dt);

    this._tickArmageddon(dt, state);
    this._handleBlizzardSlowExpiration(dt, state);
  }

  private _tickArmageddon(dt: number, state: GameState): void {
    if (state.armageddonPhase === 'charging') {
      state.tickArmageddon(dt);
      if (state.armageddonTimer <= 0) {
        state.setArmageddon('firing');
        this._armageddonPendingIds.clear();
        for (const spider of state.spiders.values()) {
          spider.scheduleArmageddon(Math.random() * 2);
          this._armageddonPendingIds.add(spider.id);
        }
      }
      return;
    }

    if (state.armageddonPhase === 'firing') {
      for (const spider of state.spiders.values()) {
        if (!this._armageddonPendingIds.has(spider.id)) continue;
        if (spider.tickArmageddon(dt)) {
          this._armageddonPendingIds.delete(spider.id);
          spider.startDying();
        }
      }

      const toRemove: string[] = [];
      for (const id of this._armageddonPendingIds) {
        if (!state.spiders.has(id)) {
          toRemove.push(id);
        }
      }
      for (const id of toRemove) {
        this._armageddonPendingIds.delete(id);
      }

      if (this._armageddonPendingIds.size === 0) {
        state.setArmageddon('none');
      }
    }
  }

  private _handleBlizzardSlowExpiration(dt: number, state: GameState): void {
    for (const spider of state.spiders.values()) {
      spider.tickSlow(dt);
    }
  }

  public activateFreeze(state: GameState): boolean {
    if (state.freezeActive) {
      this.deactivateFreeze(state);
      return true;
    }
    const cost = FREEZE_COST;
    if (state.energy < cost) return false;
    state.modifyEnergy(-cost);
    state.setPhase('paused');
    state.setFreezeActive(true);
    return true;
  }

  public deactivateFreeze(state: GameState): void {
    state.setFreezeActive(false);
    state.setPhase('playing');
  }

  public activateBlizzard(state: GameState): boolean {
    const levelReq = 8;
    if (state.level < levelReq) return false;

    const ability = state.getAbility('blizzard');
    if (ability.isOnCooldown) return false;

    const cost = this._config.abilities.blizzard.cost;
    if (state.energy < cost) return false;

    state.modifyEnergy(-cost);
    ability.activate(this._config.abilities.blizzard.cooldown);

    const slowBonus = this._talentSystem.getBlizzardSlowBonus();
    const slowFactor = 1 - BLIZZARD_BASE_SLOW - slowBonus;
    const durationBonus = this._talentSystem.getBlizzardDurationBonus();
    const duration = BLIZZARD_BASE_DURATION + durationBonus;

    for (const spider of state.spiders.values()) {
      spider.applySlow(slowFactor, duration);
    }
    state.setBlizzard(duration);

    return true;
  }

  public activatePrep(state: GameState): boolean {
    const levelReq = 12;
    if (state.level < levelReq) return false;

    const ability = state.getAbility('prep');
    if (ability.isOnCooldown) return false;

    const baseCooldown = this._config.abilities.prep.cooldown;
    const reduction = this._talentSystem.getPrepCooldownReduction();
    const cooldown = Math.max(0, baseCooldown - reduction);

    ability.activate(cooldown);
    state.modifyEnergy(PREP_ENERGY_RESTORE);

    return true;
  }

  public activateHeal(state: GameState): boolean {
    const levelReq = 16;
    if (state.level < levelReq) return false;

    const ability = state.getAbility('heal');
    if (ability.isOnCooldown) return false;

    const cost = this._config.abilities.heal.cost;
    if (state.energy < cost) return false;

    state.modifyEnergy(-cost);
    ability.activate(this._config.abilities.heal.cooldown);

    const healBonus = this._talentSystem.getHealBonus();
    const amount = HEAL_BASE_AMOUNT + healBonus;
    state.modifyHp(amount);

    return true;
  }

  public activateVolley(state: GameState): boolean {
    const levelReq = 20;
    if (state.level < levelReq) return false;

    const ability = state.getAbility('volley');
    if (ability.isOnCooldown) return false;

    const cost = this._config.abilities.volley.cost;
    if (state.energy < cost) return false;

    const baseCooldown = this._config.abilities.volley.cooldown;
    const multiplier = this._talentSystem.getShootCooldownMultiplier();
    const cooldown = baseCooldown * multiplier;

    state.modifyEnergy(-cost);
    ability.activate(cooldown);

    const extraLanes = this._talentSystem.getVolleyExtraLanes();
    const laneCount = VOLLEY_BASE_LANES + extraLanes;
    const speedMultiplier = this._talentSystem.getArrowSpeedMultiplier();

    const lanes = this._pickRandomLanes(
      Math.min(laneCount, 9),
      9
    );
    const config = state.config;
    for (const lane of lanes) {
      const arrow = Arrow.create(lane, config, speedMultiplier, true);
      state.addArrow(arrow);
    }

    return true;
  }

  public activateStand(state: GameState): boolean {
    const levelReq = 24;
    if (state.level < levelReq) return false;

    const ability = state.getAbility('stand');
    if (ability.isOnCooldown) return false;

    const cost = this._config.abilities.stand.cost;
    if (state.energy < cost) return false;

    const baseCooldown = this._config.abilities.stand.cooldown;
    const reduction = this._talentSystem.getStandCooldownReduction();
    const cooldown = Math.max(0, baseCooldown - reduction);

    state.modifyEnergy(-cost);
    ability.activate(cooldown);

    const durationBonus = this._talentSystem.getStandDurationBonus();
    const duration = STAND_BASE_DURATION + durationBonus;
    state.setInvulnerable(duration);

    return true;
  }

  public activateArmageddon(state: GameState): boolean {
    const levelReq = 28;
    if (state.level < levelReq) return false;

    const ability = state.getAbility('armageddon');
    if (ability.isOnCooldown) return false;

    const cost = this._config.abilities.armageddon.cost;
    if (state.energy < cost) return false;

    state.modifyEnergy(-cost);
    ability.activate(this._config.abilities.armageddon.cooldown);

    state.setArmageddon('charging', ARMAGEDDON_CHARGE_DURATION);

    return true;
  }

  private _pickRandomLanes(count: number, totalLanes: number): number[] {
    const all = Array.from({ length: totalLanes }, (_, i) => i);
    const result: number[] = [];
    for (let i = 0; i < count && all.length > 0; i++) {
      const idx = this._formulaCalculator.randomInt(0, all.length - 1);
      result.push(all[idx]);
      all.splice(idx, 1);
    }
    return result;
  }
}
