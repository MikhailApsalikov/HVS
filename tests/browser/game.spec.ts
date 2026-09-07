import { test, expect } from '@playwright/test';
import { GameSession } from '../../src/domain/GameSession.js';
import { Spider } from '../../src/domain/model/Spider.js';
import { snapshot } from '../../src/domain/save.js';

test('archer tooltip shows two-decimal cooldown with agility and rapid fire', async ({ page }) => {
  const session = new GameSession('normal');
  session.state.character.setBase('agility', 24);
  session.state.character.setModifiers('test:quiet', [
    { stat: 'spawnProbability', kind: 'percent', value: -100 },
  ]);
  session.talents.loadFromSave([{ id: 'rapidFire', rank: 2 }]);
  session.state.pendingTalentPoints = 0;
  session.confirmLevelUp();
  await page.addInitScript(
    (data) => localStorage.setItem('hvs_save', JSON.stringify(data)),
    snapshot(session),
  );
  const time = new Date('2026-09-07T12:00:00Z');
  await page.clock.install({ time });
  await page.clock.pauseAt(time);
  await page.goto('/');
  await page.getByRole('button', { name: 'Загрузить игру' }).click();
  await page.clock.runFor(20);
  const archer = page.locator('.archer-btn[data-lane="0"]');
  await archer.hover();
  await expect(page.locator('.game-tooltip')).toContainText('Лучник 1');
  await expect(page.locator('.game-tooltip')).toContainText('Перезарядка выстрела — 2.65 с.');
  await archer.click();
  await page.clock.runFor(2600);
  await expect(archer).toHaveClass(/--cooldown/);
  await page.clock.runFor(100);
  await expect(archer).not.toHaveClass(/--cooldown/);
});

test('new armor talents and tier-five healing can be learned and survive reload', async ({
  page,
}) => {
  test.slow(); // Eleven purchases, both layouts and a persisted game reload.
  const session = new GameSession('normal');
  session.state.level = 50;
  session.state.initialTalentPick = false;
  session.state.pendingTalentPoints = 11;
  session.talents.loadFromSave([
    { id: 'endurance', rank: 7 },
    { id: 'improvedEndurance', rank: 7 },
    { id: 'spiderArmor', rank: 10 },
    { id: 'shieldBlock', rank: 8 },
    { id: 'greed', rank: 3 },
  ]);
  session.state.character.setModifiers('test:quiet', [
    { stat: 'spawnProbability', kind: 'percent', value: -100 },
  ]);
  session.refreshStats();
  await page.addInitScript((data) => {
    if (!localStorage.getItem('hvs_save')) localStorage.setItem('hvs_save', JSON.stringify(data));
  }, snapshot(session));
  await page.goto('/');
  await page.getByRole('button', { name: 'Загрузить игру' }).click();
  const tooltip = page.locator('.game-tooltip');
  for (const [id, tier, name, amount, suffix] of [
    ['warriorArmor', 3, 'Броня воина', 80, ' единиц'],
    ['titanArmor', 6, 'Броня титана', 25, '%'],
  ] as const) {
    const button = page.locator(
      `[data-branch="defense"] [data-tier="${tier}"] [data-talent-id="${id}"]`,
    );
    await expect(button).toHaveAccessibleName(name);
    await expect(button.locator('svg')).toHaveCount(1);
    for (let rank = 1; rank <= 5; rank++) {
      await button.hover();
      await expect(tooltip.locator('.tooltip__rank--next')).toContainText(
        `Увеличивает броню на ${amount * rank}${suffix}.`,
      );
      await button.click();
      expect(session.upgradeTalent(id)).toBe(true);
      await expect(button).toContainText(`${rank}/5`);
    }
    await button.hover();
    await expect(tooltip.locator('.tooltip__rank--next')).toHaveCount(0);
    await expect(button).toHaveAttribute('aria-disabled', 'true');
  }
  const healing = page.locator(
    '[data-branch="defense"] [data-tier="5"] [data-talent-id="healBoost"]',
  );
  await healing.click();
  expect(session.upgradeTalent('healBoost')).toBe(true);
  await expect(healing).toContainText('1/15');
  for (const width of [1440, 960]) {
    await page.setViewportSize({ width, height: 900 });
    const positions = await page
      .locator('[data-branch="defense"] [data-tier="5"] [data-talent-id]')
      .evaluateAll((buttons) =>
        buttons.map((button) => ({
          id: button.getAttribute('data-talent-id'),
          x: button.getBoundingClientRect().x,
          y: button.getBoundingClientRect().y,
        })),
      );
    expect(new Set(positions.map(({ y }) => y)).size).toBe(1);
    expect(positions.sort((a, b) => a.x - b.x).map(({ id }) => id)).toEqual([
      'dutyBound',
      'bestDefense',
      'healBoost',
    ]);
  }
  await page.mouse.move(0, 0);
  await page.screenshot({ path: 'test-results/armor-talents.png' });
  await page.locator('[data-action="confirm"]').click();
  session.confirmLevelUp();
  await expect(page.locator('[data-stat="armor"]')).toHaveText(
    `Броня: ${session.state.stats.armor}`,
  );
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Загрузить игру' }).click();
  await expect(page.locator('[data-stat="armor"]')).toHaveText(
    `Броня: ${session.state.stats.armor}`,
  );
});

