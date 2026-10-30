import React, { useState } from 'react';
import { Sample, Yarn } from '../types';
import { formatFoldedMeterage } from '../utils/yarnCalc';
import Modal from './Modal';

interface Props {
  samples: Sample[];
  yarns: Yarn[];
  searchQuery: string;
}

const SamplesSection: React.FC<Props> = ({ samples, yarns, searchQuery }) => {
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);

  const getSampleYarns = (sample: Sample): Yarn[] =>
    sample.yarnUsages
      .map((u) => yarns.find((y) => y.id === u.yarnId))
      .filter((y): y is Yarn => !!y);

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
          return (
            <div
              key={sample.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedSample(sample)}
            >
              <div className="grid grid-cols-2 h-36">
                <div className="bg-gray-100 overflow-hidden border-r border-gray-200">
                  {sample.photoBefore ? (
                    <img src={sample.photoBefore} alt="До ВТО" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xs text-gray-400">До ВТО</span>
                    </div>
                  )}
                </div>
                <div className="bg-gray-100 overflow-hidden">
                  {sample.photoAfter ? (
                    <img src={sample.photoAfter} alt="После ВТО" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xs text-gray-400">После ВТО</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-3">
                <div className="space-y-1.5 mb-1">
                  {sample.yarnUsages.map((usage) => {
                    const yarn = yarns.find((y) => y.id === usage.yarnId);
                    if (!yarn) return null;
                    return (
                      <div key={usage.yarnId} className="flex items-center justify-between gap-2">
                        <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded truncate flex-1">
                          {yarn.name}
                        </span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
                          ×{usage.folds}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-indigo-600 uppercase tracking-wide font-medium">Толщина нити</span>
                    <span className="text-sm font-bold text-indigo-700">
                      {formatFoldedMeterage(sample.yarnUsages, yarns)}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Спицы: {sample.needleSize} мм
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Плотность (после ВТО): {sample.stitchesWidthAfter}п × {sample.rowsHeightAfter}р
                </p>
              </div>
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
              <h2 className="text-xl font-bold text-gray-800 mb-4">Образец</h2>

              {/* Yarns with folds */}
              <div className="mb-4">
                <h3 className="text-xs text-gray-400 uppercase tracking-wide mb-2">Пряжа и сложения</h3>
                <div className="space-y-2">
                  {selectedSample.yarnUsages.map((usage) => {
                    const yarn = yarns.find((y) => y.id === usage.yarnId);
                    if (!yarn) return null;
                    return (
                      <div key={usage.yarnId} className="flex items-center gap-3 bg-gray-50 rounded-lg p-2">
                        <img src={yarn.photo} alt={yarn.name} className="w-10 h-10 rounded-lg object-cover" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">{yarn.name}</p>
                          <p className="text-xs text-gray-500">{yarn.manufacturer} • {yarn.color}</p>
                          <p className="text-xs text-gray-400">Метраж: {yarn.meterage} м/100г</p>
                        </div>
                        <div className="flex flex-col items-center bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
                          <span className="text-[10px] text-emerald-600 uppercase tracking-wide">Сложений</span>
                          <span className="text-lg font-bold text-emerald-700">{usage.folds}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Calculated thickness */}
              <div className="mb-4 bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <i className="fas fa-calculator text-indigo-500"></i>
                  <span className="text-xs text-indigo-600 uppercase tracking-wide font-medium">Итоговая толщина нити</span>
                </div>
                <p className="text-lg font-bold text-indigo-700 mt-1">
                  {formatFoldedMeterage(selectedSample.yarnUsages, yarns)}
                </p>
                <p className="text-xs text-indigo-400 mt-0.5">
                  рассчитано по формуле Р = (Р1 × Р2) ÷ (Р1 + Р2)
                </p>
              </div>

              <div className="mb-4">
                <span className="text-xs text-gray-400 uppercase tracking-wide">Спицы</span>
                <p className="text-sm font-medium text-gray-700">{selectedSample.needleSize} мм</p>
              </div>

              {/* Before VTO */}
              <div className="mb-4 p-3 bg-blue-50 rounded-xl">
                <h3 className="font-semibold text-blue-700 text-sm mb-2">
                  <i className="fas fa-tint mr-1"></i> До ВТО
                </h3>
                {selectedSample.photoBefore && (
                  <img src={selectedSample.photoBefore} alt="До ВТО" className="w-full h-32 object-cover rounded-lg mb-2" />
                )}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-xs text-blue-600">Петли в ширину</span>
                    <p className="font-medium text-gray-700">{selectedSample.stitchesWidthBefore} п</p>
                  </div>
                  <div>
                    <span className="text-xs text-blue-600">Ряды в высоту</span>
                    <p className="font-medium text-gray-700">{selectedSample.rowsHeightBefore} р</p>
                  </div>
                  <div>
                    <span className="text-xs text-blue-600">Ширина</span>
                    <p className="font-medium text-gray-700">{selectedSample.measurementWidthBefore} см</p>
                  </div>
                  <div>
                    <span className="text-xs text-blue-600">Высота</span>
                    <p className="font-medium text-gray-700">{selectedSample.measurementHeightBefore} см</p>
                  </div>
                </div>
                <div className="mt-2 bg-white rounded-lg p-2 text-center">
                  <span className="text-xs text-gray-400">Плотность вязания</span>
                  <p className="font-bold text-blue-700">
                    {selectedSample.stitchesWidthBefore}п × {selectedSample.rowsHeightBefore}р
                    <span className="text-xs font-normal text-gray-500"> на {selectedSample.measurementWidthBefore}×{selectedSample.measurementHeightBefore} см</span>
                  </p>
                </div>
              </div>

              {/* After VTO */}
              <div className="mb-4 p-3 bg-green-50 rounded-xl">
                <h3 className="font-semibold text-green-700 text-sm mb-2">
                  <i className="fas fa-check-circle mr-1"></i> После ВТО
                </h3>
                {selectedSample.photoAfter && (
                  <img src={selectedSample.photoAfter} alt="После ВТО" className="w-full h-32 object-cover rounded-lg mb-2" />
                )}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-xs text-green-600">Петли в ширину</span>
                    <p className="font-medium text-gray-700">{selectedSample.stitchesWidthAfter} п</p>
                  </div>
                  <div>
                    <span className="text-xs text-green-600">Ряды в высоту</span>
                    <p className="font-medium text-gray-700">{selectedSample.rowsHeightAfter} р</p>
                  </div>
                  <div>
                    <span className="text-xs text-green-600">Ширина</span>
                    <p className="font-medium text-gray-700">{selectedSample.measurementWidthAfter} см</p>
                  </div>
                  <div>
                    <span className="text-xs text-green-600">Высота</span>
                    <p className="font-medium text-gray-700">{selectedSample.measurementHeightAfter} см</p>
                  </div>
                </div>
                <div className="mt-2 bg-white rounded-lg p-2 text-center">
                  <span className="text-xs text-gray-400">Плотность вязания</span>
                  <p className="font-bold text-green-700">
                    {selectedSample.stitchesWidthAfter}п × {selectedSample.rowsHeightAfter}р
                    <span className="text-xs font-normal text-gray-500"> на {selectedSample.measurementWidthAfter}×{selectedSample.measurementHeightAfter} см</span>
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors">
                  <i className="fas fa-edit mr-1"></i> Редактировать
                </button>
                <button
                  onClick={() => setSelectedSample(null)}
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

export default SamplesSection;
