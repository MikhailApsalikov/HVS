import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  BackHandler,
  Modal,
  ScrollView,
  StatusBar,
  Switch,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  ABILITIES,
  MobileGameController,
  MobileSaveStore,
  MusicTrack,
  abilityEffectDescription,
  abilityUsageDescription,
  type AbilityId,
  type Difficulty,
} from '@hvs/game';
import { Battle } from './Battle';
import { Progression, type Detail } from './Progression';
import { MobileAudio } from './audio';
import { Button, Icon } from './components';
import { colors, styles } from './theme';

const audio = new MobileAudio();
const controller = new MobileGameController(new MobileSaveStore(AsyncStorage), (event) =>
  audio.feedback(event),
);
const defaults = { effects: true, music: true, leftHanded: false, reduced: false };
type Settings = typeof defaults;
const settingsKey = 'hvs.android.settings';

function Game() {
  const [, update] = useReducer((v: number) => v + 1, 0);
  const [menu, setMenu] = useState(true);
  const [settings, setSettings] = useState<Settings>(defaults);
  const [detail, setDetail] = useState<Detail | null>(null);
  const detailOpen = useRef(false);
  const resumeAfterDetail = useRef(false);
  const foreground = useRef(AppState.currentState === 'active');
  useEffect(() => controller.subscribe(update), []);
  useEffect(() => {
    void controller.initialize();
    void AsyncStorage.getItem(settingsKey)
      .then((raw) => {
        if (!raw) return;
        const parsed = JSON.parse(raw);
        const loaded = Object.fromEntries(
          Object.entries(defaults).map(([key, fallback]) => [
            key,
            typeof parsed?.[key] === 'boolean' ? parsed[key] : fallback,
          ]),
        ) as Settings;
        setSettings(loaded);
        audio.configure(loaded.effects, loaded.music);
      })
      .catch(() => {});
    audio.playMusic(MusicTrack.MAIN_MENU);
    let frame = 0;
    const render = (time: number) => {
      controller.frame(time);
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    const lifecycle = AppState.addEventListener('change', (state) => {
      foreground.current = state === 'active';
      if (state !== 'active') {
        resumeAfterDetail.current = false;
        controller.suspend();
        audio.pause();
        setMenu(true);
      }
    });
    const focus = AppState.addEventListener('blur', () => {
      // Our own Android Modal also takes window focus; progression commands must stay available.
      if (detailOpen.current) return;
      resumeAfterDetail.current = false;
      controller.suspend();
      audio.pause();
      setMenu(true);
    });
    return () => {
      cancelAnimationFrame(frame);
      lifecycle.remove();
      focus.remove();
      controller.suspend();
      audio.pause();
    };
  }, []);
  const openMenu = useCallback(() => {
    controller.suspend();
    setMenu(true);
  }, []);
  useEffect(() => {
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!menu) {
        openMenu();
        return true;
      }
      return false;
    });
    return () => back.remove();
  }, [menu, openMenu]);
  const changeSetting = (key: keyof Settings, value: boolean) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    audio.configure(next.effects, next.music);
    void AsyncStorage.setItem(settingsKey, JSON.stringify(next)).catch(() => {});
  };
  const start = (difficulty: Difficulty) => {
    const run = () => {
      audio.resume();
      controller.start(difficulty);
      setMenu(false);
    };
    if (controller.state && controller.state.phase !== 'gameOver')
      Alert.alert('Начать заново?', 'Текущая партия будет заменена. Рекорд сохранится.', [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Новая игра', style: 'destructive', onPress: run },
      ]);
    else run();
  };
  const resume = () => {
    audio.resume();
    controller.resume();
    setMenu(false);
  };
  const showDetail = (next: Detail) => {
    detailOpen.current = true;
    setDetail(next);
  };
  const showAbility = (id: AbilityId) => {
    resumeAfterDetail.current = !controller.suspended;
    controller.suspend();
    const state = controller.state!;
    showDetail({
      title: ABILITIES[id].name,
      text: `${abilityEffectDescription(id, state.stats)}\n\n${abilityUsageDescription(id, state.stats)}\nДоступно с уровня ${ABILITIES[id].unlockLevel}${ABILITIES[id].talent ? '\nТребуется соответствующий талант.' : ''}`,
    });
  };
  const closeDetail = () => {
    detailOpen.current = false;
    setDetail(null);
    if (resumeAfterDetail.current && foreground.current) controller.resume();
    resumeAfterDetail.current = false;
  };
  const state = controller.state;
  const canContinue = !!state && state.phase !== 'gameOver';
  return (
    <SafeAreaView style={styles.page} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" />
      {!controller.ready ? (
        <View style={[styles.page, { alignItems: 'center', justifyContent: 'center', gap: 16 }]}>
          <ActivityIndicator color={colors.gold} />
          <Text style={styles.text}>Готовим охоту…</Text>
        </View>
      ) : menu || !state ? (
        <ScrollView contentContainerStyle={[styles.content, { paddingTop: 32 }]}>
          <View style={{ alignItems: 'center', gap: 8, paddingBottom: 16 }}>
            <Icon name="Archer" size={72} />
            <Text style={[styles.muted, { letterSpacing: 3 }]}>HUNTERS VERSUS SPIDERS</Text>
            <Text style={styles.title}>Держи оборону</Text>
            <Text style={styles.muted}>Девять лучников. Один замок.</Text>
            <Text style={styles.gold}>
              Рекорд: {Math.max(controller.saves.record, state?.record ?? 0)}
            </Text>
          </View>
          {canContinue && (
            <Button title={`Продолжить · уровень ${state.level}`} primary onPress={resume} />
          )}
          {controller.saves.lastError && (
            <Text style={{ color: colors.red }}>{controller.saves.lastError}</Text>
          )}
          <View style={styles.card}>
            <Text style={styles.heading}>Новая охота</Text>
            {(
              [
                ['easy', 'Лёгкая'],
                ['normal', 'Обычная'],
                ['hard', 'Сложная'],
              ] as const
            ).map(([id, title]) => (
              <Button
                key={id}
                title={title}
                disabled={controller.saves.readOnly}
                onPress={() => start(id)}
              />
            ))}
          </View>
          <View style={styles.card}>
            <Text style={styles.heading}>Настройки</Text>
            {(
              [
                ['music', 'Музыка'],
                ['effects', 'Звуки'],
                ['leftHanded', 'Стрельба справа'],
                ['reduced', 'Меньше движения'],
              ] as const
            ).map(([key, title]) => (
              <View key={key} style={styles.between}>
                <Text style={styles.text}>{title}</Text>
                <Switch
                  accessibilityLabel={title}
                  value={settings[key]}
                  onValueChange={(value) => changeSetting(key, value)}
                  trackColor={{ false: colors.border, true: '#538669' }}
                  thumbColor={colors.gold}
                />
              </View>
            ))}
          </View>
          <View style={styles.card}>
            <Text style={styles.heading}>Как играть</Text>
            <Text style={styles.text}>
              Пауки спускаются сверху. Кнопки 1–9 управляют лучниками слева направо. Удерживайте
              кнопку для повторных выстрелов. Способности находятся рядом; удерживайте их кнопку,
              чтобы прочитать описание.
            </Text>
            <Text style={styles.muted}>
              Между уровнями распределяйте таланты и покупайте предметы. Игра сохраняется на этом
              телефоне. При сворачивании время останавливается.
            </Text>
          </View>
          <Button
            title="О данных приложения"
            onPress={() =>
              showDetail({
                title: 'Ваши данные',
                text: 'Игра работает офлайн. Партия, рекорд и настройки хранятся на этом устройстве. В приложении нет регистрации, рекламы и аналитики. Прогресс не синхронизируется с Web. При удалении приложения локальные данные могут быть удалены.\n\nЭто предварительная Android-сборка для проверки игры.',
              })
            }
          />
          <Text style={[styles.muted, { textAlign: 'center' }]}>
            Android · предварительная версия 0.1.0
          </Text>
        </ScrollView>
      ) : state.phase === 'gameOver' ? (
        <View style={[styles.content, { flex: 1, justifyContent: 'center' }]}>
          <Text style={styles.title}>Оборона пала</Text>
          <Text style={styles.text}>Достигнут уровень {state.level}</Text>
          <Text style={styles.gold}>Рекорд: {state.record}</Text>
          <Button primary title="Ещё одна охота" onPress={() => start(state.difficulty)} />
          <Button title="В меню" onPress={openMenu} />
        </View>
      ) : state.phase === 'levelUp' ? (
        <Progression controller={controller} showDetail={showDetail} onMenu={openMenu} />
      ) : (
        <Battle
          controller={controller}
          leftHanded={settings.leftHanded}
          reduced={settings.reduced}
          onMenu={openMenu}
          onAbilityInfo={showAbility}
        />
      )}
      {!menu && controller.saves.lastError && (
        <Text
          accessibilityRole="alert"
          style={{ color: colors.red, backgroundColor: colors.bg, padding: 6 }}
        >
          {controller.saves.lastError}
        </Text>
      )}
      <Modal visible={!!detail} transparent animationType="slide" onRequestClose={closeDetail}>
        <View style={styles.overlay}>
          <SafeAreaView edges={['bottom']} style={styles.sheet}>
            <Text style={styles.heading}>{detail?.title}</Text>
            <ScrollView>
              <Text style={styles.text}>{detail?.text}</Text>
            </ScrollView>
            {detail?.action && (
              <Button
                primary
                title={detail.action.label}
                disabled={detail.action.disabled}
                onPress={() => {
                  detail.action!.run();
                  closeDetail();
                }}
              />
            )}
            <Button title="Закрыть" onPress={closeDetail} />
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <Game />
    </SafeAreaProvider>
  );
}
