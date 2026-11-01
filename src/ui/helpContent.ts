import { GameSession } from '../domain/GameSession.js';
import { WORLD, PIERCING_STRIKE } from '../domain/rules/world.js';
import {
  ANTI_AFK,
  ARMOR_RULES,
  ATTRIBUTE_RULES,
  DODGE_CAP,
  INITIAL_ASSISTANCE,
  PRIMARY_GROWTH,
  STATS,
  GOLDEN_SPIDER_REWARD,
} from '../domain/rules/stats.js';
import { salePrice } from '../domain/rules/economy.js';
import { DIFFICULTIES } from '../content/difficulties.js';
import { ABILITIES, ABILITY_ORDER } from '../content/abilities.js';
import { TALENTS, TALENT_ORDER, TALENT_TIER_RULES } from '../content/talents.js';
import { SPIDERS, SPECIAL_SPIDER_ORDER, spiderName } from '../content/spiders.js';
import { DEBUFFS } from '../content/debuffs.js';
import { ITEM_CATALOG } from '../content/items.js';
import type { SpiderType } from '../domain/types.js';
import {
  abilityDescription,
  descriptionParagraphs,
  escapeHtml,
  talentDescription,
} from './presenters.js';
import { itemAbilityDescription, itemStatLines } from './itemPresentation.js';

export const HELP_SECTIONS = [
  ['start', 'Первые шаги'],
  ['controls', 'Управление'],
  ['progress', 'Уровни и таланты'],
  ['resources', 'Ресурсы и характеристики'],
  ['combat', 'Бой и защита'],
  ['spiders', 'Все виды пауков'],
  ['effects', 'Баффы и дебаффы'],
  ['abilities', 'Способности'],
  ['talents', 'Все таланты'],
  ['items', 'Лавка и все предметы'],
  ['saves', 'Сохранение игры'],
] as const;
const percent = (value: number) => `${Number((value * 100).toFixed(4))}%`;
const paragraphs = (...lines: string[]) => descriptionParagraphs(lines.join('\n'));
const entry = (name: string, text: string) =>
  `<details class="help__entry"><summary>${escapeHtml(name)}</summary>${text}</details>`;
const difficultyNames = { easy: 'Лёгкая', normal: 'Средняя', hard: 'Тяжёлая' } as const;
const branchNames = { defense: 'Защита', shooting: 'Стрельба', magic: 'Магия' } as const;

