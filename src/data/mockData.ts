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
    weight: 50,
    meterage: 105,
    totalMeterage: 525,
    remaining: 320,
    shop: 'Пряжа.ru',
    orderNumber: 'ORD-2024-001',
    pricePerGram: 3.2,
    totalPrice: 800,
  },
  {
    id: 'y2',
    photo: 'https://images.unsplash.com/photo-1590439474324-30012ed6d324?w=300&h=300&fit=crop',
    name: 'Alpaca Silk',
    manufacturer: 'Garnstudio',
    article: '2040',
    composition: '70% альпака, 30% шёлк',
    color: 'Бежевый',
    weight: 50,
    meterage: 167,
    totalMeterage: 835,
    remaining: 500,
    shop: 'Клубок',
    orderNumber: 'ORD-2024-015',
    pricePerGram: 5.8,
    totalPrice: 1450,
  },
  {
    id: 'y3',
    photo: 'https://images.unsplash.com/photo-1601823984263-b87b59798b70?w=300&h=300&fit=crop',
    name: 'Cotton Soft',
    manufacturer: 'YarnArt',
    article: '3310',
    composition: '100% хлопок',
    color: 'Мятный',
    weight: 50,
    meterage: 160,
    totalMeterage: 480,
    remaining: 150,
    shop: 'Иголочка',
    orderNumber: 'ORD-2024-022',
    pricePerGram: 2.4,
    totalPrice: 360,
  },
  {
    id: 'y4',
    photo: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&h=300&fit=crop',
    name: 'Nordic Wool',
    manufacturer: 'Alize',
    article: '550',
    composition: '49% шерсть, 51% акрил',
    color: 'Серый меланж',
    weight: 100,
    meterage: 250,
    totalMeterage: 750,
    remaining: 600,
    shop: 'Пряжа.ru',
    orderNumber: 'ORD-2024-030',
    pricePerGram: 2.8,
    totalPrice: 840,
  },
  {
    id: 'y5',
    photo: 'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=300&h=300&fit=crop',
    name: 'Kid Mohair',
    manufacturer: 'Lang Yarns',
    article: '120',
    composition: '70% кид мохер, 30% шёлк',
    color: 'Пудровый',
    weight: 25,
    meterage: 210,
    totalMeterage: 630,
    remaining: 400,
    shop: 'Клубок',
    orderNumber: 'ORD-2024-042',
    pricePerGram: 8.0,
    totalPrice: 600,
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
      { yarnId: 'y1', folds: 1 }, // Merino Extra 105 м/100г × 1
      { yarnId: 'y5', folds: 1 }, // Kid Mohair 210 м/100г × 1
      // Расчёт: (105 × 210) / (105 + 210) = 22050 / 315 = 70 м/100г
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
      { yarnId: 'y2', folds: 2 }, // Alpaca Silk 167 м/100г × 2 = 83.5 м/100г
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
      { yarnId: 'y3', folds: 1 }, // Cotton Soft 160 м/100г × 1
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
      { yarnId: 'y4', folds: 2 }, // Nordic Wool 250 м/100г × 2 = 125 м/100г
      { yarnId: 'y5', folds: 1 }, // Kid Mohair 210 м/100г × 1
      // Расчёт: (125 × 210) / (125 + 210) = 26250 / 335 ≈ 78 м/100г
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
      { yarnId: 'y1', folds: 1 }, // 105 м/100г × 1
      { yarnId: 'y5', folds: 1 }, // 210 м/100г × 1
      // (105 × 210) / (105 + 210) = 70 м/100г
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
      { yarnId: 'y2', folds: 2 }, // 167 / 2 = 83.5 м/100г
      { yarnId: 'y4', folds: 1 }, // 250 м/100г × 1
      // (83.5 × 250) / (83.5 + 250) = 20875 / 333.5 ≈ 63 м/100г
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
  },
  {
    id: 'pat2',
    photos: [
      'https://images.unsplash.com/photo-1597478551555-c309424a4a68?w=400&h=300&fit=crop',
    ],
    pdfs: ['shawl_pattern.pdf'],
    name: 'Шаль ажурная "Снежинки"',
  },
  {
    id: 'pat3',
    photos: [],
    pdfs: ['socks_classic.pdf', 'heel_scheme.pdf'],
    name: 'Носки классические',
  },
];
