/**
 * Extracts a human-readable message from anything that can be thrown.
 *
 * Supabase returns PostgrestError objects (not instanceof Error) with a
 * `message` string property, plus an optional `hint` and `details` field.
 * Using `instanceof Error` alone silently swallows those messages.
 */
export function extractErrorMessage(e: unknown): string {
  if (!e) return 'Unknown error';

  // Standard JS Error
  if (e instanceof Error) return e.message;

  // Supabase PostgrestError / StorageError – plain object with a message field
  if (typeof e === 'object' && e !== null) {
    const obj = e as Record<string, unknown>;

    const parts: string[] = [];

    if (typeof obj.message === 'string' && obj.message) {
      parts.push(obj.message);
    }
    if (typeof obj.hint === 'string' && obj.hint) {
      parts.push(`Hint: ${obj.hint}`);
    }
    if (typeof obj.details === 'string' && obj.details) {
      parts.push(`Details: ${obj.details}`);
    }
    if (parts.length) return parts.join(' — ');

    // Last resort: stringify
    try {
      return JSON.stringify(e);
    } catch {
      return String(e);
    }
  }

  return String(e);
}

/**
 * Logs a structured error to the console.
 * All errors are logged in production so they appear in Vercel function logs.
 */
export function logError(context: string, error: unknown): void {
  const message = extractErrorMessage(error);
  // Include the raw object so Vercel logs capture code/status/hint fields too.
  console.error(`[CleanHome] ${context}:`, message, error);
}
