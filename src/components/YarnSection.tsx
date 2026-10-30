import React, { useState } from 'react';
import { Yarn, Project } from '../types';
import { calcYarnRemaining, calcYarnConsumed } from '../data/mockData';
import Modal from './Modal';

interface Props {
  yarns: Yarn[];
  projects: Project[];
  searchQuery: string;
  onEdit?: (yarn: Yarn) => void;
}

import FilterBar from './FilterBar';

const YarnSection: React.FC<Props> = ({ yarns, projects, searchQuery, onEdit }) => {
  const [selectedYarn, setSelectedYarn] = useState<Yarn | null>(null);
  const [sortBy, setSortBy] = useState('name');
  const [filterByRemaining, setFilterByRemaining] = useState('all');

  const filteredYarns = yarns
    .filter((yarn) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        yarn.name.toLowerCase().includes(q) ||
        yarn.manufacturer.toLowerCase().includes(q) ||
        yarn.article.toLowerCase().includes(q) ||
        yarn.composition.toLowerCase().includes(q) ||
        yarn.color.toLowerCase().includes(q) ||
        yarn.shop.toLowerCase().includes(q) ||
        yarn.orderNumber.toLowerCase().includes(q)
      );
    })
    .filter((yarn) => {
      if (filterByRemaining === 'all') return true;
      const remaining = calcYarnRemaining(yarn.id, yarn.totalWeight, projects);
      const percent = (remaining / yarn.totalWeight) * 100;
      if (filterByRemaining === 'low') return percent < 30;
      if (filterByRemaining === 'medium') return percent >= 30 && percent < 70;
      if (filterByRemaining === 'high') return percent >= 70;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'manufacturer') return a.manufacturer.localeCompare(b.manufacturer);
      if (sortBy === 'remaining') {
        const remA = calcYarnRemaining(a.id, a.totalWeight, projects);
        const remB = calcYarnRemaining(b.id, b.totalWeight, projects);
        return remB - remA;
      }
      if (sortBy === 'weight') return b.totalWeight - a.totalWeight;
      return 0;
    });

  // Список проектов, в которых используется эта пряжа
  const getProjectsUsingYarn = (yarnId: string) =>
    projects.filter((p) => p.yarnUsages.some((u) => u.yarnId === yarnId));

  return (
    <div>
      <FilterBar
        sortOptions={[
          { value: 'name', label: 'По названию' },
          { value: 'manufacturer', label: 'По производителю' },
          { value: 'remaining', label: 'По остатку' },
          { value: 'weight', label: 'По весу' },
        ]}
        currentSort={sortBy}
        onSortChange={setSortBy}
        filters={[
          {
            label: 'Остаток',
            options: [
              { value: 'all', label: 'Все' },
              { value: 'low', label: 'Мало (<30%)' },
              { value: 'medium', label: 'Средне (30-70%)' },
              { value: 'high', label: 'Много (>70%)' },
            ],
            value: filterByRemaining,
            onChange: setFilterByRemaining,
          },
        ]}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredYarns.map((yarn) => {
          const remaining = calcYarnRemaining(yarn.id, yarn.totalWeight, projects);
          const consumed = calcYarnConsumed(yarn.id, projects);
          const usedPercent = (consumed / yarn.totalWeight) * 100;

          return (
            <div
              key={yarn.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedYarn(yarn)}
            >
              <div className="aspect-square bg-gray-100 dark:bg-gray-700 overflow-hidden">
                <img
                  src={yarn.photo}
                  alt={yarn.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">{yarn.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{yarn.manufacturer} • {yarn.article}</p>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-300">{yarn.color}</span>
                  <span className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-medium">
                    {remaining}г
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {yarn.meterage} м/100г
                </div>
                {/* Progress bar */}
                <div className="mt-2">
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        usedPercent > 80 ? 'bg-red-400' : usedPercent > 50 ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min(usedPercent, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                    Использовано {consumed}г из {yarn.totalWeight}г
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredYarns.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <i className="fas fa-search text-4xl mb-3"></i>
          <p>Ничего не найдено</p>
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={!!selectedYarn} onClose={() => setSelectedYarn(null)}>
        {selectedYarn && (
          <>
            <div className="relative">
              <img src={selectedYarn.photo} alt={selectedYarn.name} className="w-full h-48 object-cover" />
            </div>
            <div className="p-5">
              <h2 className="text-xl font-bold text-gray-800">{selectedYarn.name}</h2>
              <p className="text-sm text-gray-500 mt-1">{selectedYarn.manufacturer} • Арт. {selectedYarn.article}</p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <InfoItem label="Состав" value={selectedYarn.composition} />
                <InfoItem label="Цвет" value={selectedYarn.color} />
                <InfoItem label="Общий вес бобины" value={`${selectedYarn.totalWeight} г`} />
                <InfoItem label="Метраж" value={`${selectedYarn.meterage} м/100г`} />
                <InfoItem label="Общий метраж" value={`${selectedYarn.totalMeterage} м`} />
              </div>

              {/* Остаток */}
              <div className="mt-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wide font-medium">Остаток</span>
                  <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                    {calcYarnRemaining(selectedYarn.id, selectedYarn.totalWeight, projects)} г
                  </span>
                </div>
                <div className="w-full bg-emerald-100 dark:bg-emerald-900 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${100 - (calcYarnConsumed(selectedYarn.id, projects) / selectedYarn.totalWeight) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-emerald-400 dark:text-emerald-500 mt-1">
                  Использовано {calcYarnConsumed(selectedYarn.id, projects)}г из {selectedYarn.totalWeight}г
                </p>
              </div>

              {/* Проекты, где используется */}
              {getProjectsUsingYarn(selectedYarn.id).length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h3 className="font-semibold text-gray-700 text-sm mb-2">
                    <i className="fas fa-link mr-1 text-emerald-400"></i> Используется в проектах
                  </h3>
                  <div className="space-y-2">
                    {getProjectsUsingYarn(selectedYarn.id).map((project) => {
                      const usage = project.yarnUsages.find((u) => u.yarnId === selectedYarn.id);
                      return (
                        <div key={project.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                          <div className="flex items-center gap-2">
                            {project.photos.length > 0 && (
                              <img src={project.photos[0]} alt="" className="w-8 h-8 rounded object-cover" />
                            )}
                            <span className="text-sm text-gray-700">{project.name}</span>
                          </div>
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-medium">
                            {usage?.consumed || 0}г
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-100">
                <h3 className="font-semibold text-gray-700 text-sm mb-2">
                  <i className="fas fa-shopping-bag mr-1 text-pink-400"></i> Информация о покупке
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <InfoItem label="Магазин" value={selectedYarn.shop} />
                  <InfoItem label="№ Заказа" value={selectedYarn.orderNumber} />
                  <InfoItem label="Цена за грамм" value={`${selectedYarn.pricePerGram} ₽`} />
                  <InfoItem label="Общая сумма" value={`${selectedYarn.totalPrice} ₽`} />
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <button 
                  onClick={() => onEdit?.(selectedYarn)}
                  className="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                >
                  <i className="fas fa-edit mr-1"></i> Редактировать
                </button>
                <button
                  onClick={() => setSelectedYarn(null)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

const InfoItem: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div>
    <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
    <p className={`text-sm font-medium ${highlight ? 'text-purple-700' : 'text-gray-700'}`}>{value}</p>
  </div>
);

export default YarnSection;
