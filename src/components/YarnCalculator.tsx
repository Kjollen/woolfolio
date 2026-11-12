import React, { useState, useEffect } from 'react';
import { Yarn, Sample } from '../types';
import Modal from './Modal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  yarns: Yarn[];
  samples: Sample[];
  selectedYarnIds: string[]; // ID пряжи, уже добавленной в проект
}

type ItemType = 'sweater' | 'hat' | 'scarf' | 'gloves' | 'vest' | 'cardigan';

const YarnCalculator: React.FC<Props> = ({ isOpen, onClose, yarns, samples, selectedYarnIds }) => {
  const [itemType, setItemType] = useState<ItemType>('sweater');
  const [selectedSample, setSelectedSample] = useState<string>('');
  const [density, setDensity] = useState({ stitches: 0, rows: 0 });
  const [measurements, setMeasurements] = useState({
    bust: 100, // ОГ для свитера
    headCircumference: 56, // Окружность головы для шапки
    scarfLength: 180, // Длина шарфа в см
    scarfWidth: 25, // Ширина шарфа в см
  });
  const [result, setResult] = useState<{
    totalMeterage: number;
    totalWeight: number;
    perYarn: { yarnId: string; meterage: number; weight: number }[];
  } | null>(null);

  // Автоподстановка плотности из образца
  useEffect(() => {
    if (selectedSample) {
      const sample = samples.find(s => s.id === selectedSample);
      if (sample) {
        const stitchesPerCm = sample.stitchesWidthAfter / sample.measurementWidthAfter;
        const rowsPerCm = sample.rowsHeightAfter / sample.measurementHeightAfter;
        setDensity({
          stitches: Math.round(stitchesPerCm * 10), // петель в 10 см
          rows: Math.round(rowsPerCm * 10), // рядов в 10 см
        });
      }
    }
  }, [selectedSample, samples]);

  // Расчет базового метража для пуловера по таблице
  const getSweaterBaseMeterage = (densityStitches: number, bust: number): number => {
    // Таблица из скрина: [плотность][размерная_группа] = метраж
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

    // Определяем диапазон плотности
    let densityKey = '19-20'; // по умолчанию
    if (densityStitches >= 29) densityKey = '29-32';
    else if (densityStitches >= 25) densityKey = '25-32';
    else if (densityStitches >= 23) densityKey = '23-24';
    else if (densityStitches >= 21) densityKey = '21-23';
    else if (densityStitches >= 19) densityKey = '19-20';
    else if (densityStitches >= 17) densityKey = '17-18';
    else if (densityStitches >= 15) densityKey = '15-16';
    else if (densityStitches >= 12) densityKey = '12-14';
    else densityKey = '10-11';

    // Определяем размерную группу по ОГ
    let sizeGroup = 2; // по умолчанию 96-102
    if (bust >= 117) sizeGroup = 0;
    else if (bust >= 107) sizeGroup = 1;
    else if (bust >= 96) sizeGroup = 2;
    else sizeGroup = 3;

    return table[densityKey]?.[sizeGroup] || 1500;
  };

  // Коэффициенты для разных типов изделий (от базового пуловера)
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

  // Расчет для шапки по окружности головы
  const getHatMeterage = (headCirc: number, densityStitches: number): number => {
    // Базовый расход для шапки ~50-80г для fingering weight
    // Формула: окружность × высота(25см) × плотность
    const height = 25; // стандартная высота шапки
    const area = headCirc * height; // площадь в см²
    const stitchesPerCm2 = (densityStitches / 10) * (density.rows / 10);
    const totalStitches = area * stitchesPerCm2;
    // Примерная длина нити на петлю (зависит от пряжи, берем среднее)
    const yarnLengthPerStitch = 0.3; // см на петлю (примерно)
    return Math.round((totalStitches * yarnLengthPerStitch) / 100); // в метрах
  };

  // Расчет для шарфа по размерам
  const getScarfMeterage = (length: number, width: number, densityStitches: number): number => {
    const area = length * width;
    const stitchesPerCm2 = (densityStitches / 10) * (density.rows / 10);
    const totalStitches = area * stitchesPerCm2;
    const yarnLengthPerStitch = 0.3;
    return Math.round((totalStitches * yarnLengthPerStitch) / 100);
  };

  // Расчет для перчаток
  const getGlovesMeterage = (densityStitches: number): number => {
    // Перчатки ~30-50г для fingering weight
    // Базовый метраж ~400-600м
    const baseMeterage = 500;
    // Корректировка по плотности
    return Math.round(baseMeterage * (densityStitches / 20));
  };

  const calculate = () => {
    if (density.stitches === 0) {
      alert('Пожалуйста, выберите образец или введите плотность вручную');
      return;
    }

    // 1. Вычисляем базовый метраж
    let baseMeterage = 0;

    if (itemType === 'sweater' || itemType === 'cardigan' || itemType === 'vest') {
      baseMeterage = getSweaterBaseMeterage(density.stitches, measurements.bust);
      baseMeterage *= getItemMultiplier(itemType);
    } else if (itemType === 'hat') {
      baseMeterage = getHatMeterage(measurements.headCircumference, density.stitches);
    } else if (itemType === 'scarf') {
      baseMeterage = getScarfMeterage(measurements.scarfLength, measurements.scarfWidth, density.stitches);
    } else if (itemType === 'gloves') {
      baseMeterage = getGlovesMeterage(density.stitches);
    }

    // 2. Добавляем запас 10%
    const totalMeterageWithReserve = Math.round(baseMeterage * 1.1);

    // 3. Распределяем метраж между пряжей пропорционально их метражу
    const selectedYarns = yarns.filter(y => selectedYarnIds.includes(y.id));
    
    if (selectedYarns.length === 0) {
      setResult({
        totalMeterage: totalMeterageWithReserve,
        totalWeight: 0,
        perYarn: [],
      });
      return;
    }

    // Если пряжа одна - весь метраж на нее
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

    // Если пряжи несколько - распределяем поровну (упрощенно)
    // В будущем можно добавить коэффициенты сложений
    const meteragePerYarn = Math.round(totalMeterageWithReserve / selectedYarns.length);
    const perYarn = selectedYarns.map(yarn => ({
      yarnId: yarn.id,
      meterage: meteragePerYarn,
      weight: Math.round((meteragePerYarn / yarn.meterage) * 100),
    }));

    const totalWeight = perYarn.reduce((sum, p) => sum + p.weight, 0);

    setResult({
      totalMeterage: totalMeterageWithReserve,
      totalWeight,
      perYarn,
    });
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
          {/* Тип изделия */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Тип изделия
            </label>
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

          {/* Образец для плотности */}
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
                  ? (sample.stitchesWidthAfter / sample.measurementWidthAfter).toFixed(2) 
                  : '?';
                const rowsPerCm = sample.measurementHeightAfter > 0 
                  ? (sample.rowsHeightAfter / sample.measurementHeightAfter).toFixed(2) 
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

          {/* Плотность */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Петель в 10 см
              </label>
              <input
                type="number"
                value={density.stitches}
                onChange={(e) => setDensity({ ...density, stitches: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Рядов в 10 см
              </label>
              <input
                type="number"
                value={density.rows}
                onChange={(e) => setDensity({ ...density, rows: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Размеры в зависимости от типа изделия */}
          {(itemType === 'sweater' || itemType === 'cardigan' || itemType === 'vest') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Обхват груди (см)
              </label>
              <input
                type="number"
                value={measurements.bust}
                onChange={(e) => setMeasurements({ ...measurements, bust: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          )}

          {itemType === 'hat' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Окружность головы (см)
              </label>
              <input
                type="number"
                value={measurements.headCircumference}
                onChange={(e) => setMeasurements({ ...measurements, headCircumference: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          )}

          {itemType === 'scarf' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Длина (см)
                </label>
                <input
                  type="number"
                  value={measurements.scarfLength}
                  onChange={(e) => setMeasurements({ ...measurements, scarfLength: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ширина (см)
                </label>
                <input
                  type="number"
                  value={measurements.scarfWidth}
                  onChange={(e) => setMeasurements({ ...measurements, scarfWidth: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          )}

          {/* Кнопка расчета */}
          <button
            onClick={calculate}
            className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
          >
            <i className="fas fa-calculator mr-2"></i>
            Рассчитать расход
          </button>

          {/* Результат */}
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

          {/* Кнопки */}
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
