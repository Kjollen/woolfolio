import React, { useState } from 'react';
import { Sample, Yarn } from '../types';

interface Props {
  samples: Sample[];
  yarns: Yarn[];
  searchQuery: string;
}

function calcYarnThickness(yarns: Yarn[], folds: number): string {
  if (yarns.length === 0) return '—';
  const avgMeterage = yarns.reduce((sum, y) => sum + y.meterage, 0) / yarns.length;
  const effectiveMeterage = avgMeterage / folds;
  if (effectiveMeterage > 300) return 'Тонкая (fino)';
  if (effectiveMeterage > 200) return 'Средняя (sport)';
  if (effectiveMeterage > 100) return 'Средне-толстая (worsted)';
  return 'Толстая (bulky)';
}

const SamplesSection: React.FC<Props> = ({ samples, yarns, searchQuery }) => {
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);

  const filteredSamples = samples.filter((sample) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const sampleYarns = yarns.filter((y) => sample.yarnIds.includes(y.id));
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

  const getSampleYarns = (sample: Sample) =>
    yarns.filter((y) => sample.yarnIds.includes(y.id));

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSamples.map((sample) => {
          const sampleYarns = getSampleYarns(sample);
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
                <div className="flex flex-wrap gap-1 mb-1">
                  {sampleYarns.map((y) => (
                    <span key={y.id} className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded">
                      {y.name}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  Спицы: {sample.needleSize} мм • Сложений: {sample.folds}
                </p>
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
      {selectedSample && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedSample(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">Образец</h2>
                <button
                  onClick={() => setSelectedSample(null)}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
                >
                  <i className="fas fa-times text-gray-600"></i>
                </button>
              </div>

              {/* Yarns */}
              <div className="mb-4">
                <h3 className="text-xs text-gray-400 uppercase tracking-wide mb-2">Пряжа</h3>
                <div className="space-y-2">
                  {getSampleYarns(selectedSample).map((y) => (
                    <div key={y.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-2">
                      <img src={y.photo} alt={y.name} className="w-10 h-10 rounded-lg object-cover" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">{y.name}</p>
                        <p className="text-xs text-gray-500">{y.manufacturer} • {y.color}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <span className="text-xs text-gray-400 uppercase tracking-wide">Толщина нити</span>
                  <p className="text-sm font-medium text-gray-700">{calcYarnThickness(getSampleYarns(selectedSample), selectedSample.folds)}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-400 uppercase tracking-wide">Спицы</span>
                  <p className="text-sm font-medium text-gray-700">{selectedSample.needleSize} мм</p>
                </div>
                <div>
                  <span className="text-xs text-gray-400 uppercase tracking-wide">Сложений</span>
                  <p className="text-sm font-medium text-gray-700">{selectedSample.folds}</p>
                </div>
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
                <button className="flex-1 bg-purple-600 text-white py-2.5 rounded-lg font-medium hover:bg-purple-700 transition-colors">
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
          </div>
        </div>
      )}
    </div>
  );
};

export default SamplesSection;
