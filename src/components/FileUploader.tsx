import React, { useRef, useState } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  accept?: string;
  multiple?: boolean;
  label?: string;
  placeholder?: string;
}

const FileUploader: React.FC<Props> = ({
  value,
  onChange,
  accept = 'image/*',
  multiple = false,
  label = 'Файл',
  placeholder = 'Вставьте URL или загрузите файл',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1 || items[i].type.indexOf('pdf') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              onChange(event.target.result as string);
            }
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onChange(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onChange(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const isImage = value && (value.startsWith('data:image') || value.match(/\.(jpg|jpeg|png|gif|webp)$/i));
  const isPdf = value && (value.startsWith('data:application/pdf') || value.match(/\.pdf$/i));

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      
      <div
        className={`relative border-2 border-dashed rounded-lg transition-colors ${
          isDragging
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
            : 'border-gray-300 dark:border-gray-600'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Превью */}
        {value && (
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            {isImage && (
              <img
                src={value}
                alt="Превью"
                className="w-full h-32 object-cover rounded-lg"
              />
            )}
            {isPdf && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <i className="fas fa-file-pdf text-2xl text-red-500"></i>
                <span className="text-sm text-gray-700 dark:text-gray-300">PDF файл загружен</span>
              </div>
            )}
          </div>
        )}

        {/* Поле ввода */}
        <div className="p-2">
          <input
            type="text"
            value={value.startsWith('data:') ? '[Загружено]' : value}
            onChange={(e) => onChange(e.target.value)}
            onPaste={handlePaste}
            placeholder={placeholder}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700 text-gray-900 dark:text-gray-100 text-sm"
          />
        </div>

        {/* Кнопки действий */}
        <div className="flex gap-2 p-2 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
          >
            <i className="fas fa-upload text-xs"></i>
            <span>Загрузить файл</span>
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
            >
              <i className="fas fa-trash text-xs"></i>
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
        <i className="fas fa-info-circle mr-1"></i>
        Вставьте из буфера (Ctrl+V), перетащите файл или загрузите с устройства
      </p>
    </div>
  );
};

export default FileUploader;
