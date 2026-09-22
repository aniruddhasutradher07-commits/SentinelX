import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import svgr from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), svgr({ svgrOptions: { svgo: false } })],
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
});
