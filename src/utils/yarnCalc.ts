import { Yarn, YarnUsage } from '../types';

/**
 * Расчёт итоговой толщины (метража) сложенной нити.
 *
 * Формула для двух нитей: Р = (Р1 × Р2) ÷ (Р1 + Р2)
 * Для N нитей применяем последовательно.
 *
 * Если одна и та же пряжа в K сложений — сначала делим метраж на K,
 * потом складываем с другими через формулу.
 *
 * Пример: нить A (750 м/100г) × 2 + нить B (260 м/100г) × 1
 *   A в 2 сложения: 750 / 2 = 375 м/100г
 *   Итого: (375 × 260) / (375 + 260) ≈ 154 м/100г
 */
export function calcFoldedMeterage(yarnUsages: YarnUsage[], yarns: Yarn[]): number | null {
  if (yarnUsages.length === 0) return null;

  // Для каждого использования: если K сложений одной пряжи, то эффективный метраж = meterage / K
  const effectiveMeterages: number[] = [];

  for (const usage of yarnUsages) {
    const yarn = yarns.find((y) => y.id === usage.yarnId);
    if (!yarn) continue;
    const effective = yarn.meterage / usage.folds;
    effectiveMeterages.push(effective);
  }

  if (effectiveMeterages.length === 0) return null;
  if (effectiveMeterages.length === 1) return effectiveMeterages[0];

  // Применяем формулу последовательно
  let result = effectiveMeterages[0];
  for (let i = 1; i < effectiveMeterages.length; i++) {
    result = (result * effectiveMeterages[i]) / (result + effectiveMeterages[i]);
  }

  return Math.round(result);
}

/** Форматирование результата */
export function formatFoldedMeterage(yarnUsages: YarnUsage[], yarns: Yarn[]): string {
  const m = calcFoldedMeterage(yarnUsages, yarns);
  if (m === null) return '—';
  return `≈${m} м/100г`;
}
