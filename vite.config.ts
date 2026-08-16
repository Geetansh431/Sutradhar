import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Vite 8 resolves tsconfig `paths` natively — no vite-tsconfig-paths plugin needed.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, strictPort: true, open: '/?s=live' },
  build: { target: 'baseline-widely-available', sourcemap: true },
});