test('shop rejects duplicates with spare slots and permits buying again after sale', async ({
  page,
}) => {
  const session = new GameSession('normal');
  session.upgradeTalent('hunterArsenal');
  session.state.coins = 10000;
  await page.addInitScript((data) => {
    if (!localStorage.getItem('hvs_save')) localStorage.setItem('hvs_save', JSON.stringify(data));
  }, snapshot(session));
  await page.goto('/');
  await page.getByRole('button', { name: 'Загрузить игру' }).click();
  const item = page.locator('.catalog-grid [data-item="c001"]');
  await item.hover();
  await expect(page.locator('.game-tooltip')).not.toContainText(/Уникальн|только один/);
  await item.dblclick();
  await expect(item).toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator('.inventory-grid .item-btn--empty')).toHaveCount(1);
  const coins = await page.locator('.shop-panel__coins').textContent();
  await item.dispatchEvent('dblclick');
  await expect(page.locator('.inventory-grid [data-item="c001"]')).toHaveCount(1);
  await expect(page.locator('.shop-panel__coins')).toHaveText(coins!);
  await page.reload();
  await page.getByRole('button', { name: 'Загрузить игру' }).click();
  await expect(item).toHaveAttribute('aria-disabled', 'true');
  await page.locator('.inventory-grid [data-item="c001"]').dblclick();
  await expect(item).toHaveAttribute('aria-disabled', 'false');
  await item.dblclick();
  await page.locator('.catalog-grid [data-item="c003"]').dblclick();
  await expect(page.locator('.inventory-grid [data-item]')).toHaveCount(2);
});

test('both shield timers follow pause, reload and independent expiration without overlapping', async ({
  page,
}) => {
  const session = new GameSession('normal');
  session.state.level = 40;
  session.state.phase = 'playing';
  session.state.initialTalentPick = false;
  session.state.pendingTalentPoints = 0;
  session.talents.loadFromSave([
    { id: 'shieldBlock', rank: 1 },
    { id: 'lastHope', rank: 1 },
    { id: 'divineShield', rank: 1 },
  ]);
  session.state.character.setModifiers('test:quiet', [
    { stat: 'spawnProbability', kind: 'percent', value: -100 },
    { stat: 'maxEnergy', kind: 'flat', value: 900 },
    { stat: 'energyRegen', kind: 'percent', value: -100 },
  ]);
  session.refreshStats();
  session.state.energy = 1000;
  await page.addInitScript((data) => {
    if (!localStorage.getItem('hvs_save')) localStorage.setItem('hvs_save', JSON.stringify(data));
  }, snapshot(session));
  const time = new Date('2026-09-06T12:00:00Z');
  await page.clock.install({ time });
  await page.clock.pauseAt(time);
  await page.goto('/');
  await page.getByRole('button', { name: 'Загрузить игру' }).click();
  await page.clock.runFor(20);
  await page.locator('[data-ability="lastHope"]').click();
  await page.locator('[data-ability="stand"]').click();
  await page.clock.runFor(20);
  const lastHope = page.locator('.last-hope-overlay');
  const stand = page.locator('.stand-shield-overlay');
  await expect(lastHope.locator('.shield-overlay__timer')).toHaveText('6 с');
  await expect(stand.locator('.shield-overlay__timer')).toHaveText('7 с');
  await expect(lastHope).toHaveText('6 с');
  await expect(stand).toHaveText('7 с');
  await expect(page.locator('.shield-overlay__label')).toHaveCount(0);
  const firstBounds = (await stand.boundingBox())!;
  const secondBounds = (await lastHope.boundingBox())!;
  expect(firstBounds.y + firstBounds.height).toBeLessThanOrEqual(secondBounds.y);
  await page.mouse.move(0, 0);
  await page.screenshot({ path: 'test-results/both-shields-active.png' });
  await page.clock.runFor(2100);
  await page.keyboard.press('q');
  await page.clock.runFor(2000);
  await expect(lastHope.locator('.shield-overlay__timer')).toHaveText('4 с');
  await expect(stand.locator('.shield-overlay__timer')).toHaveText('5 с');
  await page.reload();
  await page.getByRole('button', { name: 'Загрузить игру' }).click();
  await page.clock.runFor(20);
  await expect(lastHope.locator('.shield-overlay__timer')).toHaveText('4 с');
  await expect(stand.locator('.shield-overlay__timer')).toHaveText('5 с');
  await page.keyboard.press('q');
  await page.clock.runFor(4000);
  await expect(lastHope).not.toHaveClass(/active/);
  await expect(stand.locator('.shield-overlay__timer')).toHaveText('1 с');
  await page.clock.runFor(1100);
  await expect(stand).not.toHaveClass(/active/);
});

test('new game, talents, shop, shooting, saving and reload work through the interface', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'HUNTERS VERSUS SPIDERS' })).toBeVisible();
  await page.getByRole('button', { name: 'Средний', exact: true }).click();
  const progression = page.locator('.level-up-screen');
  await expect(progression).toHaveClass(/visible/);
  await expect(page.getByRole('button', { name: 'Продолжить' })).toBeDisabled();
  await page.locator('[data-talent-id="endurance"]').click();
  await expect(page.locator('[data-talent-id="endurance"]')).toContainText('1/7');
  await page.locator('.catalog-grid [data-item="c001"]').dblclick();
  await expect(page.locator('.inventory-grid [data-item="c001"]')).toHaveCount(1);
  await page.locator('.inventory-grid [data-item="c001"]').dblclick();
  await expect(page.locator('.inventory-grid [data-item="c001"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Продолжить' }).click();
  await expect(progression).not.toHaveClass(/visible/);
  await expect(page.locator('.character-attributes')).toContainText('Интеллект: 16');
  await expect(page.locator('#hp-bar')).toContainText('525 / 525');
  await page.screenshot({ path: 'test-results/gameplay.png' });
  await page.keyboard.press('1');
  await expect(page.locator('.archer-btn[data-lane="0"]')).toHaveClass(/cooldown/);
  await page.locator('.archer-btn[data-lane="1"]').click();
  await expect(page.locator('.archer-btn[data-lane="1"]')).toHaveClass(/cooldown/);
  await page.clock.install({ time: new Date('2026-09-05T12:00:00Z') });
  await page.clock.pauseAt(new Date('2026-09-05T12:00:10Z'));
  await page.clock.runFor(20);
  const money = await page.locator('.coins-display__text').textContent();
  await page.reload();
  await page.getByRole('button', { name: 'Загрузить игру' }).click();
  await page.clock.runFor(20);
  await expect(page.locator('.game-screen')).toHaveClass(/screen--active/);
  await expect(page.locator('.coins-display__text')).toHaveText(money!);
  await expect(page.locator('#hp-bar')).toContainText('525 / 525');
  expect(errors).toEqual([]);
});