function spiderEffect(type: SpiderType): string {
  switch (type) {
    case 'normal':
      return 'Не имеет особых эффектов.';
    case 'fat':
      return 'После первого обычного попадания становится обычным, сохраняя скорость и урон.';
    case 'megaFat':
      return 'После первой единицы силы стрелы становится толстым, после второй — обычным. Награда выдаётся только за убийство.';
    case 'golden':
      return `При убийстве даёт дополнительно ${GOLDEN_SPIDER_REWARD.base} + ${GOLDEN_SPIDER_REWARD.perLevel} × текущий уровень золота. При прорыве уменьшает пассивный доход на ${DEBUFFS.goldLock.incomePercentPerLevel} процентных пункта за каждый уровень начиная с ${SPIDERS.golden.unlockLevel}, максимум ${DEBUFFS.goldLock.maxIncomeReductionPercent}%, на ${DEBUFFS.goldLock.duration} с. Бонусное золото при прорыве не выдаётся.`;
    case 'fast':
      return `При прорыве ослабляет все виды лечения на ${DEBUFFS.healingReduction.healingPercentPerLevel}% за каждый уровень начиная с ${SPIDERS.fast.unlockLevel}, максимум ${DEBUFFS.healingReduction.maxHealingReductionPercent}%. Длительность: ${DEBUFFS.healingReduction.duration} + ${DEBUFFS.healingReduction.durationPerLevel} × текущий уровень секунд.`;
    case 'poisonous':
      return `Яд длится ${DEBUFFS.poison.duration} + ${DEBUFFS.poison.durationPerLevel} с за каждый уровень начиная с ${SPIDERS.poisonous.unlockLevel}. Каждые ${DEBUFFS.poison.interval} с наносит ${DEBUFFS.poison.damagePercent}% исходного урона отравивших пауков. До ${DEBUFFS.poison.maxStacks} последних отравлений; повторное обновляет время, сохраняя ритм урона. Каждый стак снижает броню на ${DEBUFFS.poison.armorPercentPerLevel}% за каждый уровень начиная с открытия, суммарно до ${DEBUFFS.poison.maxArmorReductionPercent}%. Яд оставляет хотя бы 1 здоровья.`;
    case 'cleanser':
      return 'При прорыве снимает временные усиления «Подготовка», «Блок последней надежды», «Адреналин», «Зоркость», «Награда охотника», «Щит молний» и «Мазохизм», даже при полном блоке. Уклонение и неуязвимость защищают от очищения. Эффекты «Череды убийств» сохраняются.';
    case 'ninja':
      return `Прыгает на соседние линии; число прыжков растёт за каждые ${SPIDERS.ninja.jumpLevelStep} уровней. С ${DEBUFFS.disorientation.unlockLevel}-го уровня при прорыве вызывает «Дезориентацию»: шанс блока снижен на ${DEBUFFS.disorientation.blockPercentPerLevel}% и вклад ловкости в уклонение — на ${DEBUFFS.disorientation.agilityDodgePercentPerLevel}% за каждый уровень начиная с открытия дебаффа, до ${DEBUFFS.disorientation.maxReductionPercent}%. Длительность ${DEBUFFS.disorientation.duration} с + ${DEBUFFS.disorientation.durationPerLevel} с за следующий уровень.`;
    case 'burner':
      return `При прорыве сжигает ${STATS.burnerEnergy.base} энергии плюс прирост за уровень, не больше текущего запаса. Количество показано в боевой подсказке. Броня и блок не уменьшают сжигание; уклонение и неуязвимость предотвращают его. Энергия за прорыв начисляется после сжигания.`;
    case 'tank':
      return 'Медленный паук с особенно сильным ударом. Умирает от одной единицы силы стрелы.';
    case 'diseased':
      return `Накладывает «Болезнь»: −${DEBUFFS.disease.energyPenalty} к восстановлению энергии в секунду, энергии за убийство и за прорыв. Длительность ${DEBUFFS.disease.duration} с на уровне ${SPIDERS.diseased.unlockLevel}, +${DEBUFFS.disease.durationPerLevel} с за каждый следующий уровень. Повторное наложение обновляет время без накопления штрафа.`;
    case 'cursing':
      return `Накладывает «Проклятие»: с шансом ${percent(DEBUFFS.curse.failureChance)} каждая стрела не вылетает, включая стрелы способностей и ответного залпа. Энергия расходуется, перезарядка запускается. Электрический заряд сохраняется, если стрела не вылетела. Длительность ${DEBUFFS.curse.duration} с на уровне ${SPIDERS.cursing.unlockLevel}, +${DEBUFFS.curse.durationPerLevel} с за каждый следующий уровень. Повторное наложение обновляет время без накопления штрафа.`;
  }
}

