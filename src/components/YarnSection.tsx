import React, { useState } from 'react';
import { Yarn } from '../types';

interface Props {
  yarns: Yarn[];
  searchQuery: string;
}

const YarnSection: React.FC<Props> = ({ yarns, searchQuery }) => {
  const [selectedYarn, setSelectedYarn] = useState<Yarn | null>(null);

  const filteredYarns = yarns.filter((yarn) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      yarn.name.toLowerCase().includes(q) ||
      yarn.manufacturer.toLowerCase().includes(q) ||
      yarn.article.toLowerCase().includes(q) ||
      yarn.composition.toLowerCase().includes(q) ||
      yarn.color.toLowerCase().includes(q) ||
      yarn.shop.toLowerCase().includes(q) ||
      yarn.orderNumber.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredYarns.map((yarn) => (
          <div
            key={yarn.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedYarn(yarn)}
          >
            <div className="aspect-square bg-gray-100 overflow-hidden">
              <img
                src={yarn.photo}
                alt={yarn.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-3">
              <h3 className="font-semibold text-gray-800 text-sm truncate">{yarn.name}</h3>
              <p className="text-xs text-gray-500">{yarn.manufacturer} • {yarn.article}</p>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-gray-600">{yarn.color}</span>
                <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                  {yarn.remaining}г
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredYarns.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <i className="fas fa-search text-4xl mb-3"></i>
          <p>Ничего не найдено</p>
        </div>
      )}

      {/* Modal */}
      {selectedYarn && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedYarn(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <img src={selectedYarn.photo} alt={selectedYarn.name} className="w-full h-48 object-cover rounded-t-2xl" />
              <button
                onClick={() => setSelectedYarn(null)}
                className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow"
              >
                <i className="fas fa-times text-gray-600"></i>
              </button>
            </div>
            <div className="p-5">
              <h2 className="text-xl font-bold text-gray-800">{selectedYarn.name}</h2>
              <p className="text-sm text-gray-500 mt-1">{selectedYarn.manufacturer} • Арт. {selectedYarn.article}</p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <InfoItem label="Состав" value={selectedYarn.composition} />
                <InfoItem label="Цвет" value={selectedYarn.color} />
                <InfoItem label="Вес мотка" value={`${selectedYarn.weight} г`} />
                <InfoItem label="Метраж" value={`${selectedYarn.meterage} м/100г`} />
                <InfoItem label="Общий метраж" value={`${selectedYarn.totalMeterage} м`} />
                <InfoItem label="Остаток" value={`${selectedYarn.remaining} г`} highlight />
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <h3 className="font-semibold text-gray-700 text-sm mb-2">
                  <i className="fas fa-shopping-bag mr-1 text-pink-400"></i> Информация о покупке
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <InfoItem label="Магазин" value={selectedYarn.shop} />
                  <InfoItem label="№ Заказа" value={selectedYarn.orderNumber} />
                  <InfoItem label="Цена за грамм" value={`${selectedYarn.pricePerGram} ₽`} />
                  <InfoItem label="Общая сумма" value={`${selectedYarn.totalPrice} ₽`} />
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <button className="flex-1 bg-purple-600 text-white py-2.5 rounded-lg font-medium hover:bg-purple-700 transition-colors">
                  <i className="fas fa-edit mr-1"></i> Редактировать
                </button>
                <button
                  onClick={() => setSelectedYarn(null)}
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

const InfoItem: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div>
    <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
    <p className={`text-sm font-medium ${highlight ? 'text-purple-700' : 'text-gray-700'}`}>{value}</p>
  </div>
);

export default YarnSection;
