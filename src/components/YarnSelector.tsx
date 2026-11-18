import React, { useState, useRef, useEffect } from 'react';
import { Yarn } from '../types';

interface Props {
  yarns: Yarn[];
  value: string; // yarnId
  onChange: (yarnId: string) => void;
  placeholder?: string;
}

const YarnSelector: React.FC<Props> = ({ yarns, value, onChange, placeholder = 'Начните вводить название, артикул или состав...' }) => {
  const [inputText, setInputText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Инициализация текста при изменении value извне
  useEffect(() => {
    if (value) {
      const yarn = yarns.find(y => y.id === value);
      if (yarn) {
        setInputText(`${yarn.name} • ${yarn.article}`);
      }
    } else {
      setInputText('');
    }
  }, [value, yarns]);

  // Закрытие при клике вне
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        // Если текст не совпадает ни с одной пряжей — сбрасываем
        const matched = yarns.find(y => `${y.name} • ${y.article}`.toLowerCase() === inputText.toLowerCase());
        if (!matched && inputText.trim()) {
          onChange('');
          setInputText('');
        }
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inputText, yarns, onChange]);

  // Фильтрация пряжи
  const filteredYarns = yarns.filter(yarn => {
    if (!inputText.trim()) return true;
    const q = inputText.toLowerCase();
    return (
      yarn.name.toLowerCase().includes(q) ||
      yarn.article.toLowerCase().includes(q) ||
      yarn.composition.toLowerCase().includes(q) ||
      yarn.color.toLowerCase().includes(q) ||
      yarn.manufacturer.toLowerCase().includes(q)
    );
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setInputText(newText);
    setIsOpen(true);
    setSelectedIndex(-1);
    // Если текст пустой — сбрасываем выбор
    if (!newText.trim()) {
      onChange('');
    }
  };

  const handleSelect = (yarn: Yarn) => {
    onChange(yarn.id);
    setInputText(`${yarn.name} • ${yarn.article}`);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filteredYarns.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredYarns.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && filteredYarns[selectedIndex]) {
        handleSelect(filteredYarns[selectedIndex]);
      } else if (filteredYarns.length === 1) {
        handleSelect(filteredYarns[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  // Прокрутка к выбранному элементу
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700"
          autoComplete="off"
        />
        {inputText && (
          <button
            type="button"
            onClick={() => {
              setInputText('');
              onChange('');
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <i className="fas fa-times text-xs"></i>
          </button>
        )}
      </div>

      {isOpen && filteredYarns.length > 0 && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {filteredYarns.map((yarn, index) => (
            <div
              key={yarn.id}
              onMouseDown={(e) => {
                e.preventDefault(); // предотвращает blur до выбора
                handleSelect(yarn);
              }}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                index === selectedIndex
                  ? 'bg-emerald-50 dark:bg-emerald-900/30'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              <div className="w-10 h-10 flex-shrink-0 bg-gray-100 dark:bg-gray-600 rounded overflow-hidden">
                {yarn.photo ? (
                  <img src={yarn.photo} alt={yarn.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <i className="fas fa-image text-xs"></i>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                  {yarn.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {yarn.article} {yarn.color && `• ${yarn.color}`}
                </div>
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                {yarn.meterage} м/100г
              </div>
            </div>
          ))}
        </div>
      )}

      {isOpen && inputText.trim() && filteredYarns.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
          <i className="fas fa-search mb-1 block text-lg"></i>
          Ничего не найдено
        </div>
      )}
    </div>
  );
};

export default YarnSelector;