test('old saves, ability tooltips and Russian-layout freeze key work', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'hvs_save',
      JSON.stringify({
        version: 2,
        difficulty: 'normal',
        level: 50,
        hp: 400,
        energy: 100,
        coins: 123,
        pendingTalentPoints: 0,
        record: 50,
        talents: [{ id: 'quickInstinct', rank: 2 }],
        inventory: [],
      }),
    );
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Загрузить игру' }).click();
  await page.locator('[data-ability="prep"]').hover();
  await expect(page.locator('.game-tooltip')).toContainText('Перезарядка — 59 с');
  await page.evaluate(() =>
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'й', code: 'KeyQ', bubbles: true })),
  );
  await expect(page.locator('.freeze-overlay')).toHaveClass(/active/);
  const timer = await page.locator('#timer-bar').textContent();
  await page.waitForTimeout(150);
  await expect(page.locator('#timer-bar')).toHaveText(timer!);
  await page.keyboard.press('q');
  await expect(page.locator('.freeze-overlay')).not.toHaveClass(/active/);
  await page.keyboard.press('e');
  await expect(page.locator('[data-ability="prep"]')).toHaveClass(/cooldown/);
  await page.keyboard.press('i');
  await expect(page.locator('[data-ability="prep"]')).not.toHaveClass(/cooldown/);
});

test('all difficulties start and new games reset their state', async ({ page }) => {
  for (const label of ['Лёгкий', 'Сложный']) {
    await page.goto('/');
    await page.getByRole('button', { name: label, exact: true }).click();
    await expect(page.locator('[data-talent-id="endurance"]')).toContainText('0/7');
    await page.locator('[data-talent-id="endurance"]').click();
    await page.getByRole('button', { name: 'Продолжить' }).click();
    await expect(page.locator('.level-number')).toHaveText('Уровень 1');
  }
});

test('wave completion, next level, defeat and return to menu work', async ({ page }) => {
  const session = new GameSession('normal');
  session.upgradeTalent('hunterMastery');
  session.confirmLevelUp();
  session.state.levelTimer = 0.1;
  session.state.hp = 1;
  session.state.record = 10;
  const spider = new Spider(session.state.newId('spider'), 'normal', 0, 1, 500, 1, 0.2);
  spider.y = spider.previousY = 0.5;
  session.state.spiders.set(spider.id, spider);
  await page.addInitScript(
    (data) => localStorage.setItem('hvs_save', JSON.stringify(data)),
    snapshot(session),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Загрузить игру' }).click();
  await expect(page.locator('.level-up-screen')).toHaveClass(/visible/);
  await page.locator('[data-talent-id="tireless"]').click();
  await page.getByRole('button', { name: 'Продолжить' }).click();
  await expect(page.locator('.level-number')).toHaveText('Уровень 2');
  await expect(page.getByRole('heading', { name: 'ПОРАЖЕНИЕ', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'В меню', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Загрузить игру' })).toBeHidden();
  await page.getByRole('button', { name: 'Средний', exact: true }).click();
  await expect(page.locator('[data-talent-id="endurance"]')).toContainText('0/7');
  await expect(page.locator('.spider')).toHaveCount(0);
});

test('invalid saved data does not expose a broken load action', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('hvs_save', '{not-json'));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Загрузить игру' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Средний', exact: true })).toBeVisible();
});

test('shop restores coin icons and explains money and slot restrictions in red', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Средний', exact: true }).click();
  await expect(page.locator('.shop-panel__coins .coin-icon svg')).toBeVisible();
  await expect(page.locator('.shop-panel__coins .coin-amount > span').first()).toHaveText('100');
  await page.locator('.catalog-grid [data-item="c020"]').hover();
  const tooltip = page.locator('.game-tooltip');
  await expect(tooltip.locator('.coin-icon svg')).toBeVisible();
  await expect(tooltip.locator('.action-unavailable')).toHaveText('Недостаточно монет');
  await expect(tooltip.locator('.action-unavailable')).toHaveCSS('color', 'rgb(255, 115, 115)');
  await expect(tooltip).toContainText('Выносливость: +150');
  await expect(tooltip).not.toContainText('Максимальное HP');
  await page.locator('.catalog-grid [data-item="c001"]').dblclick();
  await page.locator('.catalog-grid [data-item="c021"]').hover();
  await expect(tooltip.locator('.action-unavailable')).toHaveText('Нет свободных слотов');
  await expect(tooltip.locator('.action-unavailable')).toHaveCSS('color', 'rgb(255, 115, 115)');
  await page.locator('.inventory-grid [data-item="c001"]').hover();
  await expect(tooltip).toContainText('Продажа: 16');
  await expect(tooltip.locator('.coin-icon svg')).toBeVisible();
  await page.screenshot({ path: 'test-results/talent-branches-shop.png' });
});

