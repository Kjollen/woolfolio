import React, { useState } from 'react';
import { Project, Yarn, YarnUsage } from '../types';
import Modal from './Modal';
import MultiFileUploader from './MultiFileUploader';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Project) => void;
  yarns: Yarn[];
}

const AddProjectForm: React.FC<Props> = ({ isOpen, onClose, onSave, yarns }) => {
  const [formData, setFormData] = useState({
    name: '',
    stage: 'planned' as 'planned' | 'in_progress' | 'completed',
    needleSize: '',
    startDate: '',
    endDate: '',
    notes: '',
  });
  
  const [photos, setPhotos] = useState<string[]>([]);

  const [yarnUsages, setYarnUsages] = useState<YarnUsage[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addYarnUsage = () => {
    if (yarns.length === 0) return;
    setYarnUsages([...yarnUsages, { yarnId: yarns[0].id, folds: 1, consumed: 0 }]);
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
    
    const newProject: Project = {
      id: `p_${Date.now()}`,
      photos,
      name: formData.name,
      stage: formData.stage,
      yarnUsages,
      needleSize: Number(formData.needleSize) || 0,
      startDate: formData.startDate,
      endDate: formData.endDate,
      notes: formData.notes,
    };
    
    onSave(newProject);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-5">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Добавить проект</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Название */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Название проекта *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Стадия */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Стадия
            </label>
            <select
              name="stage"
              value={formData.stage}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700 text-gray-900 dark:text-gray-100"
            >
              <option value="planned">В планах</option>
              <option value="in_progress">В процессе</option>
              <option value="completed">Завершено</option>
            </select>
          </div>

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
                <i className="fas fa-plus mr-1"></i> Добавить пряжу
              </button>
            </div>

            {yarnUsages.length === 0 && (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                Пряжа не добавлена
              </p>
            )}

            <div className="space-y-3">
              {yarnUsages.map((usage, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Пряжа #{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeYarnUsage(index)}
                      className="text-red-500 hover:text-red-600 text-sm"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={usage.yarnId}
                      onChange={(e) => updateYarnUsage(index, 'yarnId', e.target.value)}
                      className="col-span-2 px-2 py-1.5 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded text-sm text-gray-900 dark:text-gray-100"
                    >
                      {yarns.map((yarn) => (
                        <option key={yarn.id} value={yarn.id}>
                          {yarn.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={usage.folds}
                      onChange={(e) => updateYarnUsage(index, 'folds', Number(e.target.value))}
                      min="1"
                      placeholder="Сложений"
                      className="px-2 py-1.5 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded text-sm text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <input
                    type="number"
                    value={usage.consumed || 0}
                    onChange={(e) => updateYarnUsage(index, 'consumed', Number(e.target.value))}
                    min="0"
                    placeholder="Расход (г)"
                    className="w-full mt-2 px-2 py-1.5 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded text-sm text-gray-900 dark:text-gray-100"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Спицы и даты */}
          <div className="grid grid-cols-3 gap-3">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Дата начала
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Дата завершения
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Фото */}
          <MultiFileUploader
            values={photos}
            onChange={setPhotos}
            accept="image/*"
            label="Фото проекта"
            placeholder="Вставьте URL или загрузите фото"
            maxFiles={5}
          />

          {/* Заметки */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Заметки
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700 text-gray-900 dark:text-gray-100"
            />
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

export default AddProjectForm;
