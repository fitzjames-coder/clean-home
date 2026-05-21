import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

/**
 * Returns the lazily-initialised Supabase client.
 * Throws a descriptive Error if the required env vars are absent.
 */
export function getSupabase(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    const missing = [
      !url && 'NEXT_PUBLIC_SUPABASE_URL',
      !key && 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ]
      .filter(Boolean)
      .join(', ');
    throw new Error(
      `Missing Supabase environment variable(s): ${missing}. ` +
        'Add them to .env.local (local) or the Vercel project environment variables (production).'
    );
  }

  // Basic format sanity-check so mis-pasted values surface clearly.
  if (!url.startsWith('https://')) {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL looks wrong (got "${url}"). ` +
        'It should start with https:// and end with .supabase.co'
    );
  }

  _client = createClient(url, key);
  return _client;
}

/**
 * A proxy over the Supabase client that:
 *  - Defers initialisation until first use (safe for SSR build steps)
 *  - Binds every method to the real client so that `this` is always correct
 *
 * Without the bind, chained calls like `supabase.from('t').select()` fail
 * because the bare method reference loses its `this` context.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop: string | symbol) {
    const client = getSupabase();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    // Bind functions so `this` inside them is always the real client instance.
    if (typeof value === 'function') {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }
    return value;
  },
});
