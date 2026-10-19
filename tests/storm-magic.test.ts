import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import { parseSave, restore, snapshot } from '../src/domain/save.js';
import type { TalentId } from '../src/domain/types.js';
import { ITEM_MAP } from '../src/content/items.js';
import { TALENTS } from '../src/content/talents.js';
import { ABILITIES, ABILITY_ORDER } from '../src/content/abilities.js';
import {
  abilityDescription,
  attributeDescription,
  playerEffectDescription,
  talentDescription,
} from '../src/ui/presenters.js';
import { itemAbilityDescription } from '../src/ui/itemPresentation.js';
import { addSpider } from './helpers.js';

function arena(talents: readonly { id: TalentId; rank: number }[] = [], roll = 0.999999) {
  const session = new GameSession('normal', () => roll, { level: 60, coins: 1000000 });
  session.talents.loadFromSave(talents);
  session.state.character.setModifiers('test:arena', [
    { stat: 'spawnProbability', kind: 'percent', value: -100 },
    { stat: 'hpRegen', kind: 'percent', value: -100 },
    { stat: 'energyRegen', kind: 'percent', value: -100 },
    { stat: 'armor', kind: 'percent', value: -100 },
    { stat: 'maxHp', kind: 'flat', value: 20000 },
    { stat: 'maxEnergy', kind: 'flat', value: 1000 },
    { stat: 'shootCost', kind: 'percent', value: -100 },
  ]);
  session.refreshStats();
  session.state.initialTalentPick = false;
  session.state.levelTimer = session.state.levelTimerMax = 10000;
  session.state.phase = 'playing';
  session.state.hp = session.state.maxHp;
  session.state.energy = session.state.maxEnergy;
  return session;
}
const shield = [{ id: 'lightningShield', rank: 1 }] as const;
const lightning = [{ id: 'lightningArrows', rank: 1 }] as const;
function equip(session: GameSession, ...ids: string[]) {
  session.state.phase = 'levelUp';
  session.talents.loadFromSave([...session.talents.toSaveData(), { id: 'hunterArsenal', rank: 5 }]);
  session.refreshStats();
  for (const id of ids) expect(session.buyItem(id)).toBe(true);
  session.state.phase = 'playing';
  session.state.energy = session.state.maxEnergy;
}
function breach(session: GameSession, damage = 100, lane = 4) {
  addSpider(session, 'normal', lane, 1, damage);
  session.tick(0.001);
  return session.drainEvents().find((event) => event.type === 'damage');
}

