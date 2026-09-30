import { useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import {
  TALENTS,
  TALENT_BRANCHES,
  ITEM_CATALOG,
  ITEM_MAP,
  STATS,
  filterAndSortItems,
  itemStatLines,
  itemAbilityDescription,
  talentDescription,
  salePrice,
  formatStat,
  type MobileGameController,
  type TalentBranch,
  type TalentId,
  type ItemDefinition,
  type StatType,
  type StatId,
} from '@hvs/game';
import { generateItemSvg } from '@hvs/game/art';
import { colors, styles } from './theme';
import { Button, Icon } from './components';

export type Detail = {
  title: string;
  text: string;
  action?: { label: string; run: () => void; disabled?: boolean };
};
const statFilters: readonly (StatType | '')[] = [
  '',
  'endurance',
  'agility',
  'intellect',
  'armor',
  'hpRegen',
  'energyRegen',
  'maxEnergy',
  'energyPerKill',
  'coinsPerKill',
  'criticalShotChance',
];
const rarities: Record<string, string> = {
  common: colors.green,
  uncommon: colors.green,
  rare: colors.blue,
  epic: colors.purple,
  legendary: colors.gold,
};
const shownStats: readonly StatId[] = [
  'endurance',
  'agility',
  'intellect',
  'maxHp',
  'hpRegen',
  'maxEnergy',
  'energyRegen',
  'armor',
  'armorReduction',
  'shootCost',
  'shootCooldown',
  'criticalShotChance',
  'blockChance',
  'blockPower',
  'dodgeChance',
  'energyPerKill',
  'coinsPerKill',
  'coinsPerSec',
  'inventorySlots',
];

export function Progression({
  controller,
  showDetail,
  onMenu,
}: {
  controller: MobileGameController;
  showDetail: (detail: Detail) => void;
  onMenu: () => void;
}) {
  const [tab, setTab] = useState('Таланты');
  const [branch, setBranch] = useState<TalentBranch>('defense');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StatType | ''>('');
  const game = controller.game!;
  const state = game.state;
  const confirmBlocked =
    state.pendingTalentPoints > 0 && game.talents.hasAvailableUpgrades(state.level);
  const talentInfo = (id: TalentId) => {
    const definition = TALENTS[id];
    const talent = game.talents.getTalent(id);
    const prereq = definition.prerequisite;
    const text = [
      `Ранг ${talent.rank} / ${talent.maxRanks}`,
      talent.rank > 0 ? `Сейчас:\n${talentDescription(id, talent.rank, state.stats)}` : '',
      talent.rank < talent.maxRanks
        ? `Следующий ранг:\n${talentDescription(id, talent.rank + 1, state.stats)}`
        : '',
      `Требуется уровень ${talent.unlocksAtLevel}. Очки в ветке: ${game.talents.branchPoints(branch)} / ${talent.requiredBranchPoints}.`,
      prereq ? `Требуется «${TALENTS[prereq.id].name}», ранг ${prereq.rank}.` : '',
    ]
      .filter(Boolean)
      .join('\n\n');
    showDetail({
      title: definition.name,
      text,
      action: {
        label: 'Изучить за 1 очко',
        disabled: state.pendingTalentPoints === 0 || !game.talents.canUpgrade(id, state.level),
        run: () => controller.upgrade(id),
      },
    });
  };
  const itemInfo = (item: ItemDefinition, inventoryIndex?: number) => {
    const owned = inventoryIndex !== undefined;
    showDetail({
      title: item.name,
      text: [
        ...itemStatLines(item),
        itemAbilityDescription(item),
        owned ? `Продажа: ${salePrice(item.price)} монет` : `Цена: ${item.price} монет`,
        !owned && game.items.owns(item.id) ? 'Уже есть в инвентаре.' : '',
      ]
        .filter(Boolean)
        .join('\n'),
      action: {
        label: owned ? `Продать · ${salePrice(item.price)} ●` : `Купить · ${item.price} ●`,
        disabled: !owned && !game.items.canBuy(item.id, state.coins, state.stats.inventorySlots),
        run: () => {
          if (owned) controller.sell(inventoryIndex);
          else controller.buy(item.id);
        },
      },
    });
  };
  const inventory = game.items.inventory.map((id) => ITEM_MAP.get(id)!).filter(Boolean);
  const items =
    tab === 'Инвентарь'
      ? inventory
      : filterAndSortItems(ITEM_CATALOG, { name: search, stat: filter });
  return (
    <View style={styles.page}>
      <View style={[styles.content, { paddingBottom: 8 }]}>
        <View style={styles.between}>
          <View>
            <Text style={styles.heading}>
              {state.initialTalentPick ? 'Подготовка к охоте' : 'Передышка'}
            </Text>
            <Text style={styles.muted}>
              Уровень {state.level} · Очков: {state.pendingTalentPoints}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Меню"
            onPress={onMenu}
            style={styles.button}
          >
            <Text style={styles.gold}>{state.coins} ●</Text>
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
          {['Таланты', 'Магазин', 'Инвентарь', 'Герой'].map((name) => (
            <Pressable
              key={name}
              onPress={() => setTab(name)}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === name }}
              style={[
                styles.button,
                {
                  flex: 1,
                  paddingHorizontal: 3,
                  backgroundColor: tab === name ? colors.raised : colors.bg,
                },
              ]}
            >
              <Text style={[styles.muted, tab === name && styles.gold]}>{name}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      {tab === 'Таланты' ? (
        <>
          <View style={{ flexDirection: 'row', paddingHorizontal: 12, gap: 6 }}>
            {(Object.keys(TALENT_BRANCHES) as TalentBranch[]).map((id) => (
              <Pressable
                key={id}
                onPress={() => setBranch(id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: id === branch }}
                style={[
                  styles.button,
                  {
                    flex: 1,
                    paddingHorizontal: 4,
                    borderWidth: 1,
                    borderColor: id === branch ? colors.gold : colors.border,
                  },
                ]}
              >
                <Text style={styles.buttonText}>{TALENT_BRANCHES[id]}</Text>
              </Pressable>
            ))}
          </View>
          <ScrollView contentContainerStyle={styles.content}>
            {game.talents.talents
              .filter((talent) => talent.branch === branch)
              .map((talent) => {
                const definition = TALENTS[talent.id];
                const available =
                  state.pendingTalentPoints > 0 && game.talents.canUpgrade(talent.id, state.level);
                return (
                  <Pressable
                    key={talent.id}
                    accessibilityRole="button"
                    onPress={() => talentInfo(talent.id)}
                    style={[styles.card, available && { borderColor: colors.gold }]}
                  >
                    <View style={styles.row}>
                      <Icon name={definition.sprite} size={40} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.text}>{definition.name}</Text>
                        <Text style={styles.muted}>
                          Ранг {talent.rank}/{talent.maxRanks} · Уровень {talent.unlocksAtLevel}
                        </Text>
                      </View>
                      <Text style={available ? styles.gold : styles.muted}>
                        {available ? '+' : talent.rank >= talent.maxRanks ? '✓' : '›'}
                      </Text>
                    </View>
                    {definition.prerequisite && (
                      <Text style={styles.muted}>
                        ↳ {TALENTS[definition.prerequisite.id].name} ·{' '}
                        {definition.prerequisite.rank}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
          </ScrollView>
        </>
      ) : tab === 'Герой' ? (
        <ScrollView contentContainerStyle={styles.content}>
          {shownStats.map((id) => (
            <View key={id} style={[styles.card, styles.between]}>
              <Text style={[styles.text, { flex: 1 }]}>{STATS[id].label}</Text>
              <Text style={styles.gold}>{formatStat(id, state.stats[id])}</Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        <>
          {tab === 'Магазин' ? (
            <View style={{ paddingHorizontal: 16, gap: 8, paddingBottom: 8 }}>
              <TextInput
                accessibilityLabel="Поиск предмета"
                value={search}
                onChangeText={setSearch}
                placeholder="Название предмета"
                placeholderTextColor={colors.muted}
                style={styles.input}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 6 }}
              >
                {statFilters.map((id) => (
                  <Pressable
                    key={id}
                    onPress={() => setFilter(id)}
                    style={[
                      styles.button,
                      { borderWidth: 1, borderColor: id === filter ? colors.gold : colors.border },
                    ]}
                  >
                    <Text style={styles.muted}>{id ? STATS[id].label : 'Все характеристики'}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : (
            <Text style={[styles.muted, { paddingHorizontal: 16, paddingBottom: 8 }]}>
              Занято {game.items.inventorySize} из {state.stats.inventorySlots}
            </Text>
          )}
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={styles.muted}>
                {tab === 'Инвентарь' ? 'Инвентарь пока пуст.' : 'Предметы не найдены.'}
              </Text>
            }
            renderItem={({ item, index }) => (
              <Pressable
                accessibilityRole="button"
                onPress={() => itemInfo(item, tab === 'Инвентарь' ? index : undefined)}
                style={styles.card}
              >
                <View style={styles.row}>
                  <Icon name={`item:${item.id}`} xml={generateItemSvg(item)} size={44} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.text, { color: rarities[item.rarity] ?? colors.text }]}>
                      {item.name}
                    </Text>
                    <Text style={styles.muted}>{itemStatLines(item).join(' · ')}</Text>
                  </View>
                  <Text style={styles.gold}>
                    {tab === 'Инвентарь' ? salePrice(item.price) : item.price} ●
                  </Text>
                </View>
              </Pressable>
            )}
          />
        </>
      )}
      <View style={{ padding: 12, paddingTop: 6, gap: 5, backgroundColor: colors.panel }}>
        {confirmBlocked && (
          <Text style={[styles.muted, { textAlign: 'center' }]}>
            Распределите доступные очки талантов
          </Text>
        )}
        <Button
          title={state.initialTalentPick ? 'Начать охоту' : 'Следующий уровень'}
          primary
          disabled={confirmBlocked}
          onPress={() => controller.confirm()}
        />
      </View>
    </View>
  );
}
