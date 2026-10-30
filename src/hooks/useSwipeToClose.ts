import { useRef, useState, useCallback } from 'react';

interface SwipeState {
  startY: number;
  currentY: number;
  isDragging: boolean;
}

export function useSwipeToClose(onClose: () => void, threshold = 100) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const swipeState = useRef<SwipeState>({
    startY: 0,
    currentY: 0,
    isDragging: false,
  });

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    swipeState.current.startY = e.touches[0].clientY;
    swipeState.current.isDragging = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swipeState.current.isDragging) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - swipeState.current.startY;
    
    // Только вниз
    if (diff > 0) {
      swipeState.current.currentY = currentY;
      setSwipeOffset(diff);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!swipeState.current.isDragging) return;
    
    const diff = swipeState.current.currentY - swipeState.current.startY;
    
    if (diff > threshold) {
      onClose();
    }
    
    setSwipeOffset(0);
    swipeState.current.isDragging = false;
    swipeState.current.startY = 0;
    swipeState.current.currentY = 0;
  }, [onClose, threshold]);

  return {
    swipeOffset,
    swipeHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}
