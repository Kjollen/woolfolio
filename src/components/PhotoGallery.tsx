import React, { useState } from 'react';

interface Props {
  photos: string[];
  initialIndex?: number;
}

const PhotoGallery: React.FC<Props> = ({ photos, initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);

  if (photos.length === 0) return null;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const handleImageClick = () => {
    setIsZoomed(!isZoomed);
  };

  return (
    <div className="relative">
      {/* Main image */}
      <div 
        className="relative overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-zoom-in"
        onClick={handleImageClick}
      >
        <img
          src={photos[currentIndex]}
          alt={`Фото ${currentIndex + 1}`}
          className={`w-full object-cover transition-transform duration-300 ${
            isZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100'
          }`}
          style={{ maxHeight: '400px' }}
        />
        
        {/* Navigation arrows */}
        {photos.length > 1 && !isZoomed && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 dark:bg-gray-900/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white dark:hover:bg-gray-900 transition-colors"
            >
              <i className="fas fa-chevron-left text-gray-700 dark:text-gray-300"></i>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 dark:bg-gray-900/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white dark:hover:bg-gray-900 transition-colors"
            >
              <i className="fas fa-chevron-right text-gray-700 dark:text-gray-300"></i>
            </button>
          </>
        )}

        {/* Counter */}
        {photos.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
            {currentIndex + 1} / {photos.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {photos.length > 1 && !isZoomed && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
          {photos.map((photo, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? 'border-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-800'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={photo} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;
