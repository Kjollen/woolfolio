export interface Yarn {
  id: string;
  photo: string;
  name: string;
  manufacturer: string;
  article: string;
  composition: string;
  color: string;
  weight: number; // вес в граммах
  meterage: number; // метраж (м/100г)
  totalMeterage: number; // общий метраж бобины
  remaining: number; // остаток в граммах
  shop: string;
  orderNumber: string;
  pricePerGram: number;
  totalPrice: number;
}

export type ProjectStage = 'planned' | 'in_progress' | 'completed';

/** Использование конкретной пряжи с указанием количества сложений */
export interface YarnUsage {
  yarnId: string;
  folds: number; // число сложений этой пряжи
}

export interface Project {
  id: string;
  photos: string[];
  name: string;
  stage: ProjectStage;
  yarnUsages: YarnUsage[]; // массив пряжа + сложения
  needleSize: number;
  startDate: string;
  endDate: string;
  notes: string;
}

export interface Sample {
  id: string;
  yarnUsages: YarnUsage[];
  needleSize: number;
  photoBefore: string;
  stitchesWidthBefore: number;
  rowsHeightBefore: number;
  measurementWidthBefore: number;
  measurementHeightBefore: number;
  photoAfter: string;
  stitchesWidthAfter: number;
  rowsHeightAfter: number;
  measurementWidthAfter: number;
  measurementHeightAfter: number;
}

export interface Pattern {
  id: string;
  photos: string[];
  pdfs: string[];
  name: string;
}

export type Section = 'yarn' | 'projects' | 'samples' | 'patterns';