describe('storm talent balance through session commands', () => {
  it('keeps cleanser and reapplication bookkeeping out of every tooltip', () => {
    const session = arena([
      { id: 'masochism', rank: 5 },
      { id: 'hunterReward', rank: 5 },
      ...shield,
    ]);
    session.state.hp = 100;
    breach(session, 1);
    expect(session.activateAbility('lightningShield')).toBe('activated');
    const golden = addSpider(session, 'golden', 4, 0.95);
    expect(session.shootLane(4)).toBe('shot');
    session.tick(0.4);
    expect(golden.dying).toBe(true);
    expect(session.state.hunterRewardTimer).toBeGreaterThan(0);
    const descriptions = [
      ...session.talents.talents.map(({ id, maxRanks }) =>
        talentDescription(id, maxRanks, session.state.stats),
      ),
      ...ABILITY_ORDER.map((id) => abilityDescription(session.state, id)),
      ...session.state.activeEffects.map(playerEffectDescription),
      ...Object.values(ABILITIES).map((ability) => ability.description),
    ];
    for (const description of descriptions)
      expect(description).not.toMatch(
        /снимается очистителем|повторное срабатывание|обновляет время/iu,
      );
  });

  it.each(['easy', 'normal', 'hard'] as const)('uses the new rank limits on %s', (difficulty) => {
    const session = new GameSession(difficulty, () => 0.999999, { level: 60 });
    expect(session.talents.getTalent('agility').maxRanks).toBe(10);
    expect(session.talents.getTalent('tireless').maxRanks).toBe(7);
    expect(session.talents.getTalent('killingStreak').maxRanks).toBe(5);
    for (let rank = 1; rank <= 10; rank++) expect(session.upgradeTalent('agility')).toBe(true);
    expect(session.upgradeTalent('agility')).toBe(false);
    expect(session.state.maxEnergy).toBeGreaterThanOrEqual(700);
    const regen = session.state.stats.energyRegen;
    for (let rank = 1; rank <= 7; rank++) expect(session.upgradeTalent('tireless')).toBe(true);
    expect(session.upgradeTalent('tireless')).toBe(false);
    expect(session.state.stats.energyRegen).toBe(regen + 7);
  });

  it.each(['easy', 'normal', 'hard'] as const)(
    'learns Lightning Shield at tier four before Magic Armor at tier five on %s',
    (difficulty) => {
      const session = new GameSession(difficulty, () => 0.999999, { level: 60 });
      session.talents.loadFromSave([
        { id: 'agility', rank: 10 },
        { id: 'tireless', rank: 7 },
        { id: 'improvedIntellect', rank: 5 },
        { id: 'hunterArsenal', rank: 5 },
        { id: 'permafrost', rank: 1 },
      ]);
      expect(session.talents.getTalent('lightningShield')).toMatchObject({
        tier: 4,
        maxRanks: 1,
        requiredBranchPoints: 21,
        unlocksAtLevel: 30,
      });
      expect(session.talents.getTalent('magicArmor')).toMatchObject({
        tier: 5,
        maxRanks: 5,
        requiredBranchPoints: 28,
        unlocksAtLevel: 40,
      });
      expect(session.talents.upgradeBlockReason('magicArmor', 60)).toBe('prerequisite');
      expect(session.upgradeTalent('magicArmor')).toBe(false);
      session.state.level = 29;
      expect(session.upgradeTalent('lightningShield')).toBe(false);
      session.state.level = 30;
      expect(session.upgradeTalent('lightningShield')).toBe(true);
      expect(session.upgradeTalent('lightningShield')).toBe(false);
      session.state.phase = 'playing';
      expect(session.activateAbility('lightningShield')).toBe('activated');
      session.state.phase = 'levelUp';
      session.state.level = 39;
      expect(session.upgradeTalent('magicArmor')).toBe(false);
      session.state.level = 40;
      for (let rank = 1; rank <= 5; rank++) expect(session.upgradeTalent('magicArmor')).toBe(true);
      expect(session.upgradeTalent('magicArmor')).toBe(false);
      expect(session.talents.getTalent('improvedArmageddon').tier).toBe(4);
      expect(TALENTS.magicArmor.column).toBe(TALENTS.lightningShield.column);
      expect(TALENTS.magicArmor.prerequisite).toEqual({ id: 'lightningShield', rank: 1 });
      expect(TALENTS.lightningShield.prerequisite).toBeUndefined();
      for (const tier of [4, 5]) {
        const talents = session.talents.talents.filter(
          (talent) => talent.branch === 'magic' && talent.tier === tier,
        );
        expect(new Set(talents.map(({ id }) => TALENTS[id].column)).size).toBe(talents.length);
      }
    },
  );
});

