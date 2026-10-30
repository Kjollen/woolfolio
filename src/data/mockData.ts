import { Yarn, Project, Sample, Pattern } from '../types';

export const mockYarns: Yarn[] = [
  {
    id: 'y1',
    photo: 'https://images.unsplash.com/photo-1582719508461-905c6737f1fd?w=300&h=300&fit=crop',
    name: 'Merino Extra',
    manufacturer: 'Drops',
    article: '1065',
    composition: '100% мериносовая шерсть',
    color: 'Тёмно-синий',
    totalWeight: 500,
    meterage: 105,
    totalMeterage: 525,
    shop: 'Пряжа.ru',
    orderNumber: 'ORD-2024-001',
    pricePerGram: 3.2,
    totalPrice: 1600,
  },
  {
    id: 'y2',
    photo: 'https://images.unsplash.com/photo-1590439474324-30012ed6d324?w=300&h=300&fit=crop',
    name: 'Alpaca Silk',
    manufacturer: 'Garnstudio',
    article: '2040',
    composition: '70% альпака, 30% шёлк',
    color: 'Бежевый',
    totalWeight: 500,
    meterage: 167,
    totalMeterage: 835,
    shop: 'Клубок',
    orderNumber: 'ORD-2024-015',
    pricePerGram: 5.8,
    totalPrice: 2900,
  },
  {
    id: 'y3',
    photo: 'https://images.unsplash.com/photo-1601823984263-b87b59798b70?w=300&h=300&fit=crop',
    name: 'Cotton Soft',
    manufacturer: 'YarnArt',
    article: '3310',
    composition: '100% хлопок',
    color: 'Мятный',
    totalWeight: 400,
    meterage: 160,
    totalMeterage: 640,
    shop: 'Иголочка',
    orderNumber: 'ORD-2024-022',
    pricePerGram: 2.4,
    totalPrice: 960,
  },
  {
    id: 'y4',
    photo: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&h=300&fit=crop',
    name: 'Nordic Wool',
    manufacturer: 'Alize',
    article: '550',
    composition: '49% шерсть, 51% акрил',
    color: 'Серый меланж',
    totalWeight: 1000,
    meterage: 250,
    totalMeterage: 2500,
    shop: 'Пряжа.ru',
    orderNumber: 'ORD-2024-030',
    pricePerGram: 2.8,
    totalPrice: 2800,
  },
  {
    id: 'y5',
    photo: 'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=300&h=300&fit=crop',
    name: 'Kid Mohair',
    manufacturer: 'Lang Yarns',
    article: '120',
    composition: '70% кид мохер, 30% шёлк',
    color: 'Пудровый',
    totalWeight: 200,
    meterage: 210,
    totalMeterage: 420,
    shop: 'Клубок',
    orderNumber: 'ORD-2024-042',
    pricePerGram: 8.0,
    totalPrice: 1600,
  },
];

export const mockProjects: Project[] = [
  {
    id: 'p1',
    photos: [
      'https://images.unsplash.com/photo-1586183187963-b488e5fba4e4?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=400&h=300&fit=crop',
    ],
    name: 'Свитер оверсайз',
    stage: 'in_progress',
    yarnUsages: [
      { yarnId: 'y1', folds: 1, consumed: 180 },
      { yarnId: 'y5', folds: 1, consumed: 50 },
    ],
    needleSize: 5,
    startDate: '2024-10-01',
    endDate: '',
    notes: 'Вяжу реглан сверху. Пока готово тело до пройм.',
  },
  {
    id: 'p2',
    photos: [
      'https://images.unsplash.com/photo-1597478551555-c309424a4a68?w=400&h=300&fit=crop',
    ],
    name: 'Шаль "Зимний вечер"',
    stage: 'completed',
    yarnUsages: [
      { yarnId: 'y2', folds: 2, consumed: 150 },
    ],
    needleSize: 3.5,
    startDate: '2024-08-15',
    endDate: '2024-09-20',
    notes: 'Схема из журнала. Получилась очень нежная.',
  },
  {
    id: 'p3',
    photos: [],
    name: 'Летний топ',
    stage: 'planned',
    yarnUsages: [
      { yarnId: 'y3', folds: 1, consumed: 0 },
    ],
    needleSize: 3,
    startDate: '',
    endDate: '',
    notes: 'Планирую начать летом. Нужен образец.',
  },
  {
    id: 'p4',
    photos: [
      'https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?w=400&h=300&fit=crop',
    ],
    name: 'Кардиган "Облако"',
    stage: 'in_progress',
    yarnUsages: [
      { yarnId: 'y4', folds: 2, consumed: 250 },
      { yarnId: 'y5', folds: 1, consumed: 80 },
    ],
    needleSize: 6,
    startDate: '2024-11-10',
    endDate: '',
    notes: 'Пушистый кардиган. Вяжу снизу вверх.',
  },
];

