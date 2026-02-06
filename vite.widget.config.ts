import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// Widget build configuration
// Build with: npx vite build --config vite.widget.config.ts
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  publicDir: false,
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/widget/index.tsx'),
      name: 'RebaseServicesWidget',
      formats: ['iife'],
      fileName: () => 'widget.js',
    },
    cssCodeSplit: false,
    outDir: 'public',
    emptyOutDir: false,
    minify: false, // Disabled - we use terser CLI post-build in GitHub Actions
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        manualChunks: undefined,
        // Ensure CSS is inlined
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'widget.css';
          }
          return assetInfo.name || 'asset';
        },
      },
    },
  },
});
