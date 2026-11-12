import React, { useState, useEffect } from 'react';
import { Sample, Yarn, YarnUsage } from '../types';
import Modal from './Modal';
import FileUploader from './FileUploader';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (sample: Sample) => void;
  yarns: Yarn[];
  sample: Sample | null;
}

const EditSampleForm: React.FC<Props> = ({ isOpen, onClose, onSave, yarns, sample }) => {
  const [formData, setFormData] = useState({
    needleSize: '',
    photoBefore: '',
    stitchesWidthBefore: '',
    rowsHeightBefore: '',
    measurementWidthBefore: '',
    measurementHeightBefore: '',
    photoAfter: '',
    stitchesWidthAfter: '',
    rowsHeightAfter: '',
    measurementWidthAfter: '',
    measurementHeightAfter: '',
  });
  const [yarnUsages, setYarnUsages] = useState<YarnUsage[]>([]);

  // Заполнение формы при открытии
  useEffect(() => {
    if (sample) {
      setFormData({
        needleSize: String(sample.needleSize),
        photoBefore: sample.photoBefore || '',
        stitchesWidthBefore: String(sample.stitchesWidthBefore),
        rowsHeightBefore: String(sample.rowsHeightBefore),
        measurementWidthBefore: String(sample.measurementWidthBefore),
        measurementHeightBefore: String(sample.measurementHeightBefore),
        photoAfter: sample.photoAfter || '',
        stitchesWidthAfter: String(sample.stitchesWidthAfter),
        rowsHeightAfter: String(sample.rowsHeightAfter),
        measurementWidthAfter: String(sample.measurementWidthAfter),
        measurementHeightAfter: String(sample.measurementHeightAfter),
      });
      setYarnUsages(sample.yarnUsages || []);
    }
  }, [sample]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addYarnUsage = () => {
    if (yarns.length === 0) return;
    setYarnUsages([...yarnUsages, { yarnId: yarns[0].id, folds: 1 }]);
  };

  const updateYarnUsage = (index: number, field: keyof YarnUsage, value: string | number) => {
    const updated = [...yarnUsages];
    updated[index] = { ...updated[index], [field]: value };
    setYarnUsages(updated);
  };

  const removeYarnUsage = (index: number) => {
    setYarnUsages(yarnUsages.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sample) return;
    const updatedSample: Sample = {
      ...sample,
      yarnUsages,
      needleSize: Number(formData.needleSize) || 0,
      photoBefore: formData.photoBefore,
      stitchesWidthBefore: Number(formData.stitchesWidthBefore) || 0,
      rowsHeightBefore: Number(formData.rowsHeightBefore) || 0,
      measurementWidthBefore: Number(formData.measurementWidthBefore) || 10,
      measurementHeightBefore: Number(formData.measurementHeightBefore) || 10,
      photoAfter: formData.photoAfter,
      stitchesWidthAfter: Number(formData.stitchesWidthAfter) || 0,
      rowsHeightAfter: Number(formData.rowsHeightAfter) || 0,
      measurementWidthAfter: Number(formData.measurementWidthAfter) || 10,
      measurementHeightAfter: Number(formData.measurementHeightAfter) || 10,
    };
    onSave(updatedSample);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-5">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Редактировать образец</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Пряжа */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                <i className="fas fa-yin-yang mr-1 text-emerald-500"></i> Пряжа
              </h3>
              <button
                type="button"
                onClick={addYarnUsage}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                <i className="fas fa-plus mr-1"></i> Добавить
              </button>
            </div>
            <div className="space-y-2">
              {yarnUsages.map((usage, index) => (
                <div key={index} className="flex gap-2 items-center bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                  <select
                    value={usage.yarnId}
                    onChange={(e) => updateYarnUsage(index, 'yarnId', e.target.value)}
                    className="flex-1 min-w-0 px-2 py-1.5 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded text-sm text-gray-900 dark:text-gray-100"
                  >
                    {yarns.map((yarn) => (
                      <option key={yarn.id} value={yarn.id}>{yarn.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={usage.folds}
                    onChange={(e) => updateYarnUsage(index, 'folds', Number(e.target.value))}
                    min="1"
                    placeholder="×"
                    className="w-14 sm:w-16 flex-shrink-0 px-2 py-1.5 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded text-sm text-gray-900 dark:text-gray-100 text-center"
                  />
                  <button
                    type="button"
                    onClick={() => removeYarnUsage(index)}
                    className="text-red-500 hover:text-red-600 flex-shrink-0 px-1"
                  >
                    <i className="fas fa-trash text-sm"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>
          {/* Спицы */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Спицы (мм)
            </label>
            <input
              type="number"
              name="needleSize"
              value={formData.needleSize}
              onChange={handleChange}
              min="0"
              step="0.5"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          {/* До ВТО */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
              <i className="fas fa-tint mr-1"></i> До ВТО
            </h3>
            <div className="space-y-2">
              <FileUploader
                value={formData.photoBefore}
                onChange={(value) => setFormData({ ...formData, photoBefore: value })}
                accept="image/*"
                label="Фото до ВТО"
                placeholder="Вставьте URL или загрузите фото"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  name="stitchesWidthBefore"
                  value={formData.stitchesWidthBefore}
                  onChange={handleChange}
                  placeholder="Петли"
                  className="px-2 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-gray-100"
                />
                <input
                  type="number"
                  name="rowsHeightBefore"
                  value={formData.rowsHeightBefore}
                  onChange={handleChange}
                  placeholder="Ряды"
                  className="px-2 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-gray-100"
                />
                <input
                  type="number"
                  name="measurementWidthBefore"
                  value={formData.measurementWidthBefore}
                  onChange={handleChange}
                  placeholder="Ширина (см)"
                  className="px-2 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-gray-100"
                />
                <input
                  type="number"
                  name="measurementHeightBefore"
                  value={formData.measurementHeightBefore}
                  onChange={handleChange}
                  placeholder="Высота (см)"
                  className="px-2 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </div>
          {/* После ВТО */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
            <h3 className="text-sm font-semibold text-green-700 dark:text-green-300 mb-2">
              <i className="fas fa-check-circle mr-1"></i> После ВТО
            </h3>
            <div className="space-y-2">
              <FileUploader
                value={formData.photoAfter}
                onChange={(value) => setFormData({ ...formData, photoAfter: value })}
                accept="image/*"
                label="Фото после ВТО"
                placeholder="Вставьте URL или загрузите фото"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  name="stitchesWidthAfter"
                  value={formData.stitchesWidthAfter}
                  onChange={handleChange}
                  placeholder="Петли"
                  className="px-2 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-gray-100"
                />
                <input
                  type="number"
                  name="rowsHeightAfter"
                  value={formData.rowsHeightAfter}
                  onChange={handleChange}
                  placeholder="Ряды"
                  className="px-2 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-gray-100"
                />
                <input
                  type="number"
                  name="measurementWidthAfter"
                  value={formData.measurementWidthAfter}
                  onChange={handleChange}
                  placeholder="Ширина (см)"
                  className="px-2 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-gray-100"
                />
                <input
                  type="number"
                  name="measurementHeightAfter"
                  value={formData.measurementHeightAfter}
                  onChange={handleChange}
                  placeholder="Высота (см)"
                  className="px-2 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </div>
          {/* Кнопки */}
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              <i className="fas fa-save mr-1"></i> Сохранить
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-2.5 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default EditSampleForm;
