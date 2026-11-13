import React, { useEffect } from 'react';
import { useSwipeToClose } from '../hooks/useSwipeToClose';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<Props> = ({ isOpen, onClose, children }) => {
  const { swipeOffset, swipeHandlers } = useSwipeToClose(onClose, 100);

  // Закрытие по Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: `translateY(${swipeOffset}px)`,
          transition: swipeOffset === 0 ? 'transform 0.3s ease-out' : 'none',
        }}
      >
        {/* Swipe indicator */}
        <div
          className="sticky top-0 flex justify-center pt-2 pb-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm z-10 md:hidden"
          {...swipeHandlers}
        >
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 bg-white/90 dark:bg-gray-700/90 rounded-full flex items-center justify-center shadow z-20"
        >
          <i className="fas fa-times text-gray-600 dark:text-gray-300"></i>
        </button>

        {children}
      </div>
    </div>
  );
};

export default Modal;
