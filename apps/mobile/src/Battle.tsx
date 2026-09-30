import { memo, useEffect, useReducer, useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Canvas, Picture, Skia } from '@shopify/react-native-skia';
import {
  ABILITIES,
  ABILITY_DISPLAY_ORDER,
  WORLD,
  activeDebuffs,
  formatSeconds,
  type AbilityId,
  type MobileGameController,
} from '@hvs/game';
import { colors, styles } from './theme';
import { Bar, Icon, svgImage } from './components';

const spiderArt = {
  normal: 'SpiderNormal',
  golden: 'SpiderGolden',
  megaFat: 'SpiderMegaFat',
  fat: 'SpiderFat',
  fast: 'SpiderFast',
  poisonous: 'SpiderPoisonous',
  ninja: 'SpiderNinja',
  burner: 'SpiderBurner',
  tank: 'SpiderTank',
};

const Field = memo(function Field({
  controller,
  reduced,
}: {
  controller: MobileGameController;
  reduced: boolean;
}) {
  const [, update] = useReducer((v: number) => v + 1, 0);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => controller.subscribeFrame(update), [controller]);
  const state = controller.state!;
  const recorder = Skia.PictureRecorder();
  const canvas = recorder.beginRecording();
  const paint = Skia.Paint();
  const rect = (x: number, y: number, w: number, h: number, color: string) => {
    paint.setColor(Skia.Color(color));
    canvas.drawRect(Skia.XYWHRect(x, y, Math.max(0, w), Math.max(0, h)), paint);
  };
  const illustration = (name: string, x: number, y: number, w: number, h: number) => {
    if (w <= 0 || h <= 0) return;
    const svg = svgImage(name);
    if (!svg) return;
    canvas.save();
    canvas.translate(x, y);
    canvas.drawSvg(svg, w, h);
    canvas.restore();
  };
  const laneWidth = size.width / WORLD.lanes;
  const fieldHeight = Math.max(0, size.height - 36);
  for (let lane = 0; lane < WORLD.lanes; lane++) {
    rect(
      lane * laneWidth,
      0,
      laneWidth - 1,
      fieldHeight,
      controller.heldLanes.has(lane) ? '#3a6249' : lane % 2 ? '#203b31' : '#1b342b',
    );
    rect(lane * laneWidth, fieldHeight, laneWidth - 1, 36, '#263c3d');
    illustration('Archer', lane * laneWidth + 3, fieldHeight, laneWidth - 6, 33);
    const cooldown = state.archers[lane].cooldownFraction;
    if (cooldown > 0) rect(lane * laneWidth, size.height - 3, laneWidth * cooldown, 3, colors.gold);
  }
  for (const spider of state.spiders.values()) {
    const spriteSize = Math.min(40, laneWidth - 3);
    const wobble =
      reduced || spider.dying || state.phase !== 'playing' ? 0 : Math.sin(spider.y * 120) * 1.5;
    const x = spider.lane * laneWidth + (laneWidth - spriteSize) / 2 + wobble;
    const y = spider.y * fieldHeight - spriteSize / 2;
    if (spider.slowFactor < 1) rect(x - 1, y, spriteSize + 2, spriteSize, '#467e9766');
    illustration(
      spiderArt[spider.type],
      x,
      y,
      spriteSize,
      spider.dying ? spriteSize * 0.45 : spriteSize,
    );
  }
  for (const arrow of state.arrows.values()) {
    const x = (arrow.lane + 0.5) * laneWidth;
    const y = arrow.y * fieldHeight;
    rect(x - 1, y, arrow.critical ? 3 : 2, 16, arrow.critical ? colors.gold : '#e9e1c2');
    rect(x - 3, y, 6, 3, '#e9e1c2');
  }
  for (const group of [3, 6]) rect(group * laneWidth - 1, 0, 2, fieldHeight, '#8f9f6e66');
  if (state.blizzardActive) rect(0, 0, size.width, fieldHeight, '#83d8ff22');
  if (state.armageddonPhase === 'firing') rect(0, 0, size.width, fieldHeight, '#ff823b44');
  if (state.isInvulnerable || state.lastHopeTimer > 0)
    rect(0, fieldHeight - 5, size.width, 5, state.isInvulnerable ? colors.gold : colors.blue);
  const picture = recorder.finishRecordingAsPicture();
  recorder.dispose();
  paint.dispose();
  useEffect(() => () => picture.dispose(), [picture]);
  return (
    <View
      style={{ flex: 1, minHeight: 140 }}
      onLayout={({ nativeEvent }) =>
        setSize({ width: nativeEvent.layout.width, height: nativeEvent.layout.height })
      }
    >
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        <Picture picture={picture} />
      </Canvas>
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: 1, left: 0, right: 0, flexDirection: 'row' }}
      >
        {state.archers.map((_, lane) => (
          <Text
            key={lane}
            maxFontSizeMultiplier={1}
            style={{
              flex: 1,
              textAlign: 'center',
              color: '#e8e5c5',
              fontSize: 10,
              backgroundColor: '#0c151977',
            }}
          >
            {lane + 1}
          </Text>
        ))}
      </View>
      {state.freezeActive && (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { alignItems: 'center', justifyContent: 'center', backgroundColor: '#1f4f7266' },
          ]}
        >
          <Text
            style={[
              styles.heading,
              { backgroundColor: colors.panel, padding: 12, borderRadius: 12 },
            ]}
          >
            Время заморожено
          </Text>
        </View>
      )}
      {state.armageddonPhase === 'charging' && (
        <Text style={battle.fieldNotice}>
          Армагеддон · {formatSeconds(state.armageddonTimer)} с
        </Text>
      )}
    </View>
  );
});

