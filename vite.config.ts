import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isDev = mode === 'development';
    return {
      base: './',
      server: {
        port: 3000,
        host: 'localhost',
        open: true,
      },
      build: {
        sourcemap: isDev ? true : false,
        minify: isDev ? false : 'terser',
        // Production security settings
        terserOptions: isDev ? undefined : {
          compress: {
            drop_console: true,      // Remove all console.* calls
            drop_debugger: true,     // Remove debugger statements
            pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
          },
          mangle: {
            safari10: true,
          },
          format: {
            comments: false,         // Remove all comments
          },
        },
        rollupOptions: {
          output: {
            // Obfuscate chunk names in production
            chunkFileNames: isDev ? '[name]-[hash].js' : 'assets/[hash].js',
            entryFileNames: isDev ? '[name]-[hash].js' : 'assets/[hash].js',
            assetFileNames: isDev ? '[name]-[hash].[ext]' : 'assets/[hash].[ext]',
            manualChunks(id) {
              if (id.includes('node_modules')) {
                if (id.includes('three') || id.includes('@react-three')) {
                  return 'vendor-three';
                }
                if (id.includes('react-router') || id.includes('react-dom') || id.includes('react/')) {
                  return 'vendor-react';
                }
                if (id.includes('framer-motion') || id.includes('lenis')) {
                  return 'vendor-motion';
                }
                if (id.includes('lucide-react')) {
                  return 'vendor-icons';
                }
                if (id.includes('xlsx')) {
                  return 'vendor-xlsx';
                }
                if (id.includes('@supabase') || id.includes('bcryptjs')) {
                  return 'vendor-supabase';
                }
              }
            }
          }
        }
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
