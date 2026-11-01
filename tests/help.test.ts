import { describe, expect, it } from 'vitest';
import { helpContent, HELP_SECTIONS } from '../src/ui/helpContent.js';
import { ITEM_CATALOG } from '../src/content/items.js';
import { TALENTS } from '../src/content/talents.js';
import { SPIDERS } from '../src/content/spiders.js';
import { escapeHtml } from '../src/ui/presenters.js';

describe('first-time player handbook', () => {
  it('renders every reference section with all catalog entries and no unresolved values', () => {
    const help = helpContent();
    for (const [id] of HELP_SECTIONS) expect(help).toContain(`id="help-${id}"`);
    for (const { name } of [...ITEM_CATALOG, ...Object.values(TALENTS), ...Object.values(SPIDERS)])
      expect(help).toContain(escapeHtml(name));
    expect(help).not.toMatch(/undefined|NaN|\{[\w.]+\}/);
    expect(help).toContain('250%');
    expect(help).toContain('16%');
    expect(help).toContain('распределите первое очко');
  });
});