export function Battle({
  controller,
  leftHanded,
  reduced,
  onMenu,
  onAbilityInfo,
}: {
  controller: MobileGameController;
  leftHanded: boolean;
  reduced: boolean;
  onMenu: () => void;
  onAbilityInfo: (id: AbilityId) => void;
}) {
  const state = controller.state!;
  const debuffs = activeDebuffs(state);
  return (
    <View style={styles.page}>
      <View style={battle.hud}>
        <View style={styles.row}>
          <View style={{ flex: 1, gap: 4 }}>
            <View style={styles.between}>
              <Text maxFontSizeMultiplier={1.15} style={[styles.text, { fontWeight: '700' }]}>
                Уровень {state.level}
              </Text>
              <Text maxFontSizeMultiplier={1.15} style={styles.gold}>
                {state.coins} ● · {formatSeconds(state.levelTimer)} с
              </Text>
            </View>
            <View style={styles.row}>
              <Bar label="HP" value={state.hp} max={state.maxHp} color={colors.red} />
              <Bar label="ЭН" value={state.energy} max={state.maxEnergy} color={colors.blue} />
            </View>
          </View>
          <Pressable
            accessibilityLabel="Меню игры"
            accessibilityRole="button"
            onPress={onMenu}
            style={battle.menu}
          >
            <Text style={styles.heading}>☰</Text>
          </Pressable>
        </View>
        <Text numberOfLines={1} maxFontSizeMultiplier={1.1} style={styles.muted}>
          {debuffs.length
            ? debuffs.map((debuff) => `${debuff.name} ${formatSeconds(debuff.timer)}с`).join(' · ')
            : state.antiAfkStacks > 0
              ? `Бездействие: +${state.antiAfkDamagePercent}% урона · Серия ${state.killingStreakStacks}`
              : `Выстрел: ${state.currentShootCost} энергии · Серия: ${state.killingStreakStacks}`}
        </Text>
      </View>
      <Field controller={controller} reduced={reduced} />
      <View style={[battle.controls, { flexDirection: leftHanded ? 'row-reverse' : 'row' }]}>
        <View style={battle.controlHalf}>
          <Text style={battle.caption}>ЛУЧНИКИ</Text>
          <View style={battle.grid}>
            {state.archers.map((archer, lane) => (
              <View
                key={lane}
                accessible
                accessibilityRole="button"
                accessibilityLabel={`Стрелять по линии ${lane + 1}`}
                accessibilityState={{ disabled: state.phase !== 'playing' }}
                onTouchStart={() => controller.pressLane(lane)}
                onTouchEnd={() => controller.releaseLane(lane)}
                onTouchCancel={() => controller.releaseLane(lane)}
                onAccessibilityTap={() => {
                  controller.pressLane(lane);
                  controller.releaseLane(lane);
                }}
                style={[
                  battle.key,
                  controller.heldLanes.has(lane) && { backgroundColor: '#46664b' },
                  state.phase !== 'playing' && styles.disabled,
                ]}
              >
                {archer.cooldownFraction > 0 && (
                  <View
                    pointerEvents="none"
                    style={[battle.cooldown, { height: `${archer.cooldownFraction * 100}%` }]}
                  />
                )}
                <Text maxFontSizeMultiplier={1.2} style={battle.laneNumber}>
                  {lane + 1}
                </Text>
                <Text maxFontSizeMultiplier={1} style={battle.seconds}>
                  {archer.isReady ? '●' : formatSeconds(archer.remainingCooldown)}
                </Text>
              </View>
            ))}
          </View>
          <Text maxFontSizeMultiplier={1.1} style={[styles.muted, { marginTop: 5, fontSize: 10 }]}>
            Удерживайте для стрельбы
          </Text>
        </View>
        <View style={battle.controlHalf}>
          <Text style={battle.caption}>СПОСОБНОСТИ</Text>
          <View style={battle.grid}>
            {ABILITY_DISPLAY_ORDER.map((id) => {
              const definition = ABILITIES[id];
              const cooldown = state.getAbility(id);
              const unlocked = state.isAbilityUnlocked(id);
              const active =
                state.abilityActiveTimer(id) > 0 || (id === 'freeze' && state.freezeActive);
              return (
                <Pressable
                  key={id}
                  accessibilityRole="button"
                  accessibilityLabel={`${definition.name}${unlocked ? '' : ', недоступно'}`}
                  onPress={() => controller.ability(id)}
                  onLongPress={() => onAbilityInfo(id)}
                  delayLongPress={500}
                  style={({ pressed }) => [
                    battle.key,
                    !unlocked && styles.disabled,
                    active && { borderColor: colors.gold },
                    pressed && { opacity: 0.6 },
                  ]}
                >
                  <Icon name={definition.sprite} size={32} />
                  {!cooldown.isReady && (
                    <View
                      pointerEvents="none"
                      style={[battle.cooldown, { height: `${cooldown.cooldownFraction * 100}%` }]}
                    />
                  )}
                  <Text maxFontSizeMultiplier={1} style={battle.abilityNumber}>
                    {!unlocked
                      ? `${definition.unlockLevel} ур.`
                      : !cooldown.isReady
                        ? formatSeconds(cooldown.remainingCooldown)
                        : active
                          ? '◆'
                          : ''}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}
const battle = StyleSheet.create({
  hud: { paddingHorizontal: 10, paddingTop: 6, paddingBottom: 4, gap: 3 },
  menu: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderRadius: 12,
  },
  fieldNotice: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    color: colors.gold,
    backgroundColor: colors.bg,
    padding: 8,
    borderRadius: 10,
  },
  controls: {
    paddingHorizontal: 4,
    paddingTop: 5,
    paddingBottom: 7,
    gap: 4,
    backgroundColor: colors.panel,
  },
  controlHalf: { flex: 1 },
  caption: {
    fontSize: 9,
    color: colors.muted,
    letterSpacing: 1,
    marginBottom: 4,
    textAlign: 'center',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  key: {
    width: '31.5%',
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.raised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cooldown: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#050b12aa' },
  laneNumber: { color: colors.text, fontSize: 22, fontWeight: '800' },
  seconds: { fontSize: 8, color: colors.gold, position: 'absolute', right: 3, bottom: 1 },
  abilityNumber: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '800',
    position: 'absolute',
    bottom: 0,
    right: 2,
    textShadowColor: '#000',
    textShadowRadius: 3,
  },
});