describe('Lightning Shield through session commands', () => {
  it('costs no energy, scales with intellect and expires after three minutes', () => {
    const session = arena(shield);
    session.state.energy = 0;
    expect(session.activateAbility('lightningShield')).toBe('activated');
    const capacity = 500 + session.state.stats.intellect * 10;
    expect(session.state.lightningShieldAbsorption).toBe(capacity);
    expect(session.state.getAbility('lightningShield').remainingCooldown).toBe(180);
    expect(session.activateAbility('lightningShield')).toBe('on_cooldown');
    expect(abilityDescription(session.state, 'lightningShield')).toContain(String(capacity));
    expect(attributeDescription(session.state, 'intellect')).toContain('Щита молний');
    expect(
      playerEffectDescription(
        session.state.activeEffects.find((effect) => effect.id === 'lightningShield')!,
      ),
    ).toContain(String(capacity));
    session.tick(179.999);
    expect(session.state.lightningShieldTimer).toBeCloseTo(0.001);
    session.tick(0.001);
    expect(session.state.lightningShieldTimer).toBe(0);
    expect(session.state.lightningShieldAbsorption).toBe(0);
    expect(session.state.activeEffects.some((effect) => effect.id === 'lightningShield')).toBe(
      false,
    );
    expect(session.activateAbility('lightningShield')).toBe('activated');
  });

  it('absorbs full and partial hits, consumes the last point and preserves streaks on full absorption', () => {
    const session = arena([...shield, { id: 'killingStreak', rank: 5 }]);
    session.activateAbility('lightningShield');
    session.state.killingStreakStacks = 2;
    session.state.killingStreakProgress = 3;
    const capacity = session.state.lightningShieldAbsorption;
    const hp = session.state.hp;
    expect(breach(session)).toMatchObject({ hp: 0, absorbedDamage: 100 });
    expect(session.state.hp).toBe(hp);
    expect(session.state.lightningShieldAbsorption).toBe(capacity - 100);
    expect(session.state.killingStreakStacks).toBe(2);
    expect(session.state.killingStreakProgress).toBeGreaterThan(3);
    expect(breach(session, capacity)).toMatchObject({ hp: 100, absorbedDamage: capacity - 100 });
    expect(session.state.hp).toBe(hp - 100);
    expect(session.state.lightningShieldTimer).toBe(0);
    expect(session.state.killingStreakStacks).toBe(1);
    expect(breach(session, 10)).toMatchObject({ hp: 10 });
  });

  it.each([
    ['golden', 'goldLock'],
    ['fast', 'healingReduction'],
    ['poisonous', 'poison'],
    ['ninja', 'disorientation'],
  ] as const)(
    'applies the %s spider debuff through full and partial shield absorption',
    (type, effectId) => {
      for (const partial of [false, true]) {
        const session = arena(shield);
        expect(session.activateAbility('lightningShield')).toBe('activated');
        const capacity = session.state.lightningShieldAbsorption;
        const hp = session.state.hp;
        const damage = partial ? capacity + 100 : 100;
        addSpider(session, type, 4, 1, damage);
        session.tick(0.001);
        expect(session.state.hp).toBe(hp - (partial ? 100 : 0));
        expect(session.state.lightningShieldAbsorption).toBe(partial ? 0 : capacity - 100);
        expect(
          session.state.activeEffects.find((effect) => effect.id === effectId)?.remaining,
        ).toBeGreaterThan(0);
        if (type === 'golden') expect(session.state.stats.coinsPerSec).toBeLessThan(4);
        if (type === 'fast') expect(session.state.stats.healingReceived).toBeLessThan(1);
        if (type === 'poisonous') {
          expect(session.state.poisonDamage).toEqual([damage]);
          expect(session.state.stats['poison.tickDamage']).toBeGreaterThan(0);
        }
        const loaded = restore(parseSave(snapshot(session))!);
        expect(loaded.state.activeEffects).toEqual(session.state.activeEffects);
      }
    },
  );

  it('respects magic armor immunity when shield absorption replaces health damage', () => {
    const session = arena([...shield, { id: 'magicArmor', rank: 5 }]);
    session.state.character.setModifiers('test:intellect', [
      { stat: 'intellect', kind: 'flat', value: 2000 - session.state.stats.intellect },
    ]);
    session.refreshStats();
    expect(session.state.stats.spiderDebuffResistance).toBe(1);
    expect(session.activateAbility('lightningShield')).toBe('activated');
    for (const type of ['golden', 'fast', 'poisonous', 'ninja'] as const)
      addSpider(session, type, 4, 1, 100);
    const hp = session.state.hp;
    session.tick(0.001);
    expect(session.state.hp).toBe(hp);
    expect(
      session.state.activeEffects.filter(
        (effect) => effect.kind === 'debuff' && effect.source === 'spider',
      ),
    ).toEqual([]);
  });

  it('applies piercing stun even when the shield absorbs the entire hit', () => {
    const session = arena(shield, 0);
    session.state.level = 61;
    session.refreshStats();
    expect(session.activateAbility('lightningShield')).toBe('activated');
    const hp = session.state.hp;
    const capacity = session.state.lightningShieldAbsorption;
    expect(breach(session)).toMatchObject({ hp: 0, absorbedDamage: 400, piercing: true });
    expect(session.state.hp).toBe(hp);
    expect(session.state.lightningShieldAbsorption).toBe(capacity - 400);
    expect(session.state.isStunned).toBe(true);
    expect(session.state.stats.energyPerBreach).toBe(0);
  });

  it.each(['dodge', 'block', 'invulnerability', 'zero'] as const)(
    'does not spend absorption after %s prevents damage',
    (protection) => {
      const session = arena(shield, 0);
      session.state.character.setModifiers(
        'test:protection',
        protection === 'dodge'
          ? [{ stat: 'dodgeChance', kind: 'flat', value: 0.75 }]
          : protection === 'block'
            ? [
                { stat: 'blockChance', kind: 'flat', value: 1 },
                { stat: 'blockPower', kind: 'flat', value: 1000 },
              ]
            : [],
      );
      session.refreshStats();
      session.activateAbility('lightningShield');
      if (protection === 'invulnerability') session.state.invulnerableTimer = 5;
      const capacity = session.state.lightningShieldAbsorption;
      addSpider(session, 'poisonous', 4, 1, protection === 'zero' ? 0 : 100);
      session.tick(0.001);
      expect(session.state.lightningShieldAbsorption).toBe(capacity);
      expect(session.state.lightningShieldProcCooldown).toBe(0);
      expect(session.state.poisonTimer).toBe(0);
    },
  );

  it('uses damage remaining after armor and partial block', () => {
    const session = arena(shield, 0);
    session.state.character.setModifiers('test:protection', [
      { stat: 'incomingDamage', kind: 'percent', value: -50 },
      { stat: 'blockChance', kind: 'flat', value: 1 },
      { stat: 'blockPower', kind: 'flat', value: 40 },
    ]);
    session.refreshStats();
    session.activateAbility('lightningShield');
    const capacity = session.state.lightningShieldAbsorption;
    expect(breach(session, 100)).toMatchObject({ hp: 0, blockedDamage: 40, absorbedDamage: 10 });
    expect(session.state.lightningShieldAbsorption).toBe(capacity - 10);
  });

  it('replies from the archer, only with Lightning Arrows, and observes its internal cooldown', () => {
    const session = arena([...shield, ...lightning, { id: 'improvedLightning', rank: 2 }]);
    const target = addSpider(session, 'megaFat', 5, 0.2);
    target.hits = 100;
    const next = addSpider(session, 'megaFat', 6, 0.3);
    next.hits = 100;
    session.activateAbility('lightningShield');
    breach(session);
    expect(target.hits).toBe(99);
    expect(session.state.chainLightning[0].jumps).toBe(2);
    expect(session.state.lightningShieldProcCooldown).toBe(2);
    breach(session);
    expect(target.hits).toBe(99);
    session.state.chainLightning = [];
    session.tick(1.998);
    breach(session);
    expect(target.hits).toBe(98);

    const noLightning = arena(shield);
    noLightning.activateAbility('lightningShield');
    const survivor = addSpider(noLightning, 'normal', 5, 0.2);
    breach(noLightning);
    expect(survivor.dying).toBe(false);
    expect(noLightning.state.lightningShieldProcCooldown).toBe(0);
  });

  it('emits a bolt from the breached lane and never spends archer charges', () => {
    const session = arena([...shield, ...lightning]);
    session.activateAbility('lightningArrows');
    session.activateAbility('lightningShield');
    addSpider(session, 'normal', 4, 1, 5);
    addSpider(session, 'normal', 5, 0.2);
    session.tick(0.001);
    expect(session.drainEvents()).toContainEqual({
      type: 'lightning',
      from: { lane: 4, y: 1 },
      to: { lane: 5, y: 0.2 },
    });
    expect(session.state.lightningCharges).toEqual(Array(9).fill(1));
  });

  it('preserves the response interval across Recharge and replacement shields, including a final partial absorption', () => {
    const session = arena([...shield, ...lightning, { id: 'recharge', rank: 1 }]);
    equip(session, 'l030');
    session.activateAbility('lightningShield');
    const target = addSpider(session, 'megaFat', 4, 0.1);
    target.hits = 100;
    breach(session);
    expect(target.hits).toBe(99);
    const cooldown = session.state.lightningShieldProcCooldown;
    expect(session.activateAbility('recharge')).toBe('activated');
    expect(session.activateAbility('lightningShield')).toBe('activated');
    expect(session.state.lightningShieldProcCooldown).toBe(cooldown);
    breach(session);
    expect(target.hits).toBe(99);
    session.tick(2);
    const capacity = session.state.lightningShieldAbsorption;
    expect(breach(session, capacity + 10)).toMatchObject({ hp: 10, absorbedDamage: capacity });
    expect(target.hits).toBe(98);
    expect(session.state.lightningShieldAbsorption).toBe(0);
  });

  it('starts a poison-triggered response chain at the poison tick, with the full jump delay', () => {
    const session = arena([...shield, ...lightning, { id: 'improvedLightning', rank: 1 }]);
    addSpider(session, 'poisonous', 4, 1, 100);
    session.tick(0.001);
    session.activateAbility('lightningShield');
    const first = addSpider(session, 'megaFat', 5, 0.1);
    const second = addSpider(session, 'megaFat', 6, 0.1);
    first.hits = second.hits = 100;
    session.tick(2);
    expect(first.hits + second.hits).toBe(199);
    expect(session.state.chainLightning[0].remaining).toBe(0.6);
    session.tick(0.599);
    expect(first.hits + second.hits).toBe(199);
    session.tick(0.001);
    expect(first.hits + second.hits).toBe(198);
  });

  it('handles poison damage, pauses timers and lets a cleanser remove the shield', () => {
    const session = arena(shield);
    addSpider(session, 'poisonous', 4, 1, 100);
    session.tick(0.001);
    session.activateAbility('lightningShield');
    const capacity = session.state.lightningShieldAbsorption;
    const hp = session.state.hp;
    session.activateAbility('freeze');
    session.tick(10);
    expect(session.state.lightningShieldTimer).toBe(180);
    session.activateAbility('freeze');
    session.tick(2);
    expect(session.state.hp).toBe(hp);
    expect(session.state.lightningShieldAbsorption).toBeLessThan(capacity);
    expect(session.drainEvents()).toContainEqual(
      expect.objectContaining({ type: 'shieldAbsorption', hp: 0 }),
    );
    addSpider(session, 'cleanser', 4, 1, 0);
    session.tick(0.001);
    expect(session.state.lightningShieldTimer).toBe(0);
    expect(session.state.lightningShieldAbsorption).toBe(0);
  });
});