test('three branches unlock a tier only after enough points are spent in that branch', async ({
  page,
}) => {
  const session = new GameSession('normal');
  session.state.level = 10;
  session.state.pendingTalentPoints = 3;
  session.state.initialTalentPick = false;
  session.talents.loadFromSave([
    { id: 'hunterMastery', rank: 5 },
    { id: 'endurance', rank: 7 },
  ]);
  session.refreshStats();
  await page.addInitScript((data) => {
    if (!localStorage.getItem('hvs_save')) localStorage.setItem('hvs_save', JSON.stringify(data));
  }, snapshot(session));
  await page.goto('/');
  await page.getByRole('button', { name: 'Загрузить игру' }).click();
  await expect(page.locator('.talent-branch')).toHaveCount(3);
  await expect(page.locator('[data-branch="defense"]')).toContainText('Защита');
  await expect(page.locator('[data-branch="shooting"]')).toContainText('Стрельба');
  await expect(page.locator('[data-branch="magic"]')).toContainText('Магия');
  const hunterArsenal = page.locator(
    '[data-branch="magic"] [data-tier="1"] [data-talent-id="hunterArsenal"]',
  );
  await expect(hunterArsenal).toBeVisible();
  await expect(hunterArsenal).toHaveAttribute('aria-disabled', 'false');
  const rapidFire = page.locator('[data-talent-id="rapidFire"]');
  await expect(
    page.locator('.talent-tree__tier-label, .talent-branch__points, .talent-option__name'),
  ).toHaveCount(0);
  await expect(rapidFire).toHaveAttribute('aria-disabled', 'true');
  await rapidFire.hover();
  await expect(page.locator('.game-tooltip .action-unavailable')).toHaveText(
    'Вложено в ветку "Стрельба": 5/7',
  );
  await expect(page.locator('.game-tooltip .action-unavailable')).toHaveCSS(
    'color',
    'rgb(255, 115, 115)',
  );
  await rapidFire.dispatchEvent('click');
  await expect(rapidFire).toContainText('0/7');
  await expect(page.locator('.talent-panel__points')).toHaveText('Очков таланта: 3');
  await page.locator('[data-talent-id="improvedAgility"]').click();
  await expect(rapidFire).toHaveAttribute('aria-disabled', 'true');
  await rapidFire.hover();
  await expect(page.locator('.game-tooltip .action-unavailable')).toHaveText(
    'Вложено в ветку "Стрельба": 6/7',
  );
  await rapidFire.dispatchEvent('click');
  await expect(rapidFire).toContainText('0/7');
  await expect(page.locator('.talent-panel__points')).toHaveText('Очков таланта: 2');
  await page.locator('[data-talent-id="improvedAgility"]').click();
  await expect(rapidFire).toHaveAttribute('aria-disabled', 'false');
  await rapidFire.click();
  await expect(rapidFire).toContainText('1/7');
  await rapidFire.hover();
  await expect(page.locator('.game-tooltip')).toContainText('Вложено в ветку "Стрельба": 8/7');
  await expect(page.locator('.game-tooltip')).not.toContainText('Нет очков таланта');
  await page.reload();
  await page.getByRole('button', { name: 'Загрузить игру' }).click();
  await expect(rapidFire).toContainText('1/7');
  await page.getByRole('button', { name: 'Продолжить' }).click();
  await expect(page.locator('.level-number')).toHaveText('Уровень 11');
});

