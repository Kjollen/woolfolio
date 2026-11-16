import React, { useState } from 'react';
import { Pattern } from '../types';
import Modal from './Modal';
import MultiFileUploader from './MultiFileUploader';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pattern: Pattern) => void;
}

const AddPatternForm: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    link: '',
  });
  
  const [photos, setPhotos] = useState<string[]>([]);
  const [pdfs, setPdfs] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newPattern: Pattern = {
      id: `pat_${Date.now()}`,
      name: formData.name,
      photos,
      pdfs,
      link: formData.link,
    };
    
    onSave(newPattern);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-5">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Добавить схему</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Название */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Название *
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

          {/* Фото */}
          <MultiFileUploader
            values={photos}
            onChange={setPhotos}
            accept="image/*"
            label="Фото схемы"
            placeholder="Вставьте URL или загрузите фото"
            maxFiles={10}
          />

          {/* PDF */}
          <MultiFileUploader
            values={pdfs}
            onChange={setPdfs}
            accept=".pdf,application/pdf"
            label="PDF файлы"
            placeholder="Вставьте URL или загрузите PDF"
            maxFiles={5}
          />

          {/* Ссылка */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ссылка на схему
            </label>
            <input
              type="url"
              name="link"
              value={formData.link}
              onChange={handleChange}
              placeholder="https://..."
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

export default AddPatternForm;
