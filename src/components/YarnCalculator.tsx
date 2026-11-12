import React, { useState, useEffect } from 'react';
import { Yarn, Sample } from '../types';
import Modal from './Modal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  yarns: Yarn[];
  samples: Sample[];
  selectedYarnIds: string[];
  preselectedSampleId?: string;
}

type ItemType = 'sweater' | 'cardigan' | 'vest' | 'tshirt' | 'tank' | 'hat' | 'scarf' | 'gloves';
type FitType = 'slim' | 'regular' | 'loose' | 'oversize';
type CalcMode = 'swatch' | 'estimated';

const YarnCalculator: React.FC<Props> = ({ isOpen, onClose, yarns, samples, selectedYarnIds, preselectedSampleId }) => {
  const [calcMode, setCalcMode] = useState<CalcMode>('swatch');
  const [itemType, setItemType] = useState<ItemType>('sweater');
  const [fit, setFit] = useState<FitType>('regular');
  const [selectedSample, setSelectedSample] = useState<string>('');
  
  const [swatchData, setSwatchData] = useState({ width: '', height: '', weight: '' });
  const [density, setDensity] = useState({ stitches: '', rows: '' });
  const [measurements, setMeasurements] = useState({
    bust: '90',
    length: '',
    headCircumference: '56',
    scarfLength: '180',
    scarfWidth: '25',
  });
  const [reserve, setReserve] = useState<string>('50');
  const [result, setResult] = useState<{
    totalMeterage: number;
    totalWeight: number;
    perYarn: { yarnId: string; meterage: number; weight: number }[];
  } | null>(null);

  // Длина по умолчанию для каждого типа изделия
  const getDefaultLength = (type: ItemType): string => {
    const defaults: Record<ItemType, string> = {
      sweater: '60',
      cardigan: '65',
      vest: '55',
      tshirt: '55',
      tank: '50',
      hat: '',
      scarf: '',
      gloves: '',
    };
    return defaults[type];
  };

  // Свобода облегания в см для каждой посадки
  const getEase = (fitType: FitType): number => {
    const easeMap: Record<FitType, number> = {
      slim: 6,       // облегающий
      regular: 12,   // стандарт
      loose: 20,     // свободный
      oversize: 32,  // оверсайз (как в твоём PDF)
    };
    return easeMap[fitType];
  };

  // Коэффициент площади (тело + рукава)
  const getAreaMultiplier = (type: ItemType): number => {
    const multipliers: Record<ItemType, number> = {
      sweater: 1.45,   // тело + 2 длинных рукава
      cardigan: 1.50,  // тело + 2 длинных рукава + планки
      vest: 1.05,      // только тело (+ небольшая горловина)
      tshirt: 1.20,    // тело + 2 коротких рукава (~30% от длинного)
      tank: 1.05,      // только тело (как жилет)
      hat: 0,
      scarf: 0,
      gloves: 0,
    };
    return multipliers[type];
  };

  const getItemLabel = (type: ItemType): string => {
    const labels: Record<ItemType, string> = {
      sweater: 'Свитер/пуловер',
      cardigan: 'Кардиган',
      vest: 'Жилет',
      tshirt: 'Футболка',
      tank: 'Майка/топ',
      hat: 'Шапка',
      scarf: 'Шарф',
      gloves: 'Перчатки',
    };
    return labels[type];
  };

  const getFitLabel = (fitType: FitType): string => {
    const labels: Record<FitType, string> = {
      slim: 'Облегающий',
      regular: 'Стандарт',
      loose: 'Свободный',
      oversize: 'Оверсайз',
    };
    return labels[fitType];
  };

  // Автозаполнение при открытии из образца
  useEffect(() => {
    if (isOpen && preselectedSampleId) {
      const sample = samples.find(s => s.id === preselectedSampleId);
      if (sample) {
        setSelectedSample(sample.id);
        if (sample.measurementWidthAfter > 0 && sample.measurementHeightAfter > 0) {
          setSwatchData({
            width: sample.measurementWidthAfter.toFixed(1),
            height: sample.measurementHeightAfter.toFixed(1),
            weight: '',
          });
          const stitchesPer10cm = (sample.stitchesWidthAfter / sample.measurementWidthAfter) * 10;
          const rowsPer10cm = (sample.rowsHeightAfter / sample.measurementHeightAfter) * 10;
          setDensity({
            stitches: stitchesPer10cm.toFixed(1),
            rows: rowsPer10cm.toFixed(1),
          });
        }
        // Автоподстановка длины по умолчанию
        setMeasurements(prev => ({ ...prev, length: getDefaultLength(itemType) }));
      }
    }
  }, [isOpen, preselectedSampleId, samples]);

  // Сброс результата при изменении параметров
  useEffect(() => {
    setResult(null);
    // При смене типа изделия обновляем длину по умолчанию
    setMeasurements(prev => ({ ...prev, length: getDefaultLength(itemType) }));
  }, [itemType]);

  const calculate = () => {
    const selectedYarns = yarns.filter(y => selectedYarnIds.includes(y.id));
    if (selectedYarns.length === 0) {
      alert('Сначала добавь пряжу в образец или проект');
      return;
    }

    const reserveGrams = parseFloat(reserve.replace(',', '.')) || 0;
    let totalWeightGrams = 0;

    if (calcMode === 'swatch') {
      const sWidth = parseFloat(swatchData.width.replace(',', '.'));
      const sHeight = parseFloat(swatchData.height.replace(',', '.'));
      const sWeight = parseFloat(swatchData.weight.replace(',', '.'));

      if (!sWidth || !sHeight || !sWeight) {
        alert('Заполни размеры и вес образца');
        return;
      }

      const swatchArea = sWidth * sHeight;
      let garmentArea = 0;

      if (['sweater', 'cardigan', 'vest', 'tshirt', 'tank'].includes(itemType)) {
        const bust = parseFloat(measurements.bust) || 90;
        const length = parseFloat(measurements.length) || 60;
        const ease = getEase(fit);
        const widthWithEase = bust + ease;
        const areaMultiplier = getAreaMultiplier(itemType);
        garmentArea = widthWithEase * length * areaMultiplier;
      } else if (itemType === 'hat') {
        const head = parseFloat(measurements.headCircumference) || 56;
        garmentArea = head * 25;
      } else if (itemType === 'scarf') {
        const len = parseFloat(measurements.scarfLength) || 180;
        const w = parseFloat(measurements.scarfWidth) || 25;
        garmentArea = len * w;
      } else if (itemType === 'gloves') {
        garmentArea = 400;
      }

      totalWeightGrams = Math.round((garmentArea / swatchArea) * sWeight) + reserveGrams;

    } else {
      // Ориентировочный расчёт
      const stitchesNum = parseFloat(density.stitches.replace(',', '.'));
      if (!stitchesNum || stitchesNum <= 0) {
        alert('Введи плотность (петель в 10 см)');
        return;
      }

      const bust = parseFloat(measurements.bust) || 90;
      const ease = getEase(fit);
      const widthWithEase = bust + ease;
      const length = parseFloat(measurements.length) || 60;
      const areaMultiplier = getAreaMultiplier(itemType);
      const garmentArea = widthWithEase * length * areaMultiplier;

      // Переводим площадь в вес через плотность
      // При плотности 24п/10см и метраже 450м/100г: 1 см² ≈ 0.08 г
      const densityFactor = stitchesNum / 24;
      const baseWeightPerCm2 = 0.08; // грамм на см² при стандартной плотности
      totalWeightGrams = Math.round(garmentArea * baseWeightPerCm2 * densityFactor) + reserveGrams;
    }

    const weightPerYarn = Math.round(totalWeightGrams / selectedYarns.length);
    const perYarn = selectedYarns.map(yarn => ({
      yarnId: yarn.id,
      meterage: Math.round((weightPerYarn / 100) * yarn.meterage),
      weight: weightPerYarn,
    }));

    const totalMeterage = perYarn.reduce((sum, p) => sum + p.meterage, 0);

    setResult({ totalMeterage, totalWeight: totalWeightGrams, perYarn });
  };

  const showLengthField = ['sweater', 'cardigan', 'vest', 'tshirt', 'tank'].includes(itemType);
  const showBustField = ['sweater', 'cardigan', 'vest', 'tshirt', 'tank'].includes(itemType);
  const showFitSelector = ['sweater', 'cardigan', 'vest', 'tshirt', 'tank'].includes(itemType);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-5 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          <i className="fas fa-calculator mr-2 text-emerald-500"></i>
          Калькулятор расхода пряжи
        </h2>

        <div className="space-y-4">
          {/* Переключатель режима */}
          <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <button
              onClick={() => setCalcMode('swatch')}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${
                calcMode === 'swatch' 
                  ? 'bg-white dark:bg-gray-600 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              🎯 По весу образца
            </button>
            <button
              onClick={() => setCalcMode('estimated')}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${
                calcMode === 'estimated' 
                  ? 'bg-white dark:bg-gray-600 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              📊 Ориентировочно
            </button>
          </div>

          {/* Тип изделия */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Тип изделия</label>
            <select
              value={itemType}
              onChange={(e) => setItemType(e.target.value as ItemType)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
            >
              <option value="sweater">Свитер/пуловер</option>
              <option value="cardigan">Кардиган</option>
              <option value="vest">Жилет</option>
              <option value="tshirt">Футболка (короткий рукав)</option>
              <option value="tank">Майка/топ (без рукавов)</option>
              <option value="hat">Шапка</option>
              <option value="scarf">Шарф</option>
              <option value="gloves">Перчатки</option>
            </select>
          </div>

          {/* Посадка (только для одежды) */}
          {showFitSelector && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Посадка: <span className="text-emerald-600 dark:text-emerald-400">{getFitLabel(fit)}</span>
              </label>
              <div className="grid grid-cols-4 gap-1">
                {(['slim', 'regular', 'loose', 'oversize'] as FitType[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setFit(f)}
                    className={`py-1.5 text-xs rounded-md transition-colors ${
                      fit === f 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {getFitLabel(f)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Режим: по весу образца */}
          {calcMode === 'swatch' && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800">
              <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-2">
                <i className="fas fa-balance-scale mr-1"></i> Образец после ВТО
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Ширина (см)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={swatchData.width}
                    onChange={(e) => setSwatchData({ ...swatchData, width: e.target.value.replace(/[^0-9.,]/g, '') })}
                    className="w-full px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Высота (см)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={swatchData.height}
                    onChange={(e) => setSwatchData({ ...swatchData, height: e.target.value.replace(/[^0-9.,]/g, '') })}
                    className="w-full px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-emerald-700 dark:text-emerald-400 font-medium mb-1">Вес (г)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={swatchData.weight}
                    onChange={(e) => setSwatchData({ ...swatchData, weight: e.target.value.replace(/[^0-9.,]/g, '') })}
                    placeholder="12"
                    className="w-full px-2 py-1.5 bg-white dark:bg-gray-800 border-2 border-emerald-300 dark:border-emerald-700 rounded text-sm font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Режим: ориентировочно */}
          {calcMode === 'estimated' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Образец для плотности</label>
                <select
                  value={selectedSample}
                  onChange={(e) => setSelectedSample(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                >
                  <option value="">-- Выбери образец --</option>
                  {samples.map(sample => {
                    const stitchesPerCm = sample.measurementWidthAfter > 0 
                      ? ((sample.stitchesWidthAfter / sample.measurementWidthAfter) * 10).toFixed(1) 
                      : '?';
                    return (
                      <option key={sample.id} value={sample.id}>
                        {sample.needleSize}мм • {stitchesPerCm}п/10см
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Петель в 10 см</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={density.stitches}
                    onChange={(e) => setDensity({ ...density, stitches: e.target.value.replace(/[^0-9.,]/g, '') })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Рядов в 10 см</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={density.rows}
                    onChange={(e) => setDensity({ ...density, rows: e.target.value.replace(/[^0-9.,]/g, '') })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Параметры изделия */}
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <i className="fas fa-ruler-combined mr-1"></i> Параметры изделия
            </h3>
            <div className="space-y-2">
              {showBustField && (
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Обхват груди (см)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={measurements.bust}
                    onChange={(e) => setMeasurements({ ...measurements, bust: e.target.value.replace(/[^0-9]/g, '') })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                  />
                </div>
              )}
              {showLengthField && (
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Длина изделия (см)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={measurements.length}
                    onChange={(e) => setMeasurements({ ...measurements, length: e.target.value.replace(/[^0-9]/g, '') })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                  />
                </div>
              )}
              {itemType === 'hat' && (
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Окружность головы (см)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={measurements.headCircumference}
                    onChange={(e) => setMeasurements({ ...measurements, headCircumference: e.target.value.replace(/[^0-9]/g, '') })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                  />
                </div>
              )}
              {itemType === 'scarf' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Длина (см)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={measurements.scarfLength}
                      onChange={(e) => setMeasurements({ ...measurements, scarfLength: e.target.value.replace(/[^0-9]/g, '') })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Ширина (см)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={measurements.scarfWidth}
                      onChange={(e) => setMeasurements({ ...measurements, scarfWidth: e.target.value.replace(/[^0-9]/g, '') })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Запас */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <i className="fas fa-plus-circle mr-1 text-amber-500"></i> Запас (г)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={reserve}
              onChange={(e) => setReserve(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Рекомендуется +50 г на образец и непредвиденное
            </p>
          </div>

          {/* Кнопка расчёта */}
          <button
            onClick={calculate}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <i className="fas fa-calculator mr-2"></i>
            Рассчитать расход
          </button>

          {/* Результат */}
          {result && (
            <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
              <h3 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-3">
                <i className="fas fa-check-circle mr-1"></i>
                {getItemLabel(itemType)} {calcMode === 'swatch' ? '(точный расчёт)' : '(ориентировочно)'}
              </h3>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Общий вес:</span>
                  <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{result.totalWeight} г</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Всего метража:</span>
                  <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{result.totalMeterage} м</span>
                </div>
              </div>

              {result.perYarn.length > 0 && (
                <div className="border-t border-emerald-200 dark:border-emerald-800 pt-3">
                  <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">По каждой пряже:</h4>
                  <div className="space-y-2">
                    {result.perYarn.map((item, index) => {
                      const yarn = yarns.find(y => y.id === item.yarnId);
                      if (!yarn) return null;
                      return (
                        <div key={index} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded p-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <img src={yarn.photo} alt={yarn.name} className="w-8 h-8 rounded object-cover flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{yarn.name}</div>
                              <div className="text-[10px] text-gray-500">{yarn.meterage} м/100г</div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <div className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{item.weight} г</div>
                            <div className="text-[10px] text-gray-500">≈ {item.meterage} м</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-2.5 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default YarnCalculator;
