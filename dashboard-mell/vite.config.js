import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Gera dist/index.html único, que abre direto no navegador (sem servidor).
export default defineConfig({
  plugins: [react(), viteSingleFile()],
});
