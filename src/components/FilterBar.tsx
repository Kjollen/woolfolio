import React from 'react';

export type SortOption = {
  value: string;
  label: string;
};

interface Props {
  sortOptions: SortOption[];
  currentSort: string;
  onSortChange: (value: string) => void;
  filters?: {
    label: string;
    options: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
  }[];
}

const FilterBar: React.FC<Props> = ({ sortOptions, currentSort, onSortChange, filters }) => {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {/* Фильтры */}
      {filters?.map((filter, index) => (
        <select
          key={index}
          value={filter.value}
          onChange={(e) => filter.onChange(e.target.value)}
          className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700"
        >
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}

      {/* Сортировка */}
      <div className="flex items-center gap-2 ml-auto">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          <i className="fas fa-sort mr-1"></i>
        </span>
        <select
          value={currentSort}
          onChange={(e) => onSortChange(e.target.value)}
          className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default FilterBar;