describe('Masochism low-health buff', () => {
  it.each([1, 2, 3, 4, 5])('grants 40 agility per rank, refreshes and expires: %s', (rank) => {
    const session = arena([{ id: 'masochism', rank }]);
    const agility = session.state.stats.agility;
    session.state.hp = session.state.maxHp * 0.3 + 1;
    breach(session, 1);
    expect(session.state.masochismTimer).toBe(0);
    breach(session, 1);
    expect(session.state.stats.agility).toBe(agility + 40 * rank);
    expect(session.state.masochismTimer).toBe(75);
    expect(
      playerEffectDescription(
        session.state.activeEffects.find((effect) => effect.id === 'masochism')!,
      ),
    ).toContain(String(40 * rank));
    session.tick(10);
    breach(session, 1);
    expect(session.state.masochismTimer).toBe(75);
    expect(session.state.stats.agility).toBe(agility + 40 * rank);
    session.state.phase = 'levelUp';
    session.tick(100);
    expect(session.state.masochismTimer).toBe(75);
    session.state.phase = 'playing';
    session.tick(75);
    expect(session.state.masochismTimer).toBe(0);
    expect(session.state.stats.agility).toBe(agility);
    expect(talentDescription('masochism', rank, session.state.stats)).toContain(
      `+${40 * rank} ловкости`,
    );
  });

  it('requires actual health damage and the talent; a cleanser removes even a freshly triggered buff', () => {
    const session = arena([...shield, { id: 'masochism', rank: 5 }]);
    session.state.hp = 100;
    session.activateAbility('lightningShield');
    breach(session);
    expect(session.state.masochismTimer).toBe(0);
    session.state.lightningShieldTimer = session.state.lightningShieldAbsorption = 0;
    addSpider(session, 'cleanser', 4, 1, 1);
    session.tick(0.001);
    expect(session.state.masochismTimer).toBe(0);
    const unlearned = arena();
    unlearned.state.hp = 100;
    breach(unlearned, 1);
    expect(unlearned.state.masochismTimer).toBe(0);
  });
});

