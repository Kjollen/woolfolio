import React, { useState, useEffect } from 'react';
import { Yarn } from '../types';
import Modal from './Modal';
import FileUploader from './FileUploader';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (yarn: Yarn) => void;
}

const AddYarnForm: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    photo: '',
    name: '',
    manufacturer: '',
    article: '',
    composition: '',
    color: '',
    totalWeight: '',
    meterage: '',
    shop: '',
    orderNumber: '',
    pricePerGram: '',
    totalPrice: '',
  });

  // ✅ СБРОС ФОРМЫ ПРИ КАЖДОМ ОТКРЫТИИ
  useEffect(() => {
    if (isOpen) {
      setFormData({
        photo: '',
        name: '',
        manufacturer: '',
        article: '',
        composition: '',
        color: '',
        totalWeight: '',
        meterage: '',
        shop: '',
        orderNumber: '',
        pricePerGram: '',
        totalPrice: '',
      });
    }
  }, [isOpen]);

  // Автоматический расчёт общего метража
  const calculatedTotalMeterage = (() => {
    const weight = Number(formData.totalWeight);
    const meterage = Number(formData.meterage);
    if (weight > 0 && meterage > 0) {
      return Math.round((weight * meterage) / 100);
    }
    return 0;
  })();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newYarn = {
      photo: formData.photo || 'https://images.unsplash.com/photo-1582719508461-905c6737f1fd?w=300&h=300&fit=crop',
      name: formData.name,
      manufacturer: formData.manufacturer,
      article: formData.article,
      composition: formData.composition,
      color: formData.color,
      totalWeight: Number(formData.totalWeight) || 0,
      meterage: Number(formData.meterage) || 0,
      totalMeterage: calculatedTotalMeterage,
      shop: formData.shop,
      orderNumber: formData.orderNumber,
      pricePerGram: Number(formData.pricePerGram) || 0,
      totalPrice: Number(formData.totalPrice) || 0,
    };
    onSave(newYarn as any);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-5">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Добавить пряжу</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Фото */}
          <FileUploader
            value={formData.photo}
            onChange={(value) => setFormData({ ...formData, photo: value })}
            accept="image/*"
            label="Фото пряжи"
            placeholder="Вставьте URL или загрузите фото"
          />
          {/* Название и производитель */}
          <div className="grid grid-cols-2 gap-3">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Производитель
              </label>
              <input
                type="text"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          {/* Артикул и состав */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Артикул
              </label>
              <input
                type="text"
                name="article"
                value={formData.article}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Состав
              </label>
              <input
                type="text"
                name="composition"
                value={formData.composition}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          {/* Цвет */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Цвет
            </label>
            <input
              type="text"
              name="color"
              value={formData.color}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          {/* Вес и метраж */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Общий вес (г) *
              </label>
              <input
                type="number"
                name="totalWeight"
                value={formData.totalWeight}
                onChange={handleChange}
                required
                min="0"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Метраж (м/100г)
              </label>
              <input
                type="number"
                name="meterage"
                value={formData.meterage}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Общий метраж (м)
              </label>
              <div className="w-full px-3 py-2 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-700 dark:text-emerald-300 font-medium">
                {calculatedTotalMeterage > 0 ? calculatedTotalMeterage : '—'}
              </div>
            </div>
          </div>
          {/* Покупка */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              <i className="fas fa-shopping-bag mr-1 text-emerald-500"></i> Информация о покупке
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Магазин
                </label>
                <input
                  type="text"
                  name="shop"
                  value={formData.shop}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  № Заказа
                </label>
                <input
                  type="text"
                  name="orderNumber"
                  value={formData.orderNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Цена за грамм (₽)
                </label>
                <input
                  type="number"
                  name="pricePerGram"
                  value={formData.pricePerGram}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Общая сумма (₽)
                </label>
                <input
                  type="number"
                  name="totalPrice"
                  value={formData.totalPrice}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700 text-gray-900 dark:text-gray-100"
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

export default AddYarnForm;
