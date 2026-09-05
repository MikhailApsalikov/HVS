import { test, expect } from '@playwright/test';
import { GameSession } from '../../src/domain/GameSession.js';
import { Spider } from '../../src/domain/model/Spider.js';
import { snapshot } from '../../src/domain/save.js';

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
  await expect(page.locator('.game-tooltip')).toContainText('58.2');
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
  await page.locator('.catalog-grid [data-item="c001"]').hover();
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
  session.state.pendingTalentPoints = 2;
  session.state.initialTalentPick = false;
  session.talents.loadFromSave([
    { id: 'hunterMastery', rank: 4 },
    { id: 'endurance', rank: 3 },
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
  const rapidFire = page.locator('[data-talent-id="rapidFire"]');
  await expect(rapidFire).toHaveAttribute('aria-disabled', 'true');
  await rapidFire.hover();
  await expect(page.locator('.game-tooltip .action-unavailable')).toHaveText(
    'Вложено в ветку: 4 / 5',
  );
  await expect(page.locator('.game-tooltip .action-unavailable')).toHaveCSS(
    'color',
    'rgb(255, 115, 115)',
  );
  await page.locator('[data-talent-id="improvedAgility"]').click();
  await expect(rapidFire).toHaveAttribute('aria-disabled', 'false');
  await rapidFire.click();
  await expect(rapidFire).toContainText('1/7');
  await expect(page.locator('[data-branch="shooting"] .talent-branch__points')).toHaveText(
    'Вложено очков: 6',
  );
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
  await expect(tooltip).toContainText('Максимальное HP: +150');
  await expect(tooltip).toContainText('Восстановление HP/с: +1.1');
  await expect(tooltip).toContainText('Броня: +110');
  await page.locator('[data-stat="agility"]').hover();
  await expect(tooltip).toContainText('Перезарядка выстрела, с: -2%');
  await page.locator('[data-stat="intellect"]').focus();
  await expect(tooltip).toContainText('Максимальная энергия: +10');
  await expect(tooltip).toContainText('Восстановление HP: Лечение: +210');
  await page.locator('[data-stat="armor"]').hover();
  await expect(tooltip).toContainText('Снижение урона бронёй: 52.381%');
  await expect(tooltip).toContainText('Предел снижения бронёй: 75%');
  await page.screenshot({ path: 'test-results/attributes-armor.png' });
  await page.locator('[data-ability="volley"]').hover();
  await expect(tooltip.locator('.action-unavailable')).toHaveText('Требуется уровень 20');
  await expect(tooltip.locator('.action-unavailable')).toHaveCSS('color', 'rgb(255, 115, 115)');
});