test('attributes are vertical and their hover and keyboard tooltips show current contributions', async ({
  page,
}) => {
  const session = new GameSession('normal');
  session.state.character.setBase('endurance', 55);
  session.state.character.setBase('agility', 24);
  session.state.character.setBase('intellect', 105);
  session.state.phase = 'paused';
  session.state.freezeActive = true;
  session.state.initialTalentPick = false;
  session.state.pendingTalentPoints = 0;
  session.refreshStats();
  await page.addInitScript(
    (data) => localStorage.setItem('hvs_save', JSON.stringify(data)),
    snapshot(session),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Загрузить игру' }).click();
  const rows = page.locator('.character-attribute');
  await expect(rows).toHaveText([
    'Выносливость: 55',
    'Ловкость: 24',
    'Интеллект: 105',
    'Броня: 110',
  ]);
  const bounds = await rows.evaluateAll((elements) =>
    elements.map((el) => ({
      y: el.getBoundingClientRect().y,
      bottom: el.getBoundingClientRect().bottom,
      x: el.getBoundingClientRect().x,
    })),
  );
  expect(new Set(bounds.map((rect) => rect.x)).size).toBe(1);
  for (let index = 1; index < bounds.length; index++)
    expect(bounds[index].y).toBeGreaterThanOrEqual(bounds[index - 1].bottom);
  const tooltip = page.locator('.game-tooltip');
  await page.locator('[data-stat="endurance"]').hover();
  await expect(tooltip).toContainText('Увеличивает максимальное здоровье на 150 единиц');
  await expect(tooltip).toContainText('Восстанавливает дополнительно 2.2 здоровья каждую секунду');
  await expect(tooltip).toContainText('Увеличивает броню на 110 единиц');
  await expect(tooltip).not.toContainText('силы блока');
  await expect(tooltip.locator('.tooltip__effect')).toHaveCount(4);
  await expect(tooltip).not.toContainText(/дополнительно 0\s/);
  await expect(tooltip).not.toContainText('на 0 с');
  await page.locator('[data-stat="agility"]').hover();
  await expect(tooltip).toContainText(
    'Сокращает перезарядку выстрела и увеличивает скорость стрел на 2%',
  );
  await expect(tooltip.locator('.tooltip__effect')).toHaveCount(2);
  await page.locator('[data-stat="intellect"]').focus();
  await expect(tooltip).toContainText('Увеличивает максимальный запас энергии на 10 единиц');
  await expect(tooltip).toContainText('«Лечение» восстанавливает на 210 здоровья больше');
  await expect(tooltip).toContainText('«Подготовка» восстанавливает на 105 энергии больше');
  await page.locator('[data-stat="armor"]').hover();
  await expect(tooltip).toHaveText('Снижает урон от пауков на 43.3%');
  await page.locator('#hp-bar').hover();
  await expect(tooltip).toContainText('Восстанавливается 2.2 в секунду');
  await expect(tooltip).not.toContainText('При успешном блоке');
  await expect(tooltip).toContainText('Общее снижение урона - 43.3%');
  await expect(tooltip).not.toContainText('Максимальное');
  await expect(tooltip).not.toContainText('Доля получаемого урона');
  await page.locator('#energy-bar').hover();
  await expect(tooltip).toContainText('Восстанавливается 9.05 в секунду');
  await expect(tooltip).not.toContainText('Максимальн');
  await expect(tooltip.locator('.tooltip__effect')).toHaveCount(1);
  await expect(tooltip).not.toContainText('0 энергии');
  await page.locator('#timer-bar').hover();
  await expect(tooltip).toContainText('Продержитесь до конца таймера, чтобы пройти уровень.');
  await expect(page.locator('#timer-bar')).toHaveText(/^\d+с \/ \d+с$/);
  await page.locator('.coins-display').hover();
  await expect(tooltip).toContainText('0.9 монет в секунду.');
  await page.locator('.archer-btn[data-lane="0"]').hover();
  await expect(tooltip).toContainText(
    'Выпускает стрелу, которая поражает первого паука на этой линии.',
  );
  await expect(tooltip).toContainText('Выстрел расходует 35 энергии.');
  await expect(tooltip).toContainText('Перезарядка выстрела — 2.94 с.');
  await expect(tooltip).not.toContainText(/скорост|длины поля/);
  await page.locator('[data-stat="armor"]').hover();
  await page.screenshot({ path: 'test-results/attributes-armor.png' });
  await page.locator('[data-ability="volley"]').hover();
  await expect(tooltip.locator('.action-unavailable')).toHaveText('Требуется уровень 20');
  await expect(tooltip.locator('.action-unavailable')).toHaveCSS('color', 'rgb(255, 115, 115)');
});

test('defense prerequisites, talent abilities and an active block survive reload through the UI', async ({
  page,
}) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const session = new GameSession('normal');
  session.state.level = 40;
  session.state.initialTalentPick = false;
  session.state.pendingTalentPoints = 17;
  session.talents.loadFromSave([
    { id: 'endurance', rank: 7 },
    { id: 'improvedEndurance', rank: 7 },
    { id: 'spiderArmor', rank: 6 },
  ]);
  session.state.character.setModifiers('test:quiet', [
    { stat: 'spawnProbability', kind: 'percent', value: -100 },
    { stat: 'energyRegen', kind: 'percent', value: -100 },
  ]);
  session.refreshStats();
  await page.addInitScript((data) => {
    if (!localStorage.getItem('hvs_save')) localStorage.setItem('hvs_save', JSON.stringify(data));
  }, snapshot(session));
  const time = new Date('2026-09-06T12:00:00Z');
  await page.clock.install({ time });
  await page.clock.pauseAt(time);
  await page.goto('/');
  await page.getByRole('button', { name: 'Загрузить игру' }).click();
  await page.clock.runFor(20);
  const talent = (id: string) => page.locator(`[data-talent-id="${id}"]`);
  const arrow = (to: string) => page.locator(`.talent-dependency[data-to="${to}"]`);
  const tooltip = page.locator('.game-tooltip');
  await expect(page.locator('[data-ability="stand"]')).toBeHidden();
  await expect(page.locator('[data-ability="lastHope"]')).toBeHidden();
  await expect(
    page.locator('[data-branch="defense"] [data-tier="4"] [data-talent-id="divineShield"]'),
  ).toBeVisible();
  await expect(
    page.locator('[data-branch="defense"] [data-tier="5"] [data-talent-id="dutyBound"]'),
  ).toHaveCount(1);
  await expect(talent('lastHope')).toHaveAttribute('aria-disabled', 'true');
  await expect(talent('improvedLastHope')).toHaveAttribute('aria-disabled', 'true');
  await talent('lastHope').hover();
  await expect(tooltip.locator('.action-unavailable')).toHaveText(
    'Требуется талант «Блок щитом»: ранг 8',
  );
  await expect(tooltip).toContainText('65');
  await talent('lastHope').dispatchEvent('click');
  await expect(talent('lastHope')).toContainText('0/1');
  await expect(arrow('lastHope')).toHaveAttribute('data-from', 'shieldBlock');
  await expect(arrow('lastHope')).toHaveAttribute('d', /^M /);
  await expect(arrow('lastHope')).not.toHaveClass(/--met/);
  await talent('shieldBlock').click();
  await talent('shieldBlock').hover();
  await expect(tooltip).toContainText('При блоке поглощает до 50 урона.');
  await expect(tooltip).not.toContainText(/Сжигание|после действия брони|не растёт с рангом/);
  await expect(talent('shieldBlock')).toContainText('1/8');
  await expect(tooltip).toContainText('с вероятностью 8%');
  await expect(arrow('lastHope')).not.toHaveClass(/--met/);
  for (let rank = 2; rank <= 7; rank++) await talent('shieldBlock').click();
  await expect(talent('shieldBlock')).toContainText('7/8');
  await expect(talent('lastHope')).toHaveAttribute('aria-disabled', 'true');
  await expect(arrow('lastHope')).not.toHaveClass(/--met/);
  await talent('lastHope').dispatchEvent('click');
  await expect(talent('lastHope')).toContainText('0/1');
  await talent('shieldBlock').click();
  await talent('shieldBlock').hover();
  await expect(tooltip).toContainText('с вероятностью 64%');
  await expect(talent('shieldBlock')).toContainText('8/8');
  await expect(arrow('lastHope')).toHaveClass(/--met/);
  await expect(talent('lastHope')).toHaveAttribute('aria-disabled', 'false');
  await talent('lastHope').click();
  await expect(arrow('improvedLastHope')).toHaveAttribute('data-from', 'lastHope');
  await expect(arrow('improvedLastHope')).toHaveClass(/--met/);
  await talent('improvedLastHope').click();
  await talent('divineShield').click();
  await expect(
    page.locator('[data-branch="defense"] [data-tier="1"] [data-talent-id="greed"]'),
  ).toBeVisible();
  await talent('hunterReward').hover();
  await expect(tooltip.locator('.action-unavailable')).toHaveText(
    'Требуется талант «Алчность»: ранг 5',
  );
  await expect(arrow('hunterReward')).toHaveAttribute('data-from', 'greed');
  await expect(arrow('hunterReward')).not.toHaveClass(/--met/);
  for (let rank = 1; rank <= 4; rank++) {
    await talent('hunterReward').dispatchEvent('click');
    await expect(talent('hunterReward')).toContainText('0/5');
    await talent('greed').click();
  }
  await expect(arrow('hunterReward')).not.toHaveClass(/--met/);
  await expect(talent('hunterReward')).toHaveAttribute('aria-disabled', 'true');
  await talent('greed').click();
  await talent('greed').hover();
  await expect(tooltip).toContainText('Увеличивает награду за убийство паука на 5 золота.');
  await expect(talent('greed')).toContainText('5/5');
  await expect(arrow('hunterReward')).toHaveClass(/--met/);
  await expect(talent('hunterReward')).toHaveAttribute('aria-disabled', 'false');
  await talent('hunterReward').click();
  await page.mouse.move(0, 0);
  await page.screenshot({ path: 'test-results/defense-talent-dependencies.png' });
  await page.getByRole('button', { name: 'Продолжить' }).click();
  await page.clock.runFor(20);
  await expect(page.locator('[data-ability="stand"]')).toBeVisible();
  await page.locator('[data-ability="stand"]').hover();
  await expect(tooltip).toContainText('Перезарядка — 180 с');
  await expect(tooltip).toContainText('Призывает силу света и делает вас неуязвимым на 7 секунд.');
  await expect(page.locator('[data-ability="lastHope"]')).toBeVisible();
  await expect(page.locator('[data-stat="blockChance"], [data-stat="blockPower"]')).toHaveCount(0);
  await page.keyboard.press('o');
  await page.clock.runFor(20);
  await expect(page.locator('[data-ability="lastHope"]')).toHaveClass(/--active/);
  await expect(page.locator('.last-hope-overlay')).toHaveClass(/active/);
  await expect(page.locator('.last-hope-overlay .shield-overlay__timer')).toHaveText('6 с');
  await page.locator('[data-ability="lastHope"]').hover();
  await expect(tooltip).toContainText(
    'На 6 секунд повышает вероятность блока на 30% и его силу на 20% от вашей выносливости.',
  );
  await expect(page.locator('#energy-bar')).toContainText('59 / 100');
  await page.clock.runFor(2000);
  await page.reload();
  await page.getByRole('button', { name: 'Загрузить игру' }).click();
  await page.clock.runFor(20);
  await expect(page.locator('[data-ability="lastHope"]')).toHaveClass(/--active/);
  await page.locator('[data-ability="lastHope"]').hover();
  await expect(tooltip).toContainText('Действует ещё');
  await expect(tooltip).toContainText('55');
  await page.screenshot({ path: 'test-results/last-hope-active.png' });
  await page.clock.runFor(4100);
  await expect(page.locator('[data-ability="lastHope"]')).not.toHaveClass(/--active/);
  await expect(page.locator('.last-hope-overlay')).not.toHaveClass(/active/);
  await expect(page.locator('[data-stat="blockChance"], [data-stat="blockPower"]')).toHaveCount(0);
  await page.locator('[data-ability="stand"]').click();
  await page.clock.runFor(20);
  await expect(page.locator('.stand-shield-overlay')).toHaveClass(/active/);
  await expect(page.locator('.stand-shield-overlay .shield-overlay__timer')).toHaveText('7 с');
  await page.mouse.move(0, 0);
  await page.screenshot({ path: 'test-results/divine-shield-active.png' });
  await page.clock.runFor(7100);
  await expect(page.locator('.stand-shield-overlay')).not.toHaveClass(/active/);
  expect(errors).toEqual([]);
});

