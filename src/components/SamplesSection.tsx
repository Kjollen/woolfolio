import React, { useState } from 'react';
import { Sample, Yarn } from '../types';
import { formatFoldedMeterage } from '../utils/yarnCalc';
import Modal from './Modal';
import EditSampleForm from './EditSampleForm';

interface Props {
  samples: Sample[];
  yarns: Yarn[];
  searchQuery: string;
  onSampleUpdate: (sample: Sample) => void;
  onDelete?: (id: string) => void;
}

const SamplesSection: React.FC<Props> = ({ samples, yarns, searchQuery, onSampleUpdate, onDelete }) => {
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);
  const [editingSample, setEditingSample] = useState<Sample | null>(null);

  const getSampleYarns = (sample: Sample): Yarn[] =>
    sample.yarnUsages
      .map((u) => yarns.find((y) => y.id === u.yarnId))
      .filter((y): y is Yarn => !!y);

  const handleEditSample = (updatedSample: Sample) => {
    onSampleUpdate(updatedSample);
    setEditingSample(null);
  };

  const filteredSamples = samples.filter((sample) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const sampleYarns = getSampleYarns(sample);
    return (
      sampleYarns.some(
        (y) =>
          y.name.toLowerCase().includes(q) ||
          y.manufacturer.toLowerCase().includes(q) ||
          y.color.toLowerCase().includes(q)
      ) ||
      sample.needleSize.toString().includes(q)
    );
  });

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSamples.map((sample) => {
          const densityAfter = `${((sample.stitchesWidthAfter / sample.measurementWidthAfter)).toFixed(2)}п × ${((sample.rowsHeightAfter / sample.measurementHeightAfter)).toFixed(2)}р на 1 см`;
          return (
            <div
              key={sample.id}
              className="relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedSample(sample)}
            >
              {/* Фото до/после ВТО */}
              <div className="grid grid-cols-2 h-36">
                <div className="bg-gray-100 dark:bg-gray-700 overflow-hidden border-r border-gray-200">
                  {sample.photoBefore ? (
                    <img src={sample.photoBefore} alt="До ВТО" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xs text-gray-400">До ВТО</span>
                    </div>
                  )}
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  {sample.photoAfter ? (
                    <img src={sample.photoAfter} alt="После ВТО" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xs text-gray-400">После ВТО</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Пряжа и сложения */}
              <div className="p-3 pb-2">
                <div className="space-y-1.5 mb-1">
                  {sample.yarnUsages.map((usage) => {
                    const yarn = yarns.find((y) => y.id === usage.yarnId);
                    if (!yarn) return null;
                    return (
                      <div key={usage.yarnId} className="flex items-center justify-between gap-2">
                        <span className="text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 px-2 py-0.5 rounded truncate flex-1">
                          {yarn.name}
                        </span>
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
                          ×{usage.folds}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ЕДИНЫЙ ИНФОРМАЦИОННЫЙ БЛОК */}
        <div className="mx-3 mb-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg p-3 pb-10">
  {/* Плотность — главный параметр */}
  <div className="flex items-center justify-between mb-2">
    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase tracking-wide font-medium">Плотность (после ВТО)</span>
    <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
      {densityAfter}
    </span>
  </div>

  {/* Разделитель */}
  <div className="border-t border-indigo-200 dark:border-indigo-800 my-2"></div>

  {/* Спицы и толщина нити */}
  <div className="flex items-center justify-between text-xs">
    <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
      <i className="fas fa-ruler-horizontal"></i>
      <span>Спицы: <span className="font-semibold text-indigo-700 dark:text-indigo-300">{sample.needleSize} мм</span></span>
    </div>
    <div className="text-indigo-600 dark:text-indigo-400 text-right">
      <span className="text-[10px] uppercase tracking-wide">Толщина:</span>
      <span className="font-semibold text-indigo-700 dark:text-indigo-300 ml-1">{formatFoldedMeterage(sample.yarnUsages, yarns)}</span>
    </div>
  </div>
</div>

                {/* Разделитель */}
                <div className="border-t border-indigo-200 dark:border-indigo-800 my-2"></div>

                {/* Спицы и плотность в одной строке */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                    <i className="fas fa-ruler-horizontal"></i>
                    <span>Спицы: <span className="font-semibold text-indigo-700 dark:text-indigo-300">{sample.needleSize} мм</span></span>
                  </div>
                  <div className="text-indigo-600 dark:text-indigo-400 text-right">
                    <span className="text-[10px] uppercase tracking-wide">Плотность:</span>
                    <span className="font-semibold text-indigo-700 dark:text-indigo-300 ml-1">{densityAfter}</span>
                  </div>
                </div>
              </div>

              {/* КНОПКА УДАЛЕНИЯ НА КАРТОЧКЕ */}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Удалить образец? Это действие нельзя отменить.`)) {
                      onDelete(sample.id);
                    }
                  }}
                  className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-red-500/90 hover:bg-red-600 text-white flex items-center justify-center shadow-lg z-10 transition-colors"
                  title="Удалить"
                >
                  <i className="fas fa-trash text-xs"></i>
                </button>
              )}
            </div>
          );
        })}
      </div>
      {filteredSamples.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <i className="fas fa-search text-4xl mb-3"></i>
          <p>Ничего не найдено</p>
        </div>
      )}
      {/* Modal */}
      <Modal isOpen={!!selectedSample} onClose={() => setSelectedSample(null)}>
        {selectedSample && (
          <>
            <div className="p-5">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Образец</h2>
              <div className="mb-4">
                <h3 className="text-xs text-gray-400 uppercase tracking-wide mb-2">Пряжа и сложения</h3>
                <div className="space-y-2">
                  {selectedSample.yarnUsages.map((usage) => {
                    const yarn = yarns.find((y) => y.id === usage.yarnId);
                    if (!yarn) return null;
                    return (
                      <div key={usage.yarnId} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                        <img src={yarn.photo} alt={yarn.name} className="w-10 h-10 rounded-lg object-cover" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{yarn.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{yarn.manufacturer} • {yarn.color}</p>
                          <p className="text-xs text-gray-400">Метраж: {yarn.meterage} м/100г</p>
                        </div>
                        <div className="flex flex-col items-center bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-1.5">
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Сложений</span>
                          <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{usage.folds}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mb-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <i className="fas fa-calculator text-indigo-500"></i>
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wide font-medium">Итоговая толщина нити</span>
                </div>
                <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300 mt-1">
                  {formatFoldedMeterage(selectedSample.yarnUsages, yarns)}
                </p>
                <p className="text-xs text-indigo-400 mt-0.5">
                  рассчитано по формуле Р = (Р1 × Р2) ÷ (Р1 + Р2)
                </p>
              </div>
              <div className="mb-4">
                <span className="text-xs text-gray-400 uppercase tracking-wide">Спицы</span>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{selectedSample.needleSize} мм</p>
              </div>
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <h3 className="font-semibold text-blue-700 dark:text-blue-300 text-sm mb-2">
                  <i className="fas fa-tint mr-1"></i> До ВТО
                </h3>
                {selectedSample.photoBefore && (
                  <img src={selectedSample.photoBefore} alt="До ВТО" className="w-full h-32 object-cover rounded-lg mb-2" />
                )}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-xs text-blue-600 dark:text-blue-400">Петли в ширину</span>
                    <p className="font-medium text-gray-700 dark:text-gray-200">{selectedSample.stitchesWidthBefore} п</p>
                  </div>
                  <div>
                    <span className="text-xs text-blue-600 dark:text-blue-400">Ряды в высоту</span>
                    <p className="font-medium text-gray-700 dark:text-gray-200">{selectedSample.rowsHeightBefore} р</p>
                  </div>
                  <div>
                    <span className="text-xs text-blue-600 dark:text-blue-400">Ширина</span>
                    <p className="font-medium text-gray-700 dark:text-gray-200">{selectedSample.measurementWidthBefore} см</p>
                  </div>
                  <div>
                    <span className="text-xs text-blue-600 dark:text-blue-400">Высота</span>
                    <p className="font-medium text-gray-700 dark:text-gray-200">{selectedSample.measurementHeightBefore} см</p>
                  </div>
                </div>
                <div className="mt-2 bg-white dark:bg-gray-800 rounded-lg p-2 text-center">
                  <span className="text-xs text-gray-400">Плотность вязания</span>
                  <p className="font-bold text-blue-700 dark:text-blue-300">
                    {(selectedSample.stitchesWidthBefore / selectedSample.measurementWidthBefore).toFixed(2)}п × {(selectedSample.rowsHeightBefore / selectedSample.measurementHeightBefore).toFixed(2)}р
                    <span className="text-xs font-normal text-gray-500"> на 1 см</span>
                  </p>
                </div>
              </div>
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <h3 className="font-semibold text-green-700 dark:text-green-300 text-sm mb-2">
                  <i className="fas fa-check-circle mr-1"></i> После ВТО
                </h3>
                {selectedSample.photoAfter && (
                  <img src={selectedSample.photoAfter} alt="После ВТО" className="w-full h-32 object-cover rounded-lg mb-2" />
                )}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-xs text-green-600 dark:text-green-400">Петли в ширину</span>
                    <p className="font-medium text-gray-700 dark:text-gray-200">{selectedSample.stitchesWidthAfter} п</p>
                  </div>
                  <div>
                    <span className="text-xs text-green-600 dark:text-green-400">Ряды в высоту</span>
                    <p className="font-medium text-gray-700 dark:text-gray-200">{selectedSample.rowsHeightAfter} р</p>
                  </div>
                  <div>
                    <span className="text-xs text-green-600 dark:text-green-400">Ширина</span>
                    <p className="font-medium text-gray-700 dark:text-gray-200">{selectedSample.measurementWidthAfter} см</p>
                  </div>
                  <div>
                    <span className="text-xs text-green-600 dark:text-green-400">Высота</span>
                    <p className="font-medium text-gray-700 dark:text-gray-200">{selectedSample.measurementHeightAfter} см</p>
                  </div>
                </div>
                <div className="mt-2 bg-white dark:bg-gray-800 rounded-lg p-2 text-center">
                  <span className="text-xs text-gray-400">Плотность вязания</span>
                  <p className="font-bold text-green-700 dark:text-green-300">
                    {(selectedSample.stitchesWidthAfter / selectedSample.measurementWidthAfter).toFixed(2)}п × {(selectedSample.rowsHeightAfter / selectedSample.measurementHeightAfter).toFixed(2)}р
                    <span className="text-xs font-normal text-gray-500"> на 1 см</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingSample(selectedSample)}
                  className="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                >
                  <i className="fas fa-edit mr-1"></i> Редактировать
                </button>
                <button
                  onClick={() => setSelectedSample(null)}
                  className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-2.5 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </>
        )}
      </Modal>
      <EditSampleForm
        isOpen={!!editingSample}
        onClose={() => setEditingSample(null)}
        onSave={handleEditSample}
        yarns={yarns}
        sample={editingSample}
      />
    </div>
  );
};

export default SamplesSection;
