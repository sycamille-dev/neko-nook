import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(`v${Date.now()}`)
  },
  plugins: [viteSingleFile()],
  build: {
    chunkSizeWarningLimit: 2000
  }
});
