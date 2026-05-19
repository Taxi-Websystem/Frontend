import { useEffect, type RefObject } from 'react';

export function useOnClickOutside<T extends HTMLElement>(
  containerRef: RefObject<T | null>,
  onOutsideClick: () => void
): void {
  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        onOutsideClick();
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, [containerRef, onOutsideClick]);
}
