import firestore from '@react-native-firebase/firestore';

let initialized = false;

/**
 * Configure Firestore once at app startup.
 * Enables offline persistence so cached data remains available during brief network outages.
 */
export function initializeFirebase(): void {
  if (initialized) {
    return;
  }

  firestore().settings({
    persistence: true,
    ignoreUndefinedProperties: true,
  });

  initialized = true;
}

/** Returns true when the error is a DNS / host resolution failure on Android. */
export function isHostResolutionError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: unknown }).message)
        : String(error);

  return (
    message.includes('Unable to resolve host') ||
    message.includes('UnknownHostException') ||
    message.includes('Network request failed') ||
    message.includes('UNAVAILABLE')
  );
}

/** User-friendly message for Firestore network failures. */
export function getFirestoreErrorMessage(error: unknown): string {
  if (isHostResolutionError(error)) {
    return 'Cannot reach Firebase. Check your internet connection, disable Private DNS/VPN, and cold-reboot the Android emulator if needed.';
  }

  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';

  if (code === 'firestore/failed-precondition') {
    return 'This query requires a Firestore index. Check the Metro log for the index creation link.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred.';
}
