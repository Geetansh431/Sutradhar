import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Vite 8 resolves tsconfig `paths` natively for the app build, but Vitest's
// resolver does not — hence the explicit alias.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 5173, strictPort: true, open: '/?s=live' },
  build: { target: 'baseline-widely-available', sourcemap: true },
  test: { environment: 'node', include: ['src/**/*.{test,spec}.{ts,tsx}'] },
});