describe('new legendary magic equipment', () => {
  it.each(['l028', 'l029', 'l030', 'l031', 'l032', 'l033'])(
    '%s follows the stat and price rules and has a readable effect',
    (id) => {
      const item = ITEM_MAP.get(id)!;
      expect(item.stats[0].type).toBe('intellect');
      expect(item.rarity).toBe('legendary');
      expect(item.price).toBeGreaterThanOrEqual(17000);
      expect(item.price).toBeLessThanOrEqual(30000);
      expect(itemAbilityDescription(item)).toBeTruthy();
    },
  );

  it('adds 35 percentage points to learned Fire Explosion and spends no energy', () => {
    const session = arena([{ id: 'fireExplosion', rank: 1 }], 0.699999);
    equip(session, 'l028');
    expect(session.state.stats['fireExplosion.chance']).toBe(0.7);
    expect(talentDescription('fireExplosion', 1, session.state.stats)).toContain('70%');
    const energy = session.state.energy;
    addSpider(session, 'normal', 4, 0.94);
    addSpider(session, 'megaFat', 4, 0.92);
    session.shootLane(4);
    session.tick(0.04);
    expect(session.drainEvents()).toContainEqual(
      expect.objectContaining({ type: 'fireExplosion' }),
    );
    expect(session.state.energy).toBe(energy);
    const unlearned = arena();
    equip(unlearned, 'l028');
    expect(unlearned.state.stats['fireExplosion.chance']).toBe(0);
  });

  it('charges two shots per lane, persists them and replaces rather than stacks on reactivation', () => {
    const session = arena(lightning);
    equip(session, 'l029');
    session.activateAbility('lightningArrows');
    expect(session.state.lightningCharges).toEqual(Array(9).fill(2));
    session.shootLane(4);
    expect(session.state.lightningCharges[4]).toBe(1);
    const loaded = restore(parseSave(snapshot(session))!, () => 0.999999);
    loaded.state.archers[4].start(0);
    loaded.shootLane(4);
    expect([...loaded.state.arrows.values()].every((arrow) => arrow.lightningJumps > 0)).toBe(true);
    expect(loaded.state.lightningCharges[4]).toBe(0);
    loaded.state.archers[4].start(0);
    loaded.shootLane(4);
    expect([...loaded.state.arrows.values()].at(-1)?.lightningJumps).toBe(0);
    loaded.state.getAbility('lightningArrows').start(0);
    loaded.activateAbility('lightningArrows');
    expect(loaded.state.lightningCharges).toEqual(Array(9).fill(2));
    expect(abilityDescription(loaded.state, 'lightningArrows')).toContain('Следующие две атаки');
  });

  it('prefers adjacent lanes and only falls back to a different spider on the current lane', () => {
    const session = arena([...lightning, { id: 'improvedLightning', rank: 1 }]);
    equip(session, 'l030');
    const source = addSpider(session, 'normal', 4, 0.94);
    const same = addSpider(session, 'megaFat', 4, 0.2);
    const adjacent = addSpider(session, 'normal', 5, 0.2);
    session.activateAbility('lightningArrows');
    session.shootLane(4);
    session.tick(0.04);
    expect(session.state.chainLightning[0].targetId).toBe(adjacent.id);
    session.tick(0.6);
    expect(adjacent.dying).toBe(true);
    session.tick(0.6);
    expect(same.hits).toBe(2);
    expect(source.dying).toBe(true);

    const fallback = arena(lightning);
    equip(fallback, 'l030');
    addSpider(fallback, 'megaFat', 4, 0.94);
    const other = addSpider(fallback, 'megaFat', 4, 0.2);
    fallback.activateAbility('lightningArrows');
    fallback.shootLane(4);
    fallback.tick(0.04);
    expect(fallback.state.chainLightning[0].targetId).toBe(other.id);
    fallback.tick(0.65);
    expect(other.hits).toBe(2);
  });

  it('slows existing and newly arriving spiders and stacks independently with Permafrost', () => {
    const session = arena([{ id: 'permafrost', rank: 5 }]);
    const existing = addSpider(session, 'normal', 0, 0.1, 0, 0.1);
    equip(session, 'l031');
    const fresh = addSpider(session, 'normal', 1, 0.1, 0, 0.1);
    session.tick(1);
    const expected = 0.1 + 0.1 * (1 - session.state.stats.permafrostSlow) * 0.75;
    expect(existing.y).toBeCloseTo(expected);
    expect(fresh.y).toBeCloseTo(expected);
    session.state.phase = 'levelUp';
    expect(session.sellItem(0)).toBe(true);
    expect(session.state.stats.globalSpiderSlow).toBe(0);
  });

  it('applies both shield upgrades, all eleven jumps and the 1.5-second response interval', () => {
    const session = arena([
      ...shield,
      ...lightning,
      { id: 'improvedLightning', rank: 5 },
      { id: 'quickInstinct', rank: 10 },
    ]);
    equip(session, 'l032', 'l033');
    expect(session.state.stats['lightningArrows.jumps']).toBe(11);
    expect(session.state.stats['lightningShield.procCooldown']).toBe(1.5);
    session.activateAbility('lightningShield');
    expect(session.state.getAbility('lightningShield').remainingCooldown).toBe(114);
    const target = addSpider(session, 'megaFat', 5, 0.1);
    target.hits = 100;
    breach(session);
    expect(session.state.lightningShieldProcCooldown).toBe(1.5);
    expect(session.state.chainLightning).toHaveLength(0);
    session.tick(1.499);
    breach(session);
    expect(target.hits).toBe(98);
  });
});

