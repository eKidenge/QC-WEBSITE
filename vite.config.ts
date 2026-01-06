import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  base: '/', // Important for Vercel
  build: {
    outDir: 'dist',
    sourcemap: false, // Faster builds
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'zego-vendor': ['@zegocloud/zego-uikit-prebuilt', 'zego-zim-web'],
        }
      }
    }
  },
  server: {
    port: 5173,
    host: true, // Allow external access
  }
});