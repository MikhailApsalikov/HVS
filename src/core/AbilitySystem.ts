import type { AbilityId, AbilityResult, DifficultyConfig } from '../config/types.js';
import type { GameState } from './GameState.js';
import type { FormulaCalculator } from './FormulaCalculator.js';
import type { TalentSystem } from './TalentSystem.js';
import type { ItemSystem } from './ItemSystem.js';
import { Arrow } from '../entities/Arrow.js';

const FREEZE_COST = 50;
const BLIZZARD_BASE_SLOW = 0.4;
const BLIZZARD_BASE_DURATION = 4;
const PREP_ENERGY_RESTORE = 300;
const HEAL_BASE_AMOUNT = 150;
const VOLLEY_BASE_LANES = 4;
const STAND_BASE_DURATION = 7;
const ARMAGEDDON_CHARGE_DURATION = 2.5;
const ARMAGEDDON_FIRE_DURATION = 3;

export class AbilitySystem {
  private readonly _config: DifficultyConfig;
  private readonly _formulaCalculator: FormulaCalculator;
  private readonly _talentSystem: TalentSystem;
  private readonly _itemSystem: ItemSystem;

  public constructor(
    config: DifficultyConfig,
    formulaCalculator: FormulaCalculator,
    talentSystem: TalentSystem,
    itemSystem: ItemSystem
  ) {
    this._config = config;
    this._formulaCalculator = formulaCalculator;
    this._talentSystem = talentSystem;
    this._itemSystem = itemSystem;
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
      'recharge',
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
        const effectBoost = this._itemSystem.getAbilityMod('armageddon', 'effectBoost')?.value ?? 0;
        state.setArmageddon('firing', ARMAGEDDON_FIRE_DURATION + effectBoost);
      }
      return;
    }

    if (state.armageddonPhase === 'firing') {
      for (const spider of state.spiders.values()) {
        if (!spider.dying) {
          spider.startDying();
        }
      }

      state.tickArmageddon(dt);
      if (state.armageddonTimer <= 0) {
        state.setArmageddon('none');
      }
    }
  }

  private _handleBlizzardSlowExpiration(dt: number, state: GameState): void {
    for (const spider of state.spiders.values()) {
      spider.tickSlow(dt);
    }
  }

  public activateFreeze(state: GameState): AbilityResult {
    if (state.freezeActive) {
      this.deactivateFreeze(state);
      return 'deactivated';
    }
    const levelReq = 4;
    if (state.level < levelReq) return 'level_locked';
    const costReduction = this._itemSystem.getAbilityMod('freeze', 'costReduction')?.value ?? 0;
    const cost = Math.max(0, FREEZE_COST - costReduction);
    if (state.energy < cost) return 'not_enough_energy';
    state.modifyEnergy(-cost);
    state.setPhase('paused');
    state.setFreezeActive(true);
    return 'activated';
  }

  public deactivateFreeze(state: GameState): void {
    state.setFreezeActive(false);
    state.setPhase('playing');
  }

  public activateBlizzard(state: GameState): AbilityResult {
    const levelReq = 8;
    if (state.level < levelReq) return 'level_locked';

    const ability = state.getAbility('blizzard');
    if (ability.isOnCooldown) return 'on_cooldown';

    const costReduction = this._itemSystem.getAbilityMod('blizzard', 'costReduction')?.value ?? 0;
    const cost = Math.max(0, this._config.abilities.blizzard.cost - costReduction);
    if (state.energy < cost) return 'not_enough_energy';

    state.modifyEnergy(-cost);
    const cdReduction = this._itemSystem.getAbilityMod('blizzard', 'cooldownReduction')?.value ?? 0;
    const baseCd = Math.max(0, this._config.abilities.blizzard.cooldown - cdReduction);
    ability.activate(baseCd * this._talentSystem.getAbilityCooldownMultiplier());

    const slowBonus = this._talentSystem.getBlizzardSlowBonus();
    const slowFactor = 1 - BLIZZARD_BASE_SLOW - slowBonus;
    const durationBonus = this._talentSystem.getBlizzardDurationBonus();
    const effectBoost = this._itemSystem.getAbilityMod('blizzard', 'effectBoost')?.value ?? 0;
    const duration = BLIZZARD_BASE_DURATION + durationBonus + effectBoost;

    for (const spider of state.spiders.values()) {
      spider.applySlow(slowFactor, duration);
    }
    state.setBlizzard(duration);

    return 'activated';
  }

  public activatePrep(state: GameState): AbilityResult {
    const levelReq = 12;
    if (state.level < levelReq) return 'level_locked';

    const ability = state.getAbility('prep');
    if (ability.isOnCooldown) return 'on_cooldown';

    const baseCooldown = this._config.abilities.prep.cooldown;
    const reduction = this._talentSystem.getPrepCooldownReduction();
    const itemCdReduction = this._itemSystem.getAbilityMod('prep', 'cooldownReduction')?.value ?? 0;
    const cooldown = Math.max(0, baseCooldown - reduction - itemCdReduction) * this._talentSystem.getAbilityCooldownMultiplier();

    ability.activate(cooldown);
    const effectBoost = this._itemSystem.getAbilityMod('prep', 'effectBoost')?.value ?? 0;
    state.modifyEnergy(PREP_ENERGY_RESTORE * (1 + effectBoost));

    return 'activated';
  }

  public activateHeal(state: GameState): AbilityResult {
    const levelReq = 16;
    if (state.level < levelReq) return 'level_locked';

    const ability = state.getAbility('heal');
    if (ability.isOnCooldown) return 'on_cooldown';

    const costReduction = this._itemSystem.getAbilityMod('heal', 'costReduction')?.value ?? 0;
    const cost = Math.max(0, this._config.abilities.heal.cost - costReduction);
    if (state.energy < cost) return 'not_enough_energy';

    state.modifyEnergy(-cost);
    const cdReduction = this._itemSystem.getAbilityMod('heal', 'cooldownReduction')?.value ?? 0;
    const baseCd = Math.max(0, this._config.abilities.heal.cooldown - cdReduction);
    ability.activate(baseCd * this._talentSystem.getAbilityCooldownMultiplier());

    const healBonus = this._talentSystem.getHealBonus();
    const effectBoost = this._itemSystem.getAbilityMod('heal', 'effectBoost')?.value ?? 0;
    const amount = HEAL_BASE_AMOUNT + healBonus + effectBoost;
    state.modifyHp(amount);

    return 'activated';
  }

  public activateVolley(state: GameState): AbilityResult {
    const levelReq = 20;
    if (state.level < levelReq) return 'level_locked';

    const ability = state.getAbility('volley');
    if (ability.isOnCooldown) return 'on_cooldown';

    const costReduction = this._itemSystem.getAbilityMod('volley', 'costReduction')?.value ?? 0;
    const cost = Math.max(0, this._config.abilities.volley.cost - costReduction);
    if (state.energy < cost) return 'not_enough_energy';

    const cdReduction = this._itemSystem.getAbilityMod('volley', 'cooldownReduction')?.value ?? 0;
    const baseCooldown = Math.max(0, this._config.abilities.volley.cooldown - cdReduction);
    const multiplier = this._talentSystem.getShootCooldownMultiplier();
    const cooldown = baseCooldown * multiplier * this._talentSystem.getAbilityCooldownMultiplier();

    state.modifyEnergy(-cost);
    ability.activate(cooldown);

    const extraLanes = this._talentSystem.getVolleyExtraLanes();
    const effectBoost = this._itemSystem.getAbilityMod('volley', 'effectBoost')?.value ?? 0;
    const laneCount = VOLLEY_BASE_LANES + extraLanes + effectBoost;
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

    return 'activated';
  }

  public activateStand(state: GameState): AbilityResult {
    const levelReq = 25;
    if (state.level < levelReq) return 'level_locked';

    const ability = state.getAbility('stand');
    if (ability.isOnCooldown) return 'on_cooldown';

    const costReduction = this._itemSystem.getAbilityMod('stand', 'costReduction')?.value ?? 0;
    const cost = Math.max(0, this._config.abilities.stand.cost - costReduction);
    if (state.energy < cost) return 'not_enough_energy';

    const baseCooldown = this._config.abilities.stand.cooldown;
    const reduction = this._talentSystem.getStandCooldownReduction();
    const itemCdReduction = this._itemSystem.getAbilityMod('stand', 'cooldownReduction')?.value ?? 0;
    const cooldown = Math.max(0, baseCooldown - reduction - itemCdReduction) * this._talentSystem.getAbilityCooldownMultiplier();

    state.modifyEnergy(-cost);
    ability.activate(cooldown);

    const durationBonus = this._talentSystem.getStandDurationBonus();
    const effectBoost = this._itemSystem.getAbilityMod('stand', 'effectBoost')?.value ?? 0;
    const duration = STAND_BASE_DURATION + durationBonus + effectBoost;
    state.setInvulnerable(duration);

    return 'activated';
  }

  public activateArmageddon(state: GameState): AbilityResult {
    const levelReq = 30;
    if (state.level < levelReq) return 'level_locked';

    const ability = state.getAbility('armageddon');
    if (ability.isOnCooldown) return 'on_cooldown';

    const costReduction = this._itemSystem.getAbilityMod('armageddon', 'costReduction')?.value ?? 0;
    const cost = Math.max(0, this._config.abilities.armageddon.cost - costReduction);
    if (state.energy < cost) return 'not_enough_energy';

    state.modifyEnergy(-cost);
    const cdReduction = this._itemSystem.getAbilityMod('armageddon', 'cooldownReduction')?.value ?? 0;
    const baseCd = Math.max(0, this._config.abilities.armageddon.cooldown - cdReduction);
    ability.activate(baseCd * this._talentSystem.getAbilityCooldownMultiplier());

    state.setArmageddon('charging', ARMAGEDDON_CHARGE_DURATION);

    return 'activated';
  }

  public activateRecharge(state: GameState): AbilityResult {
    const levelReq = 50;
    if (state.level < levelReq) return 'level_locked';

    const ability = state.getAbility('recharge');
    if (ability.isOnCooldown) return 'on_cooldown';

    const costReduction = this._itemSystem.getAbilityMod('recharge', 'costReduction')?.value ?? 0;
    const cost = Math.max(0, this._config.abilities.recharge.cost - costReduction);
    if (state.energy < cost) return 'not_enough_energy';

    state.modifyEnergy(-cost);
    const cdReduction = this._itemSystem.getAbilityMod('recharge', 'cooldownReduction')?.value ?? 0;
    const baseCd = Math.max(0, this._config.abilities.recharge.cooldown - cdReduction);
    ability.activate(baseCd * this._talentSystem.getAbilityCooldownMultiplier());

    const otherAbilityIds: AbilityId[] = ['freeze', 'blizzard', 'prep', 'heal', 'volley', 'stand', 'armageddon'];
    for (const id of otherAbilityIds) {
      state.getAbility(id).activate(0);
    }

    for (const archer of state.archers) {
      archer.startCooldown(0);
    }

    return 'activated';
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
