import { useEffect, useRef } from 'react';
import { registerBackHandler } from '../utils/navigationStack';

/**
 * Hook to automatically handle back button for any modal, drawer, or sheet.
 * When isOpen becomes true, it registers a back handler and pushes history state.
 * When the back button is clicked, onClose() is invoked.
 * When closed programmatically (via 'X' or submit), it unregisters and cleans up history.
 */
export function useBackHandler(isOpen: boolean, onClose: () => void, id: string) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const unregister = registerBackHandler(id, () => {
      onCloseRef.current();
    });

    return () => {
      unregister();
    };
  }, [isOpen, id]);
}
