import React, { useState } from 'react';
import { Pattern } from '../types';

interface Props {
  patterns: Pattern[];
  searchQuery: string;
}

const PatternsSection: React.FC<Props> = ({ patterns, searchQuery }) => {
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);

  const filteredPatterns = patterns.filter((pattern) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return pattern.name.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatterns.map((pattern) => (
          <div
            key={pattern.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedPattern(pattern)}
          >
            {pattern.photos.length > 0 ? (
              <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                <img
                  src={pattern.photos[0]}
                  alt={pattern.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-[4/3] bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                <i className="fas fa-file-alt text-4xl text-indigo-200"></i>
              </div>
            )}
            <div className="p-3">
              <h3 className="font-semibold text-gray-800 text-sm truncate">{pattern.name}</h3>
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                {pattern.photos.length > 0 && (
                  <span>
                    <i className="fas fa-image mr-1"></i>{pattern.photos.length} фото
                  </span>
                )}
                {pattern.pdfs.length > 0 && (
                  <span>
                    <i className="fas fa-file-pdf mr-1 text-red-400"></i>{pattern.pdfs.length} PDF
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPatterns.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <i className="fas fa-search text-4xl mb-3"></i>
          <p>Ничего не найдено</p>
        </div>
      )}

      {/* Modal */}
      {selectedPattern && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPattern(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {selectedPattern.photos.length > 0 && (
              <div className="relative">
                <img
                  src={selectedPattern.photos[0]}
                  alt={selectedPattern.name}
                  className="w-full h-48 object-cover rounded-t-2xl"
                />
                <button
                  onClick={() => setSelectedPattern(null)}
                  className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow"
                >
                  <i className="fas fa-times text-gray-600"></i>
                </button>
              </div>
            )}
            <div className="p-5">
              <h2 className="text-xl font-bold text-gray-800">{selectedPattern.name}</h2>

              {/* Photos */}
              {selectedPattern.photos.length > 1 && (
                <div className="mt-4">
                  <h3 className="text-xs text-gray-400 uppercase tracking-wide mb-2">Фотографии</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedPattern.photos.map((photo, i) => (
                      <img key={i} src={photo} alt={`Фото ${i + 1}`} className="w-full aspect-square object-cover rounded-lg" />
                    ))}
                  </div>
                </div>
              )}

              {/* PDFs */}
              {selectedPattern.pdfs.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-xs text-gray-400 uppercase tracking-wide mb-2">Файлы</h3>
                  <div className="space-y-2">
                    {selectedPattern.pdfs.map((pdf, i) => (
                      <div key={i} className="flex items-center gap-3 bg-red-50 rounded-lg p-3 hover:bg-red-100 transition-colors cursor-pointer">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                          <i className="fas fa-file-pdf text-red-500"></i>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">{pdf}</p>
                          <p className="text-xs text-gray-400">PDF документ</p>
                        </div>
                        <i className="fas fa-download text-gray-400"></i>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5 flex gap-2">
                <button className="flex-1 bg-purple-600 text-white py-2.5 rounded-lg font-medium hover:bg-purple-700 transition-colors">
                  <i className="fas fa-edit mr-1"></i> Редактировать
                </button>
                <button
                  onClick={() => setSelectedPattern(null)}
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

export default PatternsSection;
