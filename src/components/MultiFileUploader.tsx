import React, { useRef, useState } from 'react';
import { compressImageToDataUrl } from '../utils/image';

interface Props {
  values: string[];
  onChange: (values: string[]) => void;
  /** Необязательный колбэк: отдаёт наружу НАСТОЯЩИЕ выбранные файлы
   * (позиции соответствуют значениям в values; для URL-строк там null).
   * Родитель может загрузить их в PocketBase напрямую как File, минуя
   * медленную и «вешающую» UI конвертацию base64 → Blob. */
  onFilesSelected?: (files: (File | null)[]) => void;
  accept?: string;
  label?: string;
  placeholder?: string;
  maxFiles?: number;
}

const isImageValue = (value: string) =>
  value.startsWith('data:image') || /\/files\//.test(value) || /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(value);
const isPdfValue = (value: string) =>
  value.startsWith('data:application/pdf') || (/\.pdf(\?|$)/i.test(value) && !value.startsWith('data:image'));

/**
 * Множественный загрузчик файлов.
 * Как и одиночный FileUploader: настоящие файлы отдаются наружу через
 * onFilesChange (индексом соответствующим values), а в values лежат только
 * компактные превью data-URL или URL уже загруженных файлов. Это убирает
 * зависания при выборе больших фото.
 */
const MultiFileUploader: React.FC<Props> = ({
  values,
  onChange,
  onFilesSelected,
  accept = 'image/*,.pdf,application/pdf',
  label = 'Файлы',
  placeholder = 'Вставьте URL или загрузите файлы',
  maxFiles = 10,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  // Файлы, соответствующие значениям в values (позиции совпадают).
  // Хранятся в ref — не вызывают ререндеров и не сериализуются в DOM.
  const filesRef = useRef<(File | null)[]>([]);

  // Обновляем значения и синхронно отдаём наружу массив файлов
  const updateBoth = (nextValues: string[], nextFiles: (File | null)[]) => {
    filesRef.current = nextFiles;
    onFilesSelected?.(nextFiles);
    onChange(nextValues);
  };

  const handleIncomingFiles = async (files: File[]) => {
    const room = maxFiles - values.length;
    const toProcess = files.slice(0, Math.max(0, room));
    if (toProcess.length === 0) return;
    setIsProcessing(true);
    try {
      const newValues: string[] = [];
      const newFiles: (File | null)[] = [];
      for (const f of toProcess) {
        newFiles.push(f);
        if (f.type.startsWith('image/')) {
          // Превью — сжатый маленький data-URL; оригинал файла пойдёт на сервер целиком
          try {
            newValues.push(await compressImageToDataUrl(f));
          } catch {
            newValues.push('');
          }
        } else {
          newValues.push(f.name);
        }
      }
      updateBoth([...values, ...newValues], [...filesRef.current, ...newFiles]);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1 || items[i].type.indexOf('pdf') !== -1) {
        const blob = items[i].getAsFile() as Blob | null;
        if (blob) {
          e.preventDefault();
          const f = blob instanceof File ? blob : new File([blob], 'pasted.jpg', { type: blob.type });
          await handleIncomingFiles([f]);
          return;
        }
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleIncomingFiles(Array.from(files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleIncomingFiles(Array.from(files));
    }
  };

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (trimmed && values.length < maxFiles) {
      // URL — файла нет, ставим null на новую позицию
      updateBoth([...values, trimmed], [...filesRef.current, null]);
      setUrlInput('');
    }
  };

  const handleRemove = (index: number) => {
    updateBoth(
      values.filter((_, i) => i !== index),
      filesRef.current.filter((_, i) => i !== index)
    );
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label} {values.length > 0 && <span className="text-xs text-gray-500">({values.length}/{maxFiles})</span>}
      </label>

      {/* Превью файлов */}
      {values.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {values.map((value, index) => (
            <div key={index} className="relative group">
              {isImageValue(value) && (
                <img
                  src={value}
                  alt={`Файл ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                />
              )}
              {isPdfValue(value) && (
                <div className="w-full h-24 flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-lg border border-gray-200 dark:border-gray-700 p-2">
                  <i className="fas fa-file-pdf text-3xl text-red-500 mb-1"></i>
                  <span className="text-xs text-gray-600 dark:text-gray-400 truncate w-full text-center">PDF</span>
                </div>
              )}
              {!isImageValue(value) && !isPdfValue(value) && (
                <div className="w-full h-24 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 p-2">
                  <i className="fas fa-link text-3xl text-gray-400 mb-1"></i>
                  <span className="text-xs text-gray-600 dark:text-gray-400 truncate w-full text-center">{value}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <i className="fas fa-times text-xs"></i>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Зона загрузки */}
      <div
        className={`border-2 border-dashed rounded-lg transition-colors ${
          isDragging
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
            : 'border-gray-300 dark:border-gray-600'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="p-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddUrl();
              }
            }}
            placeholder={placeholder}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700 text-gray-900 dark:text-gray-100 text-sm"
          />
        </div>

        <div className="flex gap-2 p-2 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={values.length >= maxFiles || isProcessing}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <i className="fas fa-spinner fa-spin text-xs"></i>
            ) : (
              <i className="fas fa-upload text-xs"></i>
            )}
            <span>{isProcessing ? 'Обработка…' : 'Загрузить файлы'}</span>
          </button>
          <button
            type="button"
            onClick={handleAddUrl}
            disabled={!urlInput.trim() || values.length >= maxFiles}
            className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fas fa-plus text-xs"></i>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
        <i className="fas fa-info-circle mr-1"></i>
        Вставьте из буфера (Ctrl+V), перетащите файлы или загрузите с устройства
      </p>
    </div>
  );
};

export default MultiFileUploader;
