import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Expose NEXT_PUBLIC_* env vars to the client bundle so existing .env files
  // with NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY still work.
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
});
