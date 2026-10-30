import { useRef, useState, useCallback } from 'react';

interface SwipeState {
  startX: number;
  currentX: number;
  isDragging: boolean;
}

export function useSwipeToOpen(onOpen: () => void, edgeThreshold = 30) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const swipeState = useRef<SwipeState>({
    startX: 0,
    currentX: 0,
    isDragging: false,
  });

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    // Только если свайп начинается у левого края
    if (touch.clientX < edgeThreshold) {
      swipeState.current.startX = touch.clientX;
      swipeState.current.isDragging = true;
    }
  }, [edgeThreshold]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swipeState.current.isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - swipeState.current.startX;
    
    // Только вправо
    if (diff > 0) {
      swipeState.current.currentX = currentX;
      setSwipeOffset(Math.min(diff, 264)); // Максимум = ширина панели
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!swipeState.current.isDragging) return;
    
    const diff = swipeState.current.currentX - swipeState.current.startX;
    
    // Если протащили больше 100px - открываем
    if (diff > 100) {
      onOpen();
    }
    
    setSwipeOffset(0);
    swipeState.current.isDragging = false;
    swipeState.current.startX = 0;
    swipeState.current.currentX = 0;
  }, [onOpen]);

  return {
    swipeOffset,
    swipeHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}