test('talents describe the current and next rank, keep unique icons and fit three columns', async ({
  page,
}) => {
  test.setTimeout(60000);
  const session = new GameSession('normal');
  session.talents.loadFromSave([
    { id: 'endurance', rank: 2 },
    { id: 'improvedIntellect', rank: 7 },
  ]);
  session.refreshStats();
  await page.addInitScript(
    (data) => localStorage.setItem('hvs_save', JSON.stringify(data)),
    snapshot(session),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Загрузить игру' }).click();
  const tooltip = page.locator('.game-tooltip');
  await page.locator('[data-talent-id="hunterMastery"]').hover();
  await expect(tooltip.locator('p')).toHaveCount(1);
  await expect(tooltip.locator('.tooltip__rank--current')).toHaveCount(0);
  await expect(tooltip.locator('.tooltip__rank--next .tooltip__rank-label')).toHaveText(
    'При изучении',
  );
  await expect(tooltip).toContainText('Каждый выстрел лучника расходует на 2 энергии меньше.');
  await page.locator('[data-talent-id="volleyMastery"]').hover();
  await expect(tooltip).toContainText('Увеличивает число стрел «Залпа» на 1.');
  await expect(tooltip).not.toContainText(/отдельной линии|каждая стрела/i);
  await page.locator('[data-talent-id="magicArmor"]').hover();
  await expect(tooltip).toContainText('Каждые 5 полных единиц интеллекта дают 3 брони.');
  await page.locator('[data-talent-id="endurance"]').hover();
  await expect(tooltip.locator('p')).toHaveText([
    'Увеличивает максимальное здоровье на 850 единиц.',
    'Когда паук доходит до вас и наносит вам урон, вы получаете 6 энергии.',
    'Увеличивает максимальное здоровье на 1275 единиц.',
    'Когда паук доходит до вас и наносит вам урон, вы получаете 9 энергии.',
  ]);
  await expect(tooltip.locator('.tooltip__rank--current .tooltip__rank-label')).toHaveText(
    'Изучено · ранг 2',
  );
  await expect(tooltip.locator('.tooltip__rank--next .tooltip__rank-label')).toHaveText(
    'После улучшения · ранг 3',
  );
  await expect(tooltip.locator('.tooltip__rank--current .tooltip__rank-label')).toHaveCSS(
    'color',
    'rgb(232, 213, 183)',
  );
  await expect(tooltip.locator('.tooltip__rank--next .tooltip__rank-label')).toHaveCSS(
    'color',
    'rgb(149, 216, 170)',
  );
  await expect(tooltip).toContainText('Вложено в ветку "Защита": 2/0');
  await page.screenshot({ path: 'test-results/talent-next-rank.png' });
  await page.locator('[data-talent-id="endurance"]').click();
  await page.locator('[data-talent-id="endurance"]').hover();
  await expect(tooltip).not.toContainText('Нет очков таланта');
  await expect(tooltip).toContainText('Увеличивает максимальное здоровье на 1700 единиц');
  await page.locator('[data-talent-id="improvedIntellect"]').focus();
  await expect(tooltip.locator('p')).toHaveText('Увеличивает интеллект на 35%.');
  await expect(tooltip.locator('.tooltip__rank--next')).toHaveCount(0);
  for (const button of await page.locator('[data-talent-id]').all()) {
    await button.hover();
    await expect(tooltip.locator('p').first()).not.toBeEmpty();
    await expect(tooltip).not.toContainText('undefined');
    await expect(tooltip).not.toContainText('{');
  }
  const icons = await page
    .locator('.talent-btn__icon')
    .evaluateAll((elements) => elements.map((el) => el.innerHTML));
  expect(new Set(icons).size).toBe(icons.length);
  for (const width of [1440, 960]) {
    await page.setViewportSize({ width, height: 900 });
    const sizes = await page.locator('.talent-tree__tier-row').evaluateAll((rows) =>
      rows.map((row) => ({
        columns: getComputedStyle(row).gridTemplateColumns.split(' ').length,
        width: row.getBoundingClientRect().width,
        gap: parseFloat(getComputedStyle(row).columnGap),
        button: row.querySelector('.talent-btn')!.getBoundingClientRect().width,
      })),
    );
    for (const size of sizes) {
      expect(size.columns).toBe(3);
      expect(size.button).toBeLessThanOrEqual(60);
      expect(size.button * 3 + size.gap * 2).toBeLessThanOrEqual(size.width + 1);
    }
  }
});

test('divine shield gates its improvement and every dependency points down between icons', async ({
  page,
}) => {
  const session = new GameSession('normal');
  session.state.level = 40;
  session.state.initialTalentPick = false;
  session.state.pendingTalentPoints = 2;
  session.talents.loadFromSave([
    { id: 'endurance', rank: 7 },
    { id: 'improvedEndurance', rank: 7 },
    { id: 'spiderArmor', rank: 10 },
    { id: 'shieldBlock', rank: 4 },
  ]);
  session.refreshStats();
  await page.addInitScript(
    (data) => localStorage.setItem('hvs_save', JSON.stringify(data)),
    snapshot(session),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Загрузить игру' }).click();
  const improved = page.locator('[data-talent-id="dutyBound"]');
  const healing = page.locator(
    '[data-branch="defense"] [data-tier="5"] [data-talent-id="healBoost"]',
  );
  await expect(healing).toBeVisible();
  await expect(page.locator('[data-branch="magic"] [data-talent-id="healBoost"]')).toHaveCount(0);
  await improved.hover();
  await expect(page.locator('.game-tooltip .action-unavailable')).toHaveText(
    'Требуется талант «Божественный щит»: ранг 1',
  );
  await improved.dispatchEvent('click');
  await expect(improved).toContainText('0/5');
  await expect(page.locator('.talent-panel__points')).toHaveText('Очков таланта: 2');
  await page.locator('[data-talent-id="divineShield"]').click();
  await expect(improved).toHaveAttribute('aria-disabled', 'false');
  await improved.click();
  await expect(improved).toContainText('1/5');
  await expect(page.locator('.talent-dependency[data-to="dutyBound"]')).toHaveClass(/--met/);
  for (const width of [1440, 960]) {
    await page.setViewportSize({ width, height: 900 });
    await page.mouse.move(0, 0);
    const bounds = await page
      .locator('[data-branch="defense"] [data-tier="4"] [data-talent-id]')
      .evaluateAll((buttons) =>
        buttons.map((button) => ({
          id: button.getAttribute('data-talent-id'),
          x: button.getBoundingClientRect().x,
          y: button.getBoundingClientRect().y,
        })),
      );
    expect(new Set(bounds.map((rect) => rect.y)).size).toBe(1);
    expect(bounds.sort((a, b) => a.x - b.x).map((rect) => rect.id)).toEqual([
      'divineShield',
      'improvedLastHope',
    ]);
    await expect
      .poll(async () =>
        page.locator('.talent-dependency').evaluateAll((paths) =>
          paths.every((path) => {
            const branch = path.closest('.talent-branch')!;
            const from = branch
              .querySelector(`[data-talent-id="${path.getAttribute('data-from')}"]`)!
              .getBoundingClientRect();
            const to = branch
              .querySelector(`[data-talent-id="${path.getAttribute('data-to')}"]`)!
              .getBoundingClientRect();
            const bounds = branch.getBoundingClientRect();
            const values = path
              .getAttribute('d')!
              .match(/-?\d+(?:\.\d+)?/g)!
              .map(Number);
            const crossesTalent = [...branch.querySelectorAll('[data-talent-id]')].some(
              (button) => {
                const id = button.getAttribute('data-talent-id');
                if (id === path.getAttribute('data-from') || id === path.getAttribute('data-to'))
                  return false;
                const rect = button.getBoundingClientRect();
                const x = from.x + from.width / 2;
                return (
                  x > rect.left && x < rect.right && rect.bottom > from.bottom && rect.top < to.top
                );
              },
            );
            return (
              !crossesTalent &&
              Math.abs(from.x - to.x) < 1 &&
              values[1] > from.bottom - bounds.top &&
              values[4] < to.top - bounds.top &&
              values[4] > values[1]
            );
          }),
        ),
      )
      .toBe(true);
  }
  await page.screenshot({ path: 'test-results/healing-third-column.png' });
});

test('breaches display blocked damage, blue energy loss and larger tank damage', async ({
  page,
}) => {
  const session = new GameSession('normal');
  session.state.phase = 'paused';
  session.state.freezeActive = true;
  session.state.pendingTalentPoints = 0;
  session.state.initialTalentPick = false;
  session.state.character.setBase('endurance', 0);
  session.state.character.setModifiers('test:quiet', [
    { stat: 'maxHp', kind: 'flat', value: 900 },
    { stat: 'blockChance', kind: 'flat', value: 1 },
    { stat: 'blockPower', kind: 'flat', value: 20 },
    { stat: 'spawnProbability', kind: 'percent', value: -100 },
    { stat: 'hpRegen', kind: 'percent', value: -100 },
    { stat: 'energyRegen', kind: 'percent', value: -100 },
  ]);
  session.refreshStats();
  session.state.energy = 50;
  for (const [lane, type, damage] of [
    [0, 'normal', 39],
    [1, 'burner', 1],
    [2, 'tank', 390],
    [3, 'normal', 10],
  ] as const) {
    const spider = new Spider(session.state.newId('spider'), type, lane, 0.1, damage, 1, 0.2);
    spider.y = spider.previousY = 0.99;
    session.state.spiders.set(spider.id, spider);
  }
  await page.addInitScript(
    (data) => localStorage.setItem('hvs_save', JSON.stringify(data)),
    snapshot(session),
  );
  const time = new Date('2026-09-06T12:00:00Z');
  await page.clock.install({ time });
  await page.clock.pauseAt(time);
  await page.goto('/');
  await page.getByRole('button', { name: 'Загрузить игру' }).click();
  await page.clock.runFor(20);
  // Keep transient damage labels visible while their text, color and size are inspected.
  await page.addStyleTag({ content: '.damage-pop { animation-play-state: paused; }' });
  await page.keyboard.press('q');
  await page.clock.runFor(150);
  const normal = page.locator('.lane[data-lane="0"] .damage-pop--hp');
  const tank = page.locator('.lane[data-lane="2"] .damage-pop--hp');
  await expect(normal).toHaveText('-19 (блок 20)');
  await expect(tank).toHaveText('-370 (блок 20)');
  await expect(page.locator('.lane[data-lane="3"] .damage-pop--hp')).toHaveText('Блок');
  const energy = page.locator('.damage-pop--energy');
  await expect(energy).toHaveText('-50');
  await expect(energy).toHaveCSS('color', 'rgb(100, 181, 255)');
  await expect(page.locator('#energy-bar .resource-bar__fill')).toHaveCSS(
    'background-image',
    /rgb\(255, 183, 77\)/,
  );
  const fontSize = async (selector: typeof normal) =>
    selector.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(await fontSize(tank)).toBeCloseTo((await fontSize(normal)) * 1.5);
  await page.screenshot({ path: 'test-results/blocked-and-energy-damage.png' });
});