export const mockSamples: Sample[] = [
  {
    id: 's1',
    yarnUsages: [
      { yarnId: 'y1', folds: 1 },
      { yarnId: 'y5', folds: 1 },
    ],
    needleSize: 4,
    photoBefore: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&h=300&fit=crop',
    stitchesWidthBefore: 20,
    rowsHeightBefore: 28,
    measurementWidthBefore: 10,
    measurementHeightBefore: 10,
    photoAfter: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&h=300&fit=crop',
    stitchesWidthAfter: 22,
    rowsHeightAfter: 30,
    measurementWidthAfter: 10,
    measurementHeightAfter: 10,
  },
  {
    id: 's2',
    yarnUsages: [
      { yarnId: 'y2', folds: 2 },
      { yarnId: 'y4', folds: 1 },
    ],
    needleSize: 5,
    photoBefore: 'https://images.unsplash.com/photo-1590439474324-30012ed6d324?w=300&h=300&fit=crop',
    stitchesWidthBefore: 16,
    rowsHeightBefore: 22,
    measurementWidthBefore: 10,
    measurementHeightBefore: 10,
    photoAfter: 'https://images.unsplash.com/photo-1590439474324-30012ed6d324?w=300&h=300&fit=crop',
    stitchesWidthAfter: 18,
    rowsHeightAfter: 24,
    measurementWidthAfter: 10,
    measurementHeightAfter: 10,
  },
];

export const mockPatterns: Pattern[] = [
  {
    id: 'pat1',
    photos: [
      'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1586183187963-b488e5fba4e4?w=400&h=300&fit=crop',
    ],
    pdfs: ['pattern_sweater.pdf', 'scheme_raglan.pdf'],
    name: 'Реглан сверху — базовая схема',
    link: 'https://www.garnstudio.com/pattern.php?id=10005',
  },
  {
    id: 'pat2',
    photos: [
      'https://images.unsplash.com/photo-1597478551555-c309424a4a68?w=400&h=300&fit=crop',
    ],
    pdfs: ['shawl_pattern.pdf'],
    name: 'Шаль ажурная "Снежинки"',
    link: 'https://www.ravelry.com/patterns/library/snowflake-shawl',
  },
  {
    id: 'pat3',
    photos: [],
    pdfs: ['socks_classic.pdf', 'heel_scheme.pdf'],
    name: 'Носки классические',
  },
];

/**
 * Подсчёт суммарного расхода пряжи по всем проектам
 */
export function calcYarnConsumed(yarnId: string, projects: Project[]): number {
  let consumed = 0;
  for (const project of projects) {
    for (const usage of project.yarnUsages) {
      if (usage.yarnId === yarnId && usage.consumed) {
        consumed += usage.consumed;
      }
    }
  }
  return consumed;
}

/**
 * Подсчёт остатка пряжи = общий вес бобины - суммарный расход по всем проектам
 */
export function calcYarnRemaining(yarnId: string, totalWeight: number, projects: Project[]): number {
  return totalWeight - calcYarnConsumed(yarnId, projects);
}
