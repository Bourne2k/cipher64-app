import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import tailwindcss from '@tailwindcss/postcss'; // <-- 1. Import the PostCSS package
import path from 'path';

export default defineConfig({
  plugins: [
    TanStackRouterVite({
      target: 'react',
      autoRoutePath: './src/routes'
    }),
    react() // <-- 2. Remove tailwindcss() from the Vite plugins array
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  // 3. Remove the empty preprocessorOptions and mount Tailwind v4 here
  css: {
    postcss: {
      plugins: [
        tailwindcss()
      ]
    }
  }
});