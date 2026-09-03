/**
 * Global Navigation Stack & Hardware/Browser Back-button Interceptor
 * Prevents accidental app exit / restart on a single back click.
 * Handles closing modals, returning to home screen from tabs, and
 * double-back confirmation to exit the app.
 */

type BackHandler = () => void;

interface StackItem {
  id: string;
  handler: BackHandler;
}

const backStack: StackItem[] = [];
let isProgrammaticBack = false;
let lastBackPressTime = 0;
let onDoubleBackExitToast: (() => void) | null = null;
let getIsOnHomeTab: (() => boolean) | null = null;

export function setNavigationCallbacks(callbacks: {
  showExitToast: () => void;
  isHome: () => boolean;
}) {
  onDoubleBackExitToast = callbacks.showExitToast;
  getIsOnHomeTab = callbacks.isHome;
}

// Ensure the browser history has an anchor state so the first back press can be intercepted
export function initializeHistoryAnchor() {
  if (typeof window === 'undefined') return;

  try {
    const state = window.history.state;
    if (!state || !state.krowAnchor) {
      window.history.replaceState({ krowAnchor: true, step: 'root' }, '');
      window.history.pushState({ krowAnchor: true, step: 'app' }, '');
    }
  } catch (err) {
    console.warn('History init warning:', err);
  }
}

if (typeof window !== 'undefined') {
  initializeHistoryAnchor();

  window.addEventListener('popstate', () => {
    // If the back was triggered programmatically (e.g. by an 'X' button cleanup), do nothing
    if (isProgrammaticBack) {
      isProgrammaticBack = false;
      return;
    }

    // 1. If any modal or nested subview registered a back handler, close the top-most one
    if (backStack.length > 0) {
      const top = backStack.pop();
      if (top) {
        try {
          top.handler();
        } catch (e) {
          console.error('Error executing back handler:', e);
        }
      }
      return;
    }

    // 2. No modal is open. Check if user is on Home screen
    const isHome = getIsOnHomeTab ? getIsOnHomeTab() : true;
    if (isHome) {
      const now = Date.now();
      if (now - lastBackPressTime < 2200) {
        // User clicked back twice within 2.2s: allow normal browser back / exit
        return;
      } else {
        // First back press on Home: push anchor state back to prevent app restart/exit
        lastBackPressTime = now;
        try {
          window.history.pushState({ krowAnchor: true, step: 'app' }, '');
        } catch {}

        if (onDoubleBackExitToast) {
          onDoubleBackExitToast();
        }
      }
    }
  });
}

/**
 * Register a modal or view to be closed when the browser/device back button is pressed.
 * Returns an unregister function to call when the modal closes naturally (via UI button).
 */
export function registerBackHandler(id: string, handler: BackHandler): () => void {
  if (typeof window === 'undefined') return () => {};

  try {
    window.history.pushState({ krowModal: id, t: Date.now() }, '');
  } catch {}

  const item: StackItem = { id, handler };
  backStack.push(item);

  return () => {
    const idx = backStack.findIndex((x) => x === item);
    if (idx !== -1) {
      backStack.splice(idx, 1);
      // Clean up the browser history entry pushed for this modal
      isProgrammaticBack = true;
      try {
        window.history.back();
      } catch {
        isProgrammaticBack = false;
      }
    }
  };
}
