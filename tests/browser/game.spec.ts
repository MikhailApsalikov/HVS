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
  await expect(page.locator('.character-attributes')).toContainText('Интеллект: 0');
  await expect(page.locator('#hp-bar')).toContainText('925 / 925');
  await page.screenshot({ path: 'test-results/gameplay.png' });
  await page.keyboard.press('1');
  await expect(page.locator('.archer-btn[data-lane="0"]')).toHaveClass(/cooldown/);
  await page.locator('.archer-btn[data-lane="1"]').click();
  await expect(page.locator('.archer-btn[data-lane="1"]')).toHaveClass(/cooldown/);
  const money = await page.locator('.coins-display__text').textContent();
  await page.reload();
  await page.getByRole('button', { name: 'Загрузить игру' }).click();
  await expect(page.locator('.game-screen')).toHaveClass(/screen--active/);
  await expect(page.locator('.coins-display__text')).toHaveText(money!);
  await expect(page.locator('#hp-bar')).toContainText('925 / 925');
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