/** Reference values and descriptions come from the same definitions as the game. */
export function helpContent(): string {
  const session = new GameSession('normal', () => 0.5);
  const { state } = session;
  const content: Record<(typeof HELP_SECTIONS)[number][0], string> = {
    start:
      paragraphs(
        `Защищайте замок от пауков на ${WORLD.lanes} линиях. Лучники стоят внизу, пауки приближаются сверху. Уничтожайте их стрелами и способностями; дошедший паук атакует замок и исчезает. При нуле здоровья партия заканчивается. Победа — достижение ${WORLD.maxLevel}-го уровня с положительным здоровьем.`,
        'Выберите сложность в главном меню. Перед началом распределите первое очко талантов, при желании купите предметы, затем нажмите «Продолжить». Следите за линиями, энергией и временем уровня. Начинающему игроку полезны экономия энергии на выстрелах, восстановление ресурсов и защита.',
        'Наводите указатель на параметры, таланты, предметы, способности и значки эффектов: подсказки показывают актуальные значения вашей партии.',
      ) +
      Object.entries(DIFFICULTIES)
        .map(([id, config]) =>
          paragraphs(
            `${difficultyNames[id as keyof typeof difficultyNames]}: начальное золото ${config.startingCoins}; базовый доход ${config.coinsPerSec}/с. Начальная помощь восстанавливает здоровье и энергию и постепенно исчезает к ${INITIAL_ASSISTANCE.endLevel}-му уровню. На лёгкой она сильнее, броня эффективнее; на тяжёлой пауки быстрее и опаснее.`,
          ),
        )
        .join(''),
    controls: paragraphs(
      `Клавиши 1–${WORLD.lanes} стреляют по соответствующим линиям слева направо. Можно нажимать на лучников мышью. У каждого лучника собственная перезарядка, запас энергии общий.`,
      'Способности включаются клавишами, указанными на кнопках, или нажатием кнопки. Используются физические клавиши: русская раскладка не мешает. «Заморозка времени» ставит игру на паузу и снимает паузу повторным нажатием; обычные действия на паузе недоступны.',
      'Между уровнями выбирайте таланты и покупайте или продавайте предметы двойным нажатием. Наведение показывает подробности и требования.',
    ),
    progress: paragraphs(
      'Чтобы пройти уровень, продержитесь до конца его таймера. После уровня игра останавливается: вы получаете очко талантов, выбираете улучшения и можете посетить лавку. Следующий уровень начинается после подтверждения. Живые пауки и стрелы остаются на поле; старые пауки сохраняют свою скорость и урон, новые получают параметры нового уровня.',
      `У талантов три ветки: Защита, Стрельба и Магия. Каждый ранг стоит одно очко. Следующий тир открывается через ${TALENT_TIER_RULES.levelsPerTier} уровней и требует ещё ${TALENT_TIER_RULES.pointsPerTier} очков именно в своей ветке. Дополнительно могут требоваться конкретные ранги другого таланта. Свободные очки нужно распределить, пока доступны улучшения.`,
      'Переносы и новые требования не отнимают уже приобретённые таланты в старой партии; следующие покупки подчиняются действующим требованиям.',
    ),
    resources: paragraphs(
      `Здоровье — прочность замка; энергия тратится на выстрелы и способности. Базовые максимумы: ${STATS.maxHp.base} здоровья и ${STATS.maxEnergy.base} энергии. Восстановление идёт во время игры и останавливается на паузе и при выборе талантов. Превысить максимумы нельзя.`,
      `Каждый новый уровень даёт ${PRIMARY_GROWTH.endurance} выносливости, ${PRIMARY_GROWTH.agility} ловкости и ${PRIMARY_GROWTH.intellect} интеллекта. Предметы и таланты меняют итоговые характеристики, затем рассчитываются их вклады.`,
      `Выносливость: здоровье за каждую единицу сверх ${ATTRIBUTE_RULES.endurance.healthThreshold}, регенерация здоровья, броня, энергия за прорыв, доход и награда за убийство. Также сокращает уровень и усиливает изученные виды блока.`,
      `Ловкость: ускоряет выстрелы, «Залп» и «Прицельный огонь», повышает энергию за убийство. Сверх ${ATTRIBUTE_RULES.agility.dodgeThreshold} даёт уклонение, вклад ограничен ${percent(DODGE_CAP)}. После изучения критического выстрела повышает его шанс.`,
      `Интеллект: запас энергии за единицы сверх ${ATTRIBUTE_RULES.intellect.energyThreshold}, регенерация энергии, усиление лечения и «Подготовки». Сверх ${ATTRIBUTE_RULES.intellect.shieldAbsorptionThreshold} увеличивает поглощение «Щита молний». Таланты могут добавлять другие вклады характеристик.`,
      'Один талант даёт один суммарный бонус своего ранга. Линейные прибавки складываются, проценты разных талантов и предметов перемножаются. Сначала прибавляются положительные линейные бонусы, затем положительные проценты, отрицательные проценты, линейные штрафы; округление выполняется в конце. Параметры не уходят ниже нуля.',
    ),
    combat: paragraphs(
      'Обычная стрела имеет одну единицу силы. Критическая — две, улучшенная критическая — три. Стрела расходует силу на прочность пауков и продолжает полёт, если сила осталась. Обычный «Залп» не бывает критическим; «Прицельный огонь» использует критические стрелы по своим правилам. Убийства приносят золото и могут восстанавливать здоровье и энергию; ранение без убийства награды не даёт.',
      `Броня уменьшает входящий урон до ${percent(ARMOR_RULES.cap)}. Её эффективность зависит от сложности и уровня: на высоких уровнях для той же защиты нужно больше брони. Блок срабатывает по своему шансу и вычитает силу блока из урона после процентной защиты. При полном блоке здоровье не теряется. Уклонение предотвращает атаку; неуязвимость защищает от удара и его эффектов.`,
      `С ${PIERCING_STRIKE.unlockLevel}-го уровня каждый удар паука имеет ${percent(PIERCING_STRIKE.chancePerLevel)} шанса стать пробивающим, ещё столько же за каждый следующий уровень. Такой удар наносит ${percent(PIERCING_STRIKE.damageMultiplier)} исходного урона, затем действуют обычные защиты. Если он наносит урон, накладывается «Оглушение».`,
      `С ${ANTI_AFK.unlockLevel}-го уровня бездействие с полной энергией в течение ${ANTI_AFK.idleDuration} с при наличии живых пауков даёт +${ANTI_AFK.damagePerStack}% входящего урона; каждый прорыв добавляет столько же. Трата энергии прекращает рост, через ${ANTI_AFK.recoveryDuration} с снимает штраф. Повторное бездействие отменяет снятие. Бесплатные действия и сжигание энергии врагом не считаются тратой игрока. Подготовка, активные «Адреналин» и «Зоркость» приостанавливают отсчёт бездействия.`,
    ),
    spiders:
      paragraphs(
        'Пауки появляются независимо на каждой линии; занятой путь не мешает новым появлениям. Частота, скорость и урон растут с уровнем. Скорость и урон каждого паука получают отдельный случайный разброс. Ниже скорость и урон указаны относительно обычного паука до этого разброса.',
        'Шансы особых видов проверяются по очереди; выбирается первый успешный. Поэтому указанный шанс условный: предыдущие виды уже могли сработать. Обычный появляется, если все проверки особых видов не сработали.',
        `Порядок: ${SPECIAL_SPIDER_ORDER.map((id) => SPIDERS[id].name).join(' → ')} → ${SPIDERS.normal.name}.`,
      ) +
      (['normal', ...SPECIAL_SPIDER_ORDER] as const)
        .map((type) => {
          const spider = SPIDERS[type];
          const chance = state.rules.spiderTypeProbability(type, spider.unlockLevel);
          return entry(
            spiderName(type),
            paragraphs(
              `Открывается с уровня ${spider.unlockLevel}. ${type === 'normal' ? 'Шанс — остаток после особых видов.' : `Шанс при открытии ${percent(chance)}${spider.chanceGrowth ? `, +${spider.chanceGrowth.percent} процентный пункт за каждые ${spider.chanceGrowth.levels} уровней после открытия` : ', без роста'}.`} Скорость ${100 + spider.speedPercent}%, урон ${100 + spider.damagePercent}%, прочность ${spider.hits}.`,
              spiderEffect(type),
            ),
          );
        })
        .join(''),
    effects: paragraphs(
      'Баффы — временные усиления, дебаффы — ослабления. В бою они показаны отдельными рядами значков; наведите на значок, чтобы увидеть величину, оставшееся время и заряды. Дополнительные эффекты доступны в раскрывающемся списке.',
      'Дебафф паука накладывается, если его удар нанёс урон здоровью или поглощающему щиту. Полный блок, уклонение и неуязвимость защищают от наложения. Повторное наложение обычно обновляет время, а «Яд» дополнительно сохраняет стаки. Длительность рассчитывается по текущему уровню в момент прорыва.',
      '«Божественный щит», «Зоркость» и «Обучение на ошибках» снимают дебаффы согласно описаниям. «Устойчивость к ядам» сокращает их длительность. «Магическая броня» ослабляет эффекты и при полном сопротивлении делает невосприимчивым к ним, кроме «Оглушения». «Истощение» не снимается.',
      `«Оглушение» запрещает стрелять и блокировать, обнуляет энергию за убийства и прорывы. Длится ${DEBUFFS.stun.duration} с + ${DEBUFFS.stun.durationPerLevel} с за каждый уровень после ${PIERCING_STRIKE.unlockLevel}. Во время него доступны заморозка времени и способности, снимающие дебаффы пауков.`,
      'Остальные дебаффы описаны у соответствующих пауков, баффы — у способностей и талантов ниже. Все таймеры останавливаются на паузе и при выборе талантов.',
    ),
    abilities:
      paragraphs(
        'Ниже базовые значения для начала средней сложности. В вашей партии они пересчитываются с учётом характеристик, талантов и предметов. Заморозка открыта сразу; часть способностей открывается по уровню, часть требует покупки таланта.',
      ) +
      ABILITY_ORDER.map((id) =>
        entry(`${ABILITIES[id].key} · ${ABILITIES[id].name}`, abilityDescription(state, id)),
      ).join(''),
    talents:
      paragraphs(
        'Справочник содержит каждый талант. Для каждого указаны требования и эффекты первого и последнего ранга. Проценты за ранги одного таланта суммируются, бонусы разных талантов — независимые источники.',
      ) +
      TALENT_ORDER.map((id) => {
        const talent = session.talents.getTalent(id);
        const prerequisite = TALENTS[id].prerequisite;
        return entry(
          `${branchNames[talent.branch]} · ${TALENTS[id].name}`,
          paragraphs(
            `Уровень ${talent.unlocksAtLevel}, тир ${talent.tier}, вложено в ветку ${talent.requiredBranchPoints} очков. Всего рангов: ${talent.maxRanks}.${prerequisite ? ` Требуется «${TALENTS[prerequisite.id].name}», ранг ${prerequisite.rank}.` : ''}`,
            `Ранг 1: ${talentDescription(id, 1, state.stats)}`,
            ...(talent.maxRanks > 1
              ? [`Ранг ${talent.maxRanks}: ${talentDescription(id, talent.maxRanks, state.stats)}`]
              : []),
          ),
        );
      }).join(''),
    items:
      paragraphs(
        `Лавка доступна перед началом и между уровнями. Предмет покупается и продаётся двойным нажатием. Можно носить один экземпляр каждого предмета; все разные предметы действуют одновременно, включая улучшения одной способности. Число мест ограничено и увеличивается «Арсеналом охотника». Продажа возвращает ${percent(WORLD.saleFactor)} полной цены с округлением вниз, скидки покупки не уменьшают цену продажи.`,
        'Все параметры и модификации купленного предмета активны. «Рациональность» усиливает их, «Воля к победе» уменьшает цену покупки. Бонусы к блоку, критическому выстрелу и огненному взрыву требуют изучения соответствующего таланта. Легендарные предметы с отрицательными бонусами также применяют свои штрафы.',
        'Каталог показывает полные цены до скидок и бонусы до усиления «Рациональностью».',
      ) +
      ITEM_CATALOG.map((item) =>
        entry(
          item.name,
          paragraphs(
            `Покупка: ${item.price} золота. Продажа: ${salePrice(item.price)} золота.`,
            ...itemStatLines(item),
            ...(itemAbilityDescription(item) ? [itemAbilityDescription(item)!] : []),
          ),
        ),
      ).join(''),
    saves: paragraphs(
      'Игра сохраняется автоматически в этом браузере. «Загрузить игру» появляется в главном меню, если есть сохранение. Продолжение восстанавливает прогресс, поле, ресурсы, предметы, таланты и таймеры. Пауза и время вне игры не продвигают бой.',
      'Новая партия заменяет текущую. Сохранения разных браузеров и устройств не синхронизируются; очистка данных сайта удаляет локальное сохранение.',
    ),
  };
  return HELP_SECTIONS.map(
    ([id, title]) =>
      `<section id="help-${id}" class="help__section"><h2>${title}</h2>${content[id]}</section>`,
  ).join('');
}
