import React, { useState, useEffect } from 'react';
import { Yarn, Sample } from '../types';
import Modal from './Modal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  yarns: Yarn[];
  samples: Sample[];
  selectedYarnIds: string[];
  preselectedSampleId?: string; // <-- ДОБАВЛЕНО
}

type ItemType = 'sweater' | 'hat' | 'scarf' | 'gloves' | 'vest' | 'cardigan';

const YarnCalculator: React.FC<Props> = ({ isOpen, onClose, yarns, samples, selectedYarnIds, preselectedSampleId }) => {
  const [itemType, setItemType] = useState<ItemType>('sweater');
  const [selectedSample, setSelectedSample] = useState<string>('');
  const [density, setDensity] = useState({ stitches: '', rows: '' });
  const [measurements, setMeasurements] = useState({
    bust: '100',
    headCircumference: '56',
    scarfLength: '180',
    scarfWidth: '25',
  });
  const [result, setResult] = useState<{
    totalMeterage: number;
    totalWeight: number;
    perYarn: { yarnId: string; meterage: number; weight: number }[];
  } | null>(null);

  // Автозаполнение при открытии калькулятора из образца
  useEffect(() => {
    if (isOpen && preselectedSampleId) {
      const sample = samples.find(s => s.id === preselectedSampleId);
      if (sample) {
        setSelectedSample(sample.id);
        if (sample.measurementWidthAfter > 0 && sample.measurementHeightAfter > 0) {
          const stitchesPer10cm = (sample.stitchesWidthAfter / sample.measurementWidthAfter) * 10;
          const rowsPer10cm = (sample.rowsHeightAfter / sample.measurementHeightAfter) * 10;
          setDensity({
            stitches: stitchesPer10cm.toFixed(1),
            rows: rowsPer10cm.toFixed(1),
          });
        }
      }
    }
  }, [isOpen, preselectedSampleId, samples]);

  // Автоподстановка плотности при ручном выборе образца из списка
  useEffect(() => {
    if (selectedSample && !preselectedSampleId) {
      const sample = samples.find(s => s.id === selectedSample);
      if (sample && sample.measurementWidthAfter > 0 && sample.measurementHeightAfter > 0) {
        const stitchesPer10cm = (sample.stitchesWidthAfter / sample.measurementWidthAfter) * 10;
        const rowsPer10cm = (sample.rowsHeightAfter / sample.measurementHeightAfter) * 10;
        setDensity({
          stitches: stitchesPer10cm.toFixed(1),
          rows: rowsPer10cm.toFixed(1),
        });
      }
    }
  }, [selectedSample, samples, preselectedSampleId]);

  // Сброс результата при изменении параметров
  useEffect(() => {
    setResult(null);
  }, [itemType, selectedSample, density, measurements]);

  const getSweaterBaseMeterage = (densityStitches: number, bust: number): number => {
    const table: Record<string, number[]> = {
      '29-32': [2800, 2600, 2400, 2200],
      '25-32': [2600, 2400, 2200, 1800],
      '23-24': [2400, 2200, 1800, 1600],
      '21-23': [2200, 1800, 1600, 1500],
      '19-20': [1800, 1600, 1500, 1300],
      '17-18': [1600, 1500, 1300, 1200],
      '15-16': [1500, 1300, 1200, 1100],
      '12-14': [1300, 1200, 1100, 1000],
      '10-11': [1000, 900, 800, 700],
    };

    let densityKey = '19-20';
    if (densityStitches >= 29) densityKey = '29-32';
    else if (densityStitches >= 25) densityKey = '25-32';
    else if (densityStitches >= 23) densityKey = '23-24';
    else if (densityStitches >= 21) densityKey = '21-23';
    else if (densityStitches >= 19) densityKey = '19-20';
    else if (densityStitches >= 17) densityKey = '17-18';
    else if (densityStitches >= 15) densityKey = '15-16';
    else if (densityStitches >= 12) densityKey = '12-14';
    else densityKey = '10-11';

    let sizeGroup = 2;
    if (bust >= 117) sizeGroup = 0;
    else if (bust >= 107) sizeGroup = 1;
    else if (bust >= 96) sizeGroup = 2;
    else sizeGroup = 3;

    return table[densityKey]?.[sizeGroup] || 1500;
  };

  const getItemMultiplier = (type: ItemType): number => {
    const multipliers: Record<ItemType, number> = {
      sweater: 1.0,
      cardigan: 1.2,
      vest: 0.7,
      hat: 0.18,
      scarf: 0.25,
      gloves: 0.12,
    };
    return multipliers[type];
  };

  const calculate = () => {
    const stitchesNum = parseFloat(density.stitches.replace(',', '.'));
    const rowsNum = parseFloat(density.rows.replace(',', '.'));

    if (isNaN(stitchesNum) || stitchesNum <= 0) {
      alert('Пожалуйста, введите плотность (петель в 10 см)');
      return;
    }

    let baseMeterage = 0;

    if (itemType === 'sweater' || itemType === 'cardigan' || itemType === 'vest') {
      const bust = parseFloat(measurements.bust) || 100;
      baseMeterage = getSweaterBaseMeterage(stitchesNum, bust);
      baseMeterage *= getItemMultiplier(itemType);
    } else if (itemType === 'hat') {
      const headCirc = parseFloat(measurements.headCircumference) || 56;
      const height = 25;
      const area = headCirc * height;
      const stitchesPerCm2 = (stitchesNum / 10) * (rowsNum / 10 || stitchesNum / 10);
      const totalStitches = area * stitchesPerCm2;
      baseMeterage = Math.round((totalStitches * 0.3) / 100);
    } else if (itemType === 'scarf') {
      const length = parseFloat(measurements.scarfLength) || 180;
      const width = parseFloat(measurements.scarfWidth) || 25;
      const area = length * width;
      const stitchesPerCm2 = (stitchesNum / 10) * (rowsNum / 10 || stitchesNum / 10);
      const totalStitches = area * stitchesPerCm2;
      baseMeterage = Math.round((totalStitches * 0.3) / 100);
    } else if (itemType === 'gloves') {
      baseMeterage = Math.round(500 * (stitchesNum / 20));
    }

    const totalMeterageWithReserve = Math.round(baseMeterage * 1.1);

    const selectedYarns = yarns.filter(y => selectedYarnIds.includes(y.id));
    
    if (selectedYarns.length === 0) {
      setResult({ totalMeterage: totalMeterageWithReserve, totalWeight: 0, perYarn: [] });
      return;
    }

    if (selectedYarns.length === 1) {
      const yarn = selectedYarns[0];
      const weight = Math.round((totalMeterageWithReserve / yarn.meterage) * 100);
      setResult({
        totalMeterage: totalMeterageWithReserve,
        totalWeight: weight,
        perYarn: [{ yarnId: yarn.id, meterage: totalMeterageWithReserve, weight }],
      });
      return;
    }

    const meteragePerYarn = Math.round(totalMeterageWithReserve / selectedYarns.length);
    const perYarn = selectedYarns.map(yarn => ({
      yarnId: yarn.id,
      meterage: meteragePerYarn,
      weight: Math.round((meteragePerYarn / yarn.meterage) * 100),
    }));

    const totalWeight = perYarn.reduce((sum, p) => sum + p.weight, 0);

    setResult({ totalMeterage: totalMeterageWithReserve, totalWeight, perYarn });
  };

  const getItemLabel = (type: ItemType): string => {
    const labels: Record<ItemType, string> = {
      sweater: 'Пуловер/свитер',
      cardigan: 'Кардиган',
      vest: 'Жилет',
      hat: 'Шапка',
      scarf: 'Шарф',
      gloves: 'Перчатки',
    };
    return labels[type];
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-5">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          <i className="fas fa-calculator mr-2 text-emerald-500"></i>
          Калькулятор расхода пряжи
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Тип изделия</label>
            <select
              value={itemType}
              onChange={(e) => setItemType(e.target.value as ItemType)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700 text-gray-900 dark:text-gray-100"
            >
              <option value="sweater">Пуловер/свитер</option>
              <option value="cardigan">Кардиган</option>
              <option value="vest">Жилет</option>
              <option value="hat">Шапка</option>
              <option value="scarf">Шарф</option>
              <option value="gloves">Перчатки</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Образец (для автоматической плотности)
            </label>
            <select
              value={selectedSample}
              onChange={(e) => setSelectedSample(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">-- Выберите образец --</option>
              {samples.map(sample => {
                const stitchesPerCm = sample.measurementWidthAfter > 0 
                  ? ((sample.stitchesWidthAfter / sample.measurementWidthAfter) * 10).toFixed(1) 
                  : '?';
                const rowsPerCm = sample.measurementHeightAfter > 0 
                  ? ((sample.rowsHeightAfter / sample.measurementHeightAfter) * 10).toFixed(1) 
                  : '?';
                const dateStr = sample.created 
                  ? new Date(sample.created).toLocaleDateString('ru-RU') 
                  : sample.id.slice(0, 8);
                
                return (
                  <option key={sample.id} value={sample.id}>
                    {dateStr} • {sample.needleSize}мм • {stitchesPerCm}п×{rowsPerCm}р
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Петель в 10 см</label>
              <input
                type="text"
                inputMode="decimal"
                value={density.stitches}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.,]/g, '');
                  setDensity({ ...density, stitches: val });
                }}
                placeholder="например, 17.6"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Рядов в 10 см</label>
              <input
                type="text"
                inputMode="decimal"
                value={density.rows}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.,]/g, '');
                  setDensity({ ...density, rows: val });
                }}
                placeholder="например, 26.1"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {(itemType === 'sweater' || itemType === 'cardigan' || itemType === 'vest') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Обхват груди (см)</label>
              <input
                type="text"
                inputMode="numeric"
                value={measurements.bust}
                onChange={(e) => setMeasurements({ ...measurements, bust: e.target.value.replace(/[^0-9]/g, '') })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          )}

          {itemType === 'hat' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Окружность головы (см)</label>
              <input
                type="text"
                inputMode="numeric"
                value={measurements.headCircumference}
                onChange={(e) => setMeasurements({ ...measurements, headCircumference: e.target.value.replace(/[^0-9]/g, '') })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          )}

          {itemType === 'scarf' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Длина (см)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={measurements.scarfLength}
                  onChange={(e) => setMeasurements({ ...measurements, scarfLength: e.target.value.replace(/[^0-9]/g, '') })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ширина (см)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={measurements.scarfWidth}
                  onChange={(e) => setMeasurements({ ...measurements, scarfWidth: e.target.value.replace(/[^0-9]/g, '') })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          )}

          <button
            onClick={calculate}
            className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
          >
            <i className="fas fa-calculator mr-2"></i>
            Рассчитать расход
          </button>

          {result && (
            <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
              <h3 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-3">
                Результат расчета для: {getItemLabel(itemType)}
              </h3>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Всего метража (с запасом 10%):</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-300">{result.totalMeterage} м</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Общий вес:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-300">{result.totalWeight} г</span>
                </div>
              </div>

              {result.perYarn.length > 0 && (
                <div className="border-t border-emerald-200 dark:border-emerald-800 pt-3">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Расход по каждой пряже:
                  </h4>
                  <div className="space-y-2">
                    {result.perYarn.map((item, index) => {
                      const yarn = yarns.find(y => y.id === item.yarnId);
                      if (!yarn) return null;
                      return (
                        <div key={index} className="bg-white dark:bg-gray-800 rounded p-2 text-sm">
                          <div className="font-medium text-gray-800 dark:text-gray-200">{yarn.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {item.meterage} м ≈ {item.weight} г
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-2.5 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default YarnCalculator;
