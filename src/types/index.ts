export interface Yarn {
  id: string;
  photo: string;
  /** Служебное поле формы: НАСТОЯЩИЙ выбранный файл фото.
   * App загружает его в PocketBase как файл и сохраняет URL в photo. */
  photoFile?: File;
  name: string;
  manufacturer: string;
  article: string;
  composition: string;
  color: string;
  totalWeight: number; // общий вес бобины в граммах (константа)
  meterage: number; // метраж (м/100г)
  totalMeterage: number; // общий метраж бобины
  shop: string;
  orderNumber: string;
  pricePerGram: number;
  totalPrice: number;
  notes?: string;
}

export type ProjectStage = 'planned' | 'in_progress' | 'completed';

/** Использование конкретной пряжи с указанием количества сложений */
export interface YarnUsage {
  yarnId: string;
  folds: number; // число сложений этой пряжи
  consumed?: number; // расход в граммах (только для проектов)
}

export interface Project {
  id: string;
  photos: string[];
  /** Служебное поле формы: массив настоящих выбранных файлов (позиции = photos) */
  photosFiles?: (File | null)[];
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
  created?: string;
  yarnUsages: YarnUsage[];
  needleSize: number;
  photoBefore: string;
  /** Служебные поля форм: настоящие выбранные файлы (загружаются в PocketBase) */
  photoBeforeFile?: File;
  photoAfterFile?: File;
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
  /** Служебные поля формы: массивы настоящих выбранных файлов (позиции = photos/pdfs) */
  photosFiles?: (File | null)[];
  pdfsFiles?: (File | null)[];
  pdfs: string[];
  name: string;
  link?: string; // ссылка на схему/описание
}

export type Section = 'dashboard' | 'yarn' | 'projects' | 'samples' | 'patterns';
