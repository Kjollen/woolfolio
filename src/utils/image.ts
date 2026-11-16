// Утилиты для работы с изображениями в загрузчиках.
// Главная идея: НЕ хранить в состоянии React «сырой» base64 большого фото —
// это приводит к зависаниям UI и огромным payload'ам. Вместо этого фото
// сразу сжимается до разумного размера (по ширине и весу) и только потом
// попадает в форму как компактный data-URL.

const MAX_DIMENSION = 1600;   // максимальная ширина/высота сохраняемого фото
const TARGET_WEIGHT_KB = 800; // целевой размер файла (КБ) — достаточно для качества и быстрой загрузки

const readFileAsDataURL = (file: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('canvas.toBlob failed'))),
      type,
      quality
    );
  });

/**
 * Сжимает изображение (File/Blob/data-URL) и возвращает компактный data-URL.
 * PDF и прочие не-изображения возвращаются как есть (в base64 data-URL).
 */
export async function compressImageToDataUrl(source: File | Blob | string): Promise<string> {
  let blob: Blob;
  if (typeof source === 'string') {
    blob = await fetch(source).then((r) => r.blob());
  } else {
    blob = source;
  }

  // Не изображения (например, PDF) не сжимаем — просто конвертируем в data-URL
  if (!blob.type.startsWith('image/') || blob.type === 'image/svg+xml' || blob.type === 'image/gif') {
    return readFileAsDataURL(blob);
  }

  const originalDataUrl = await readFileAsDataURL(blob);
  const img = await loadImage(originalDataUrl);

  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const scale = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return originalDataUrl;
  ctx.drawImage(img, 0, 0, width, height);

  // Подбираем качество JPEG, пока размер не станет приемлемым
  const outType = 'image/jpeg';
  let quality = 0.85;
  let resultBlob = await canvasToBlob(canvas, outType, quality);
  while (resultBlob.size > TARGET_WEIGHT_KB * 1024 && quality > 0.4) {
    quality -= 0.15;
    resultBlob = await canvasToBlob(canvas, outType, quality);
  }

  // Если вдруг стало больше оригинала — берём оригинал
  if (resultBlob.size >= blob.size && typeof source !== 'string') {
    return originalDataUrl;
  }

  return readFileAsDataURL(resultBlob);
}
