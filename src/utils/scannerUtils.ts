import { Html5Qrcode } from 'html5-qrcode';

/**
 * Safely stops and clears an Html5Qrcode instance without throwing
 * "Cannot stop, scanner is not running or paused." or unhandled Promise rejections.
 */
export async function safeStopScanner(scanner: Html5Qrcode | null | undefined): Promise<void> {
  if (!scanner) return;
  try {
    let shouldStop = false;
    try {
      if (typeof scanner.getState === 'function') {
        const state = scanner.getState();
        // Html5QrcodeScannerState: 2 = SCANNING, 3 = PAUSED
        shouldStop = state === 2 || state === 3;
      } else {
        shouldStop = !!scanner.isScanning;
      }
    } catch {
      shouldStop = !!scanner.isScanning;
    }

    if (shouldStop) {
      await scanner.stop();
    }
  } catch (err) {
    // Gracefully swallow "Cannot stop, scanner is not running or paused."
  } finally {
    try {
      scanner.clear();
    } catch {
      // ignore clear errors
    }
  }
}