describe('storm save compatibility', () => {
  it('preserves Magic Armor already learned at level thirty before the tier swap', () => {
    const session = new GameSession('normal', () => 0.999999, { level: 30 });
    session.talents.loadFromSave([{ id: 'magicArmor', rank: 5 }]);
    session.refreshStats();
    const saved = snapshot(session);
    const loaded = restore(parseSave(saved)!);
    expect(loaded.talents.getRank('magicArmor')).toBe(5);
    expect(loaded.talents.getRank('lightningShield')).toBe(0);
    expect(loaded.state.stats.armor).toBe(session.state.stats.armor);
    expect(loaded.state.pendingTalentPoints).toBe(saved.state.pendingTalentPoints);
    expect(snapshot(loaded)).toEqual(saved);
  });

  it('migrates version 27, refunds three removed ranks once and preserves cooldowns and streak progress', () => {
    const session = arena([{ id: 'killingStreak', rank: 5 }, ...lightning]);
    const saved = snapshot(session);
    const {
      lightningShieldTimer: _timer,
      lightningShieldAbsorption: _capacity,
      lightningShieldProcCooldown: _cooldown,
      masochismTimer: _masochism,
      ...oldState
    } = saved.state;
    const previous = {
      ...saved,
      version: 27,
      abilities: saved.abilities.slice(0, 13),
      talents: [
        ...saved.talents.filter(({ id }) => id !== 'killingStreak'),
        { id: 'killingStreak', rank: 8 },
      ],
      state: {
        ...oldState,
        killingStreakProgress: 5,
        lightningCharges: [true, ...Array(8).fill(false)],
      },
    };
    const parsed = parseSave(previous);
    expect(parsed?.version).toBe(28);
    const loaded = restore(parsed!, () => 0.999999);
    expect(loaded.talents.getRank('killingStreak')).toBe(5);
    expect(loaded.state.pendingTalentPoints).toBe(saved.state.pendingTalentPoints + 3);
    expect(loaded.state.killingStreakFraction).toBe(0.5);
    expect(loaded.state.lightningCharges).toEqual([1, ...Array(8).fill(0)]);
    expect(loaded.state.lightningShieldAbsorption).toBe(0);
    expect(loaded.state.masochismTimer).toBe(0);
    expect(snapshot(restore(parseSave(snapshot(loaded))!))).toEqual(snapshot(loaded));
  });

  it('round trips active buffs, depleted capacity, charges, response cooldown and pending lightning', () => {
    const session = arena([
      ...shield,
      ...lightning,
      { id: 'masochism', rank: 3 },
      { id: 'improvedLightning', rank: 2 },
    ]);
    session.state.hp = 100;
    breach(session, 1);
    session.activateAbility('lightningShield');
    const target = addSpider(session, 'megaFat', 5, 0.1);
    target.hits = 100;
    const second = addSpider(session, 'megaFat', 6, 0.1);
    second.hits = 100;
    breach(session, 10);
    session.tick(0.1);
    const saved = snapshot(session);
    const loaded = restore(parseSave(JSON.parse(JSON.stringify(saved)))!, () => 0.999999);
    expect(snapshot(loaded)).toEqual(saved);
    expect(loaded.state.stats.agility).toBe(session.state.stats.agility);
    loaded.tick(0.45);
    expect(loaded.state.spiders.get(second.id)?.hits).toBe(99);
  });

  it.each([
    { lightningShieldTimer: 181 },
    { lightningShieldAbsorption: -1 },
    { lightningShieldTimer: 1, lightningShieldAbsorption: 0 },
    { lightningShieldProcCooldown: 2.1 },
    { masochismTimer: 76 },
    { lightningCharges: Array(9).fill(3) },
    { lightningCharges: Array(9).fill(true) },
  ])('rejects malformed new effect state: %j', (patch) => {
    const saved = snapshot(arena(shield));
    expect(parseSave({ ...saved, state: { ...saved.state, ...patch } })).toBeNull();
  });
});
